const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const BACKEND     = 'https://sistema-anderson.duckdns.org';
const UPAO_URL    = 'https://ssb.upao.edu.pe/StudentSelfService/ssb/studentGrades';
const SESSION_FILE = path.join(__dirname, '.upao-session.json');

const CURSO_NOMBRES = {
  'ISIA 107': 'Infraestructura como Código',
  'ISIA 118': 'Gobierno de Datos',
  'ISIA 127': 'Aplic. Móviles para Negocios',
  'ISIA 104': 'Cómputo Distribuido y Paralelo',
  'ICSI 676': 'Métodos Cuantitativos para Negocios',
  'ISIA 117': 'Proyecto de Investigación',
};

function log(msg)   { process.stdout.write(msg + '\n'); }
function ok(msg)    { log('\x1b[32m✅ ' + msg + '\x1b[0m'); }
function info(msg)  { log('\x1b[36m   ' + msg + '\x1b[0m'); }
function step(msg)  { log('\x1b[33m⏳ ' + msg + '\x1b[0m'); }
function err(msg)   { log('\x1b[31m❌ ' + msg + '\x1b[0m'); }

// Espera activamente a que exista el selector (sondeo cada 2s, máx 3 min)
async function waitForSelector(page, sel, maxSecs = 180) {
  for (let i = 0; i < maxSecs; i += 2) {
    try {
      const found = await page.evaluate(
        s => document.querySelector(s) !== null,
        sel
      );
      if (found) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}

// Espera a que la página de notas esté activa (maneja login intermedio)
async function esperarPaginaNotas(page) {
  step('Esperando la página de notas de UPAO...');
  info('→ Si aparece login, inicia sesión normalmente.');
  info('→ Si después del login no ves notas, navega a: Historial Académico → Calificaciones\n');

  for (let secs = 0; secs < 180; secs += 2) {
    try {
      const { enNotas, enLogin } = await page.evaluate(() => ({
        enNotas:  !!document.querySelector('#term-readonly') || !!document.querySelector('#courseWorkContainer'),
        enLogin:  location.href.includes('login') || location.href.includes('Login'),
      }));

      if (enNotas) {
        ok(`Página de notas detectada (${secs}s)\n`);
        return;
      }

      // Si ya pasó el login y no estamos en notas, navegar allí
      if (!enLogin && secs > 5 && !page.url().includes('studentGrades')) {
        step('Sesión activa — navegando a la página de notas...');
        await page.goto(UPAO_URL, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      }
    } catch {}

    if (secs > 0 && secs % 20 === 0) {
      step(`Esperando... ${secs}s / 180s`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Tiempo de espera agotado (3 minutos). Verifica que puedes acceder a UPAO.');
}

async function extraerNotas(page) {
  return page.evaluate(async (cursoNombres) => {
    const sleep   = ms => new Promise(r => setTimeout(r, ms));
    const openDD  = id => {
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
      const crn  = c.courseReferenceNumber || c.crn || '';
      const title = c.courseTitle || c.title || '';
      const code  = (c.subject && c.courseNumber) ? c.subject + ' ' + c.courseNumber : '';
      if (title && title.toLowerCase() !== 'course title') {
        if (code) nombresMap[code] = title;
        if (crn)  nombresMap[crn]  = title;
      }
    });

    // Ir a Components
    const compLink = [...document.querySelectorAll('a,button')].find(el => /^components$/i.test(el.textContent.trim()));
    if (!compLink) throw new Error('No se encontró el enlace "Components" en la página');
    compLink.click();
    await sleep(2000);

    // Obtener lista de cursos
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

      // Esperar a que cargue
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

      const calNoDisp  = document.body.innerText.includes('no disponible');
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
      let nameComp   = '';
      for (const comp of componentes) {
        const r = (comp.courseTitle || '').trim();
        if (r && r.toLowerCase() !== 'course title') {
          nameComp = r.replace(/press enter key.*/i, '').replace(/\s+/g, ' ').trim();
          break;
        }
      }
      const nombre = cursoNombres[codigo] || nombresMap[codigo] || nombresMap[nrc] || nameComp || nameDD || codigo;
      allCourses.push({ nrc: ct, codigo, nrc_num: nrc, nombre, horas, cal_disponible: !calNoDisp, componentes });
    }

    return allCourses;
  }, CURSO_NOMBRES);
}

async function main() {
  log('\n\x1b[1m╔══════════════════════════════╗\x1b[0m');
  log('\x1b[1m║   Sync UPAO → Gordito        ║\x1b[0m');
  log('\x1b[1m╚══════════════════════════════╝\x1b[0m\n');

  // Cargar sesión guardada si existe
  const ctxOpts = { viewport: null };
  if (fs.existsSync(SESSION_FILE)) {
    ctxOpts.storageState = SESSION_FILE;
    info('Usando sesión guardada (si expiró, se pedirá login)\n');
  }

  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext(ctxOpts);
  const page    = await context.newPage();

  try {
    log('🌐 Abriendo UPAO...');
    await page.goto(UPAO_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Espera activa con mensajes de ayuda
    await esperarPaginaNotas(page);

    // Guardar sesión para la próxima vez
    await context.storageState({ path: SESSION_FILE });
    info('Sesión guardada (próximo sync será más rápido)\n');

    step('Extrayendo notas...');
    const cursos = await extraerNotas(page);
    log(`📦 ${cursos.length} cursos encontrados. Enviando al VPS...`);

    const res = await fetch(`${BACKEND}/api/notas-upao/bookmarklet?user=default`, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify(cursos),
    });

    if (res.ok) {
      ok(`¡Notas sincronizadas! ${cursos.length} cursos → ${BACKEND}`);
      const ahora = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
      info(`Actualizado: ${ahora} (hora Perú)`);
    } else {
      err(`El VPS respondió con error ${res.status}`);
    }

  } catch (e) {
    err(e.message);
    process.exitCode = 1;
  } finally {
    await context.storageState({ path: SESSION_FILE }).catch(() => {});
    log('\n\x1b[90mCerrando navegador en 5 segundos...\x1b[0m');
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
  }
}

main();
