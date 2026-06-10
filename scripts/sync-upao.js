const { chromium } = require('playwright');

const BACKEND = 'https://sistema-anderson.duckdns.org';
const UPAO_URL = 'https://ssb.upao.edu.pe/StudentSelfService/ssb/studentGrades';

const CURSO_NOMBRES = {
  'ISIA 107': 'Infraestructura como Código',
  'ISIA 118': 'Gobierno de Datos',
  'ISIA 127': 'Aplic. Móviles para Negocios',
  'ISIA 104': 'Cómputo Distribuido y Paralelo',
  'ICSI 676': 'Métodos Cuantitativos para Negocios',
  'ISIA 117': 'Proyecto de Investigación',
};

function log(msg)    { process.stdout.write(msg + '\n'); }
function ok(msg)     { log('\x1b[32m✅ ' + msg + '\x1b[0m'); }
function info(msg)   { log('\x1b[36m   ' + msg + '\x1b[0m'); }
function warn(msg)   { log('\x1b[33m⚠️  ' + msg + '\x1b[0m'); }
function error(msg)  { log('\x1b[31m❌ ' + msg + '\x1b[0m'); }

async function main() {
  log('\n\x1b[1m╔══════════════════════════════╗\x1b[0m');
  log('\x1b[1m║   Sync UPAO → Gordito        ║\x1b[0m');
  log('\x1b[1m╚══════════════════════════════╝\x1b[0m\n');

  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext({ viewport: null });
  const page    = await context.newPage();

  try {
    log('🌐 Abriendo UPAO...');
    await page.goto(UPAO_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    log('👤 Inicia sesión en UPAO si aún no lo hiciste.');
    info('El script continuará automáticamente cuando estés en la página de notas.\n');

    await page.waitForFunction(
      () => document.querySelector('#term-readonly') !== null || document.querySelector('#courseWorkContainer') !== null,
      { timeout: 120_000 }
    );

    log('📊 Sesión detectada. Extrayendo notas...\n');

    const cursos = await page.evaluate(async (cursoNombres) => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const waitFor = (sel, timeout = 12000) => new Promise((res, rej) => {
        const t = Date.now();
        const check = () => {
          const el = document.querySelector(sel);
          if (el) return res(el);
          if (Date.now() - t > timeout) return rej(new Error('Timeout: ' + sel));
          setTimeout(check, 300);
        };
        check();
      });

      const openDD = id => {
        const btn = document.querySelector(id + '-button');
        if (btn) { btn.click(); return; }
        const s = document.querySelector('#s2id_' + id.replace('#', '') + ' .select2-choice');
        if (s) s.click();
      };

      // Seleccionar período si está vacío
      const termEl = document.querySelector('#term-readonly');
      if (termEl && !termEl.value) {
        termEl.click();
        await sleep(800);
        const opts = document.querySelectorAll('.select2-results li');
        for (const o of opts) {
          if (!o.textContent.includes('All Terms') && o.textContent.trim()) { o.click(); break; }
        }
        await sleep(800);
      }

      // Seleccionar nivel si está vacío
      const lvlEl = document.querySelector('#level-readonly');
      if (lvlEl && !lvlEl.value) {
        try {
          lvlEl.click(); await sleep(800);
          const lo = document.querySelectorAll('.select2-results li');
          for (const o of lo) { if (o.textContent.trim()) { o.click(); break; } }
          await sleep(800);
        } catch {}
      }

      // Esperar contenedor de cursos
      try { await waitFor('#courseWorkContainer', 15000); } catch {}
      await sleep(1000);

      // Mapear nombres desde la tabla principal
      const nombresMap = {};
      document.querySelectorAll('table tbody tr, [xe-section] tr').forEach(row => {
        const cells = {};
        row.querySelectorAll('[xe-field]').forEach(td => {
          cells[td.getAttribute('xe-field')] = td.textContent.trim().replace(/\s+/g, ' ').replace(/press enter key.*/i, '').trim();
        });
        const crn   = cells.courseReferenceNumber || cells.crn || '';
        const title = cells.courseTitle || cells.title || '';
        const code  = (cells.subject && cells.courseNumber) ? cells.subject + ' ' + cells.courseNumber : '';
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

      // Obtener lista de cursos del dropdown
      openDD('courses');
      await sleep(1500);
      const courseOptions = [...document.querySelectorAll('.select2-results li')]
        .map(o => o.textContent.trim())
        .filter(t => t && !/seleccionar|searching/i.test(t));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await sleep(300);

      if (!courseOptions.length) throw new Error('No se encontraron cursos');

      const allCourses = [];
      for (let i = 0; i < courseOptions.length; i++) {
        const ct = courseOptions[i];

        openDD('courses');
        await sleep(800);
        const opts = [...document.querySelectorAll('.select2-results li')];
        const found = opts.find(o => o.textContent.trim() === ct) || opts.find(o => o.textContent.includes(ct.split('|')[0].trim()));
        if (found) found.click();
        await sleep(1000);

        // Esperar a que termine de cargar
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

        const cl = s => s.trim().replace(/\s+/g, ' ');
        const hEl  = document.querySelector('[xe-field="creditHours"]');
        const hRaw = hEl ? cl(hEl.textContent) : '';
        const hM   = hRaw.match(/([\d.]+)/);
        const horas = hM ? hM[1] : hRaw;

        const calNoDisp  = document.body.innerText.includes('no disponible');
        const componentes = [];
        document.querySelectorAll('table tbody tr').forEach(row => {
          const cells = {};
          row.querySelectorAll('[xe-field]').forEach(td => { cells[td.getAttribute('xe-field')] = cl(td.textContent); });
          if (cells.name) {
            cells.nested = !!row.querySelector('.nested-arrow');
            if (cells.mustPass === 'Yes') cells.mustPass = 'Sí';
            componentes.push(cells);
          }
        });

        const parts    = ct.split('|');
        const codePart = parts[0].trim();
        const nrc      = parts[1]?.trim() || '';
        const sp       = codePart.split(' - ', 2);
        const codigo   = sp[0].trim();
        const nameDD   = (sp[1] || '').replace(/press enter key.*/i, '').replace(/\s+/g, ' ').trim();
        let   nameComp = '';
        for (const c of componentes) {
          const r = (c.courseTitle || '').trim();
          if (r && r.toLowerCase() !== 'course title') { nameComp = r.replace(/press enter key.*/i, '').replace(/\s+/g, ' ').trim(); break; }
        }
        const nombre = cursoNombres[codigo] || nombresMap[codigo] || nombresMap[nrc] || nameComp || nameDD || codigo;

        allCourses.push({ nrc: ct, codigo, nrc_num: nrc, nombre, horas, cal_disponible: !calNoDisp, componentes });
      }

      return allCourses;
    }, CURSO_NOMBRES);

    log(`📦 ${cursos.length} cursos encontrados. Enviando al VPS...`);

    const res = await fetch(`${BACKEND}/api/notas-upao/bookmarklet?user=default`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(cursos),
    });

    if (res.ok || res.status === 0 || res.status === 204) {
      ok(`¡Notas sincronizadas! (${cursos.length} cursos)`);
      info(`Abre ${BACKEND} para verlas.`);
    } else {
      warn(`El servidor respondió con ${res.status}. Verifica en ${BACKEND}`);
    }

  } catch (e) {
    error(e.message);
    process.exitCode = 1;
  } finally {
    info('\nCerrando navegador en 4 segundos...');
    await new Promise(r => setTimeout(r, 4000));
    await browser.close();
  }
}

main();
