const { chromium } = require('playwright');

// ── Credenciales UPAO ──────────────────────────────────────────────────────
const UPAO_USER = '000280169';
const UPAO_PASS = 'AlmiGamer12';

// ── DNS sobre HTTPS (Google) para evitar bloqueos de resolución ────────────
const DNS_FALLBACKS = {
  'experience.elluciancloud.com':             '98.87.139.168',
  'eee-dashboard-prod.10005.elluciancloud.com':'98.87.139.168',
  'upaosso.upao.edu.pe':                      '200.62.147.92',
  'ssb.upao.edu.pe':                          '129.153.7.236',
  'login.upao.edu.pe':                        '129.153.7.236',
};

async function resolveIP(host, fallback) {
  try {
    const r = await fetch(`https://dns.google/resolve?name=${host}&type=A`);
    const d = await r.json();
    const a = d.Answer?.find(x => x.type === 1);
    return a?.data || fallback;
  } catch { return fallback; }
}

async function buildResolverRules() {
  const entries = await Promise.all(
    Object.entries(DNS_FALLBACKS).map(async ([host, fb]) => {
      const ip = await resolveIP(host, fb);
      return `MAP ${host} ${ip}`;
    })
  );
  return entries.join(',');
}

// ── Config ─────────────────────────────────────────────────────────────────
const BACKEND    = 'https://sistema-anderson.duckdns.org';
const GRADES_URL = 'https://ssb.upao.edu.pe/StudentSelfService/ssb/studentGrades';

const CURSO_NOMBRES = {
  'ISIA 107': 'Infraestructura como Código',
  'ISIA 118': 'Gobierno de Datos',
  'ISIA 127': 'Aplic. Móviles para Negocios',
  'ISIA 104': 'Cómputo Distribuido y Paralelo',
  'ICSI 676': 'Métodos Cuantitativos para Negocios',
  'ISIA 117': 'Proyecto de Investigación',
};

function log(msg)  { process.stdout.write(msg + '\n'); }
function ok(msg)   { log('\x1b[32m✅ ' + msg + '\x1b[0m'); }
function info(msg) { log('\x1b[36m   ' + msg + '\x1b[0m'); }
function step(msg) { log('\x1b[33m⏳ ' + msg + '\x1b[0m'); }
function fail(msg) { log('\x1b[31m❌ ' + msg + '\x1b[0m'); }

