const { chromium } = require('playwright');

// ── Credenciales UPAO ──────────────────────────────────────────────────────
const UPAO_USER = '000280169';
const UPAO_PASS = 'AlmiGamer12';

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

  // Navegar a la página de notas
  step('Navegando a calificaciones...');
  await page.goto(GRADES_URL, { waitUntil: 'domcontentloaded', timeout: 50000 });

  // Si CAS redirige de vuelta a upaosso para el ticket, esperar que vuelva a SSB
  if (page.url().includes('upaosso')) {
    await page.waitForURL('*ssb.upao.edu.pe*', { timeout: 30000 });
  }

  // Esperar a que cargue el selector de período
  await page.waitForSelector('#term-readonly', { timeout: 30000 });
  ok('Sesión iniciada y página de notas cargada');
}

// ── Extracción de notas (lógica del scraper original) ─────────────────────
async function extraerNotas(page) {
  return page.evaluate(async (cursoNombres) => {
    const sleep  = ms => new Promise(r => setTimeout(r, ms));
    const openDD = id => {
      const btn = document.querySelector(id + '-button');
      if (btn) { btn.click(); return; }
      const s = document.querySelector('#s2id_' + id.replace('#', '') + ' .select2-choice');
      if (s) s.click();
    };
    const waitEl = (sel, ms = 12000) => new Promise((res, rej) => {
      const t = Date.now();
      const c = () => {
        const el = document.querySelector(sel);
        if (el) return res(el);
        if (Date.now() - t > ms) return rej(new Error('Timeout: ' + sel));
        setTimeout(c, 300);
      };
      c();
    });

    // Seleccionar período si está vacío
    const termEl = document.querySelector('#term-readonly');
    if (termEl && !termEl.value) {
      termEl.click(); await sleep(800);
      for (const o of document.querySelectorAll('.select2-results li')) {
        if (!o.textContent.includes('All Terms') && o.textContent.trim()) { o.click(); break; }
      }
      await sleep(800);
    }

    // Seleccionar nivel si está vacío
    const lvlEl = document.querySelector('#level-readonly');
    if (lvlEl && !lvlEl.value) {
      try {
        lvlEl.click(); await sleep(800);
        for (const o of document.querySelectorAll('.select2-results li')) {
          if (o.textContent.trim()) { o.click(); break; }
        }
        await sleep(800);
      } catch {}
    }

    try { await waitEl('#courseWorkContainer', 15000); } catch {}
    await sleep(1000);

    // Mapear nombres desde la tabla principal
    const nombresMap = {};
    document.querySelectorAll('table tbody tr, [xe-section] tr').forEach(row => {
      const c = {};
      row.querySelectorAll('[xe-field]').forEach(td => {
        c[td.getAttribute('xe-field')] = td.textContent.trim().replace(/\s+/g, ' ').replace(/press enter key.*/i, '').trim();
      });
      const crn   = c.courseReferenceNumber || c.crn || '';
      const title = c.courseTitle || c.title || '';
      const code  = (c.subject && c.courseNumber) ? c.subject + ' ' + c.courseNumber : '';
      if (title && title.toLowerCase() !== 'course title') {
        if (code) nombresMap[code] = title;
        if (crn)  nombresMap[crn]  = title;
      }
    });

    // Ir a Components
    const compLink = [...document.querySelectorAll('a,button')].find(el => /^components$/i.test(el.textContent.trim()));
    if (!compLink) throw new Error('No se encontró el enlace "Components"');
    compLink.click();
    await sleep(2000);

    openDD('courses');
    await sleep(1500);
    const courseOptions = [...document.querySelectorAll('.select2-results li')]
      .map(o => o.textContent.trim())
      .filter(t => t && !/seleccionar|searching/i.test(t));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await sleep(300);
    if (!courseOptions.length) throw new Error('No se encontraron cursos en el dropdown');

    const allCourses = [];
    for (let i = 0; i < courseOptions.length; i++) {
      const ct = courseOptions[i];
      openDD('courses');
      await sleep(800);
      const opts  = [...document.querySelectorAll('.select2-results li')];
      const found = opts.find(o => o.textContent.trim() === ct) || opts.find(o => o.textContent.includes(ct.split('|')[0].trim()));
      if (found) found.click();
      await sleep(1000);

      await new Promise(res => {
        const t = Date.now();
        const c = () => {
          if (!document.querySelector('.loading,.spinner,[aria-busy="true"]') || Date.now() - t > 8000) return res();
          setTimeout(c, 300);
        };
        setTimeout(c, 500);
      });
      await sleep(400);

      document.querySelectorAll('.nested-arrow.nested-arrow-closed').forEach(a => a.click());
      await sleep(300);

      const cl    = s => s.trim().replace(/\s+/g, ' ');
      const hEl   = document.querySelector('[xe-field="creditHours"]');
      const hRaw  = hEl ? cl(hEl.textContent) : '';
      const hM    = hRaw.match(/([\d.]+)/);
      const horas = hM ? hM[1] : hRaw;

      const calNoDisp = document.body.innerText.includes('no disponible');
      const componentes = [];
      document.querySelectorAll('table tbody tr').forEach(row => {
        const c2 = {};
        row.querySelectorAll('[xe-field]').forEach(td => { c2[td.getAttribute('xe-field')] = cl(td.textContent); });
        if (c2.name) {
          c2.nested = !!row.querySelector('.nested-arrow');
          if (c2.mustPass === 'Yes') c2.mustPass = 'Sí';
          componentes.push(c2);
        }
      });

      const parts    = ct.split('|');
      const codePart = parts[0].trim();
      const nrc      = parts[1]?.trim() || '';
      const sp       = codePart.split(' - ', 2);
      const codigo   = sp[0].trim();
      const nameDD   = (sp[1] || '').replace(/press enter key.*/i, '').replace(/\s+/g, ' ').trim();
      let   nameComp = '';
      for (const comp of componentes) {
        const r = (comp.courseTitle || '').trim();
        if (r && r.toLowerCase() !== 'course title') { nameComp = r.replace(/press enter key.*/i, '').replace(/\s+/g, ' ').trim(); break; }
      }
      const nombre = cursoNombres[codigo] || nombresMap[codigo] || nombresMap[nrc] || nameComp || nameDD || codigo;
      allCourses.push({ nrc: ct, codigo, nrc_num: nrc, nombre, horas, cal_disponible: !calNoDisp, componentes });
    }
    return allCourses;
  }, CURSO_NOMBRES);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  log('\n\x1b[1m╔══════════════════════════════╗\x1b[0m');
  log('\x1b[1m║   Sync UPAO → Gordito        ║\x1b[0m');
  log('\x1b[1m╚══════════════════════════════╝\x1b[0m\n');

  const browser = await chromium.launch({ headless: true });
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