// ── Login SSO UPAO (flujo: Experience → upaosso → SSB) ────────────────────
async function login(page) {
  step('Iniciando sesión en UPAO...');

  await page.goto('https://experience.elluciancloud.com/upao/', {
    waitUntil: 'domcontentloaded',
    timeout: 40000,
  });

  // Esperar redirección al SSO de UPAO
  if (!page.url().includes('upaosso.upao.edu.pe')) {
    await page.waitForURL('*upaosso.upao.edu.pe*', { timeout: 30000 });
  }

  // Llenar formulario de login
  await page.waitForSelector("input[name='id_usuario']", { timeout: 15000 });
  await page.fill("input[name='id_usuario']", UPAO_USER);
  await page.fill("input[name='nip']",        UPAO_PASS);
  await page.click("input[name='btn_valida']");
  info('Credenciales enviadas');

  // Esperar callback SAML de vuelta a Experience
  try {
    await page.waitForURL('*experience.elluciancloud.com*', { timeout: 40000 });
  } catch { /* puede saltar directo a SSB */ }

  // Navegar a la página de notas (retry en caso de ERR_ABORTED por redirect SAML)
  step('Navegando a calificaciones...');
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(GRADES_URL, { waitUntil: 'domcontentloaded', timeout: 50000 });
      break;
    } catch (e) {
      if (attempt === 3) throw e;
      info(`Reintento ${attempt}/3...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Si CAS redirige de vuelta a upaosso para el ticket, esperar que vuelva a SSB
  if (page.url().includes('upaosso')) {
    await page.waitForURL('*ssb.upao.edu.pe*', { timeout: 30000 });
  }

  // Esperar a que cargue el selector de período
  await page.waitForSelector('#term-readonly', { timeout: 30000 });
  ok('Sesión iniciada y página de notas cargada');

  // ── Seleccionar período y nivel con clicks reales de Playwright ─────────
  step('Seleccionando período...');

  // Click término y esperar que carguen opciones vía AJAX
  await page.click('#term-select-button', { timeout: 5000 });
  await page.waitForTimeout(2000);

  // El dropdown activo siempre está en #select2-drop > ul .select2-result
  const termOpts = page.locator('#select2-drop li.select2-result-selectable');
  const termCount = await termOpts.count();
  info(`${termCount} períodos disponibles`);
  for (let i = 0; i < termCount; i++) {
    const txt = (await termOpts.nth(i).textContent() || '').trim();
    if (txt && !txt.toLowerCase().includes('all terms')) {
      info(`Seleccionando período: ${txt}`);
      await termOpts.nth(i).click();
      break;
    }
  }
  await page.waitForTimeout(2000);

  // Seleccionar nivel si aparece
  try {
    await page.click('#level-select-button', { timeout: 3000 });
    await page.waitForTimeout(1500);
    const lvlOpts = page.locator('#select2-drop li.select2-result-selectable');
    if (await lvlOpts.count() > 0) {
      const lvlTxt = (await lvlOpts.first().textContent() || '').trim();
      info(`Seleccionando nivel: ${lvlTxt}`);
      await lvlOpts.first().click();
      await page.waitForTimeout(1500);
    }
  } catch {}

  // Esperar a que carguen las notas
  try { await page.waitForSelector('#courseWorkContainer', { timeout: 25000 }); } catch {}
}

// ── Extracción de notas ────────────────────────────────────────────────────
async function extraerNotas(page) {
  // 1. Leer todos los cursos de la tabla principal
  const cursosBase = await page.evaluate((cursoNombres) => {
    const cl = s => s.trim().replace(/\s+/g, ' ').replace(/press enter key.*/i, '').trim();
    const result = [];
    const seen = new Set();
    document.querySelectorAll('table tbody tr').forEach(row => {
      const c = {};
      row.querySelectorAll('[xe-field]').forEach(td => { c[td.getAttribute('xe-field')] = cl(td.textContent); });
      if (!c.subjectCode || c.subjectCode === 'Subject') return;
      const subj = c.subjectCode.split(',')[0].trim();
      if (seen.has(subj)) return;
      seen.add(subj);
      const crn   = (c.courseReferenceNumber || '').split(/\s/)[0].trim();
      const title = c.courseTitle || '';
      const horas = ((c.hoursAttempted || c.creditHours || '')).replace(/[^\d.]/g, '') || '';
      const nombre = cursoNombres[subj] || title || subj;
      result.push({ codigo: subj, crn, nombre, horas });
    });
    return result;
  }, CURSO_NOMBRES);

  // Si el tbody aún no tiene filas, esperar hasta 15 segundos
  if (!cursosBase.length) {
    try {
      await page.waitForSelector('table tbody tr [xe-field="subjectCode"]', { timeout: 15000 });
    } catch {}
    // Reintentar extracción
    const retry = await page.evaluate((cursoNombres) => {
      const cl = s => s.trim().replace(/\s+/g, ' ').replace(/press enter key.*/i, '').trim();
      const result = [];
      const seen = new Set();
      document.querySelectorAll('table tbody tr').forEach(row => {
        const c = {};
        row.querySelectorAll('[xe-field]').forEach(td => { c[td.getAttribute('xe-field')] = cl(td.textContent); });
        if (!c.subjectCode || c.subjectCode === 'Subject') return;
        const subj = c.subjectCode.split(',')[0].trim();
        if (seen.has(subj)) return;
        seen.add(subj);
        const crn   = (c.courseReferenceNumber || '').split(/\s/)[0].trim();
        const title = c.courseTitle || '';
        const horas = (c.hoursAttempted || c.creditHours || '').replace(/[^\d.]/g, '') || '';
        result.push({ codigo: subj, crn, nombre: cursoNombres[subj] || title || subj, horas });
      });
      return result;
    }, CURSO_NOMBRES);
    if (retry.length) cursosBase.push(...retry);
  }
  if (!cursosBase.length) throw new Error('No se encontraron cursos en la tabla');
  info(`${cursosBase.length} cursos encontrados`);

  // 2. Entrar a la vista de Components (primer botón del primer curso)
  const compLinks = page.locator('.component-button, button, a').filter({ hasText: /^Components$/ });
  await compLinks.first().click();
  await page.waitForTimeout(2000);

  // Función para expandir subcomponentes y extraer filas de componentes
  const extractComps = async () => {
    const subBtns = page.locator('input[type="button"][title*="Subcomponents"]');
    for (let i = 0; i < await subBtns.count(); i++) {
      try { await subBtns.nth(i).click(); await page.waitForTimeout(200); } catch {}
    }
    await page.waitForTimeout(500);
    return page.evaluate(() => {
      const cl = s => s.trim().replace(/\s+/g, ' ');
      const comps = [];
      let hasGrades = false;
      document.querySelectorAll('table tbody tr').forEach(row => {
        const c = {};
        row.querySelectorAll('[xe-field]').forEach(td => { c[td.getAttribute('xe-field')] = cl(td.textContent); });
        if (!c.name || c.name === 'Title') return;
        if (c.score && /\d/.test(c.score)) hasGrades = true;
        const nested = !!row.querySelector('[class*="nested"],[class*="child"],[class*="sub"]');
        comps.push({
          name:               c.name,
          weight:             c.weight || '0',
          score:              c.score  || '',
          grade:              c.grade  || '',
          percentage:         c.percentage || '',
          mustPass:           c.mustPass === 'Yes' ? 'Sí' : (c.mustPass || 'No'),
          inclusionIndicator: c.inclusionIndicator || 'Final',
          nested,
        });
      });
      return { componentes: comps, calDisponible: hasGrades };
    });
  };

  // 3. Iterar sobre cada curso
  const allCourses = [];
  for (let i = 0; i < cursosBase.length; i++) {
    const { codigo, crn, nombre, horas } = cursosBase[i];

    if (i > 0) {
      // Navegar al siguiente curso vía el botón Select2
      await page.click('#courses-select-button', { timeout: 5000 });
      await page.waitForTimeout(1500);
      const opts  = page.locator('#select2-drop li.select2-result-selectable');
      const count = await opts.count();
      let   found = false;
      for (let j = 0; j < count; j++) {
        const txt = (await opts.nth(j).textContent() || '').trim();
        if (txt.includes(crn) || txt.includes(codigo.replace(' ', ''))) {
          await opts.nth(j).click();
          found = true;
          break;
        }
      }
      if (!found) {
        info(`⚠ No se encontró ${codigo} en dropdown, saltando`);
        allCourses.push({ codigo, crn, nombre, horas, cal_disponible: false, componentes: [] });
        continue;
      }
      await page.waitForTimeout(2000);
    }

    info(`Extrayendo componentes de ${codigo}...`);
    const { componentes, calDisponible } = await extractComps();
    allCourses.push({ codigo, crn, nombre, horas, cal_disponible: calDisponible, componentes });
  }

  return allCourses;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  log('\n\x1b[1m╔══════════════════════════════╗\x1b[0m');
  log('\x1b[1m║   Sync UPAO → Gordito        ║\x1b[0m');
  log('\x1b[1m╚══════════════════════════════╝\x1b[0m\n');

  step('Resolviendo dominios UPAO...');
  const resolverRules = await buildResolverRules();

  const browser = await chromium.launch({
    headless: true,
    args: [
      `--host-resolver-rules=${resolverRules}`,
      '--no-sandbox',
      '--ignore-certificate-errors',
      '--disable-web-security',
    ],
  });
  const context = await browser.newContext();
  const page    = await context.newPage();

  try {
    await login(page);

    step('Extrayendo notas de todos los cursos...');
    const cursos = await extraerNotas(page);
    log(`📦 ${cursos.length} cursos extraídos. Enviando al VPS...`);

    const res = await fetch(`${BACKEND}/api/notas-upao/bookmarklet?user=default`, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify(cursos),
    });

    if (res.ok) {
      const ahora = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
      ok(`¡Sincronizado! ${cursos.length} cursos guardados`);
      info(`Fecha: ${ahora} (hora Perú)`);
      info(`Ver en: ${BACKEND}`);
    } else {
      fail(`El VPS respondió con error ${res.status}`);
    }

  } catch (e) {
    fail(e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
