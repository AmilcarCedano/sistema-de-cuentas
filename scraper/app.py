import asyncio
import os
import socket
import subprocess
import sys
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from playwright.async_api import async_playwright

def _resolve_ip(host: str, fallback: str) -> str:
    """Resuelve IP via Google DoH (más confiable en Windows que getaddrinfo)."""
    import json, urllib.request
    try:
        req = urllib.request.Request(
            f"https://dns.google/resolve?name={host}&type=A",
            headers={"Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
        ips = [a["data"] for a in data.get("Answer", []) if a.get("type") == 1]
        if ips:
            return ips[0]
    except Exception:
        pass
    try:
        ip = socket.gethostbyname(host)
        if ip:
            return ip
    except Exception:
        pass
    try:
        r = subprocess.run(
            ["curl", "-s", "--max-time", "5", "-o", "/dev/null",
             "-w", "%{remote_ip}", f"https://{host}/"],
            capture_output=True, text=True, timeout=7,
        )
        if r.stdout.strip():
            return r.stdout.strip()
    except Exception:
        pass
    return fallback

def _build_chromium_args() -> list[str]:
    # En Linux (Docker/VPS) se necesitan flags extra para Chromium sin sandbox.
    # En ambas plataformas se aplican host-resolver-rules porque los dominios .pe
    # de UPAO no resuelven via DNS estándar en servidores cloud.
    base = ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] if sys.platform != "win32" else []
    exp_ip = _resolve_ip("eee-dashboard-prod.10005.elluciancloud.com", "52.0.235.226")
    api_ip = _resolve_ip("eee-api.10005.elluciancloud.com",            "54.230.124.29")
    sso_ip = _resolve_ip("upaosso.upao.edu.pe",                        "200.62.147.92")
    rules = ",".join([
        f"MAP experience.elluciancloud.com {exp_ip}",
        f"MAP eee-dashboard-prod.10005.elluciancloud.com {exp_ip}",
        f"MAP eee-api.10005.elluciancloud.com {api_ip}",
        f"MAP upaosso.upao.edu.pe {sso_ip}",
        "MAP ssb.upao.edu.pe 129.153.7.236",
        "MAP login.upao.edu.pe 129.153.7.236",
    ])
    return base + [f"--host-resolver-rules={rules}"]

CHROMIUM_ARGS = _build_chromium_args()

app = FastAPI()

USERNAME = os.environ.get("UPAO_USER", "")
PASSWORD = os.environ.get("UPAO_PASS", "")

CURSO_NOMBRES = {
    "ISIA 107": "Infraestructura como Código",
    "ISIA 118": "Gobierno de Datos",
    "ISIA 127": "Aplic. Móviles para Negocios",
    "ISIA 104": "Cómputo Distribuido y Paralelo",
    "ICSI 676": "Métodos Cuantitativos para Negocios",
    "ISIA 117": "Proyecto de Investigación",
}

class ScrapeRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None

async def _nw(page, timeout=4000):
    """Espera networkidle con timeout corto; ignora si no llega."""
    try:
        await page.wait_for_load_state("networkidle", timeout=timeout)
    except Exception:
        pass

async def _open_courses_dropdown(page):
    """Abre el dropdown de cursos via JavaScript (bypasea restricciones de visibilidad)."""
    await page.evaluate("""
        const btn = document.querySelector('#courses-select-button');
        if (btn) { btn.click(); }
        else {
            const a = document.querySelector('#s2id_courses .select2-choice');
            if (a) a.click();
        }
    """)

async def scrape_grades(user: str = None, pwd: str = None):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=CHROMIUM_ARGS)
        context = await browser.new_context(ignore_https_errors=True)
        page = await context.new_page()

        # 1. SSO login via Experience → upaosso
        await page.goto("https://experience.elluciancloud.com/upao/",
                        wait_until="domcontentloaded", timeout=40000)
        if "upaosso.upao.edu.pe" not in page.url:
            await page.wait_for_url("*upaosso.upao.edu.pe*", timeout=20000)

        await page.wait_for_selector("input[name='id_usuario']", timeout=10000)
        await page.fill("input[name='id_usuario']", user or USERNAME)
        await page.fill("input[name='nip']", pwd or PASSWORD)
        await page.click("input[name='btn_valida']")

        # SAML callback vuelve a Experience (timeout corto; si ya llegó, OK)
        try:
            await page.wait_for_url("*experience.elluciancloud.com*", timeout=5000)
        except Exception:
            pass

        # 2. Navegar directo a SSB (CAS usa sesión activa de upaosso)
        await page.goto("https://ssb.upao.edu.pe/StudentSelfService/ssb/studentGrades",
                        wait_until="domcontentloaded", timeout=50000)
        if "upaosso" in page.url:
            await page.wait_for_url("*ssb.upao.edu.pe*", timeout=20000)
        await _nw(page, 5000)

        # 3. Seleccionar periodo más reciente
        await page.wait_for_selector("#term-readonly", timeout=10000)
        await page.click("#term-readonly")
        await asyncio.sleep(1)
        for opt in await page.locator(".select2-results li").all():
            txt = await opt.inner_text()
            if "All Terms" not in txt and txt.strip():
                await opt.click()
                break
        else:
            raise Exception("No se encontró periodo disponible")
        await asyncio.sleep(1)

        # 4. Seleccionar nivel
        await page.wait_for_selector("#level-readonly", timeout=5000)
        await page.click("#level-readonly")
        await asyncio.sleep(1)
        for opt in await page.locator(".select2-results li").all():
            if (await opt.inner_text()).strip():
                await opt.click()
                break

        # 5. Esperar que aparezcan los cursos
        await page.wait_for_selector("#courseWorkContainer", timeout=20000)
        await _nw(page, 5000)

        # 5b. Extraer nombres de cursos ANTES de entrar a componentes
        # La vista principal tiene una tabla con código + nombre completo del curso
        nombres_map = await page.evaluate("""() => {
            const clean = (txt) => txt.trim().replace(/\\s+/g,' ')
                .replace(/press enter key.*/i, '').trim();
            const map = {};
            // Buscar filas de la tabla con código y título de curso
            document.querySelectorAll('table tbody tr, [xe-section] tr').forEach(row => {
                const cells = {};
                row.querySelectorAll('[xe-field]').forEach(td => {
                    cells[td.getAttribute('xe-field')] = clean(td.textContent);
                });
                // Banner XE usa courseReferenceNumber (CRN) y courseTitle / subject+courseNumber
                const crn   = cells['courseReferenceNumber'] || cells['crn'] || '';
                const title = cells['courseTitle'] || cells['title'] || '';
                const subj  = cells['subject'] || '';
                const num   = cells['courseNumber'] || '';
                const code  = subj && num ? (subj + ' ' + num) : '';
                if (title && code) map[code] = title;
                if (title && crn)  map[crn]  = title;
            });
            return map;
        }""")

        # Filtrar entradas inválidas (headers de tabla como 'CRN': 'Course Title')
        nombres_map = {k: v for k, v in nombres_map.items()
                       if v and v.lower() not in ('course title', 'crn', '')}

        # 6. Entrar a la vista de componentes
        await page.locator("a:has-text('Components'), button:has-text('Components')").first.click()
        await _nw(page, 5000)

        # 7. Obtener lista de cursos via JavaScript click (elemento oculto para Playwright)
        await _open_courses_dropdown(page)
        await asyncio.sleep(1.5)  # esperar que el courseList AJAX retorne
        course_options = []
        for opt in await page.locator(".select2-results li").all():
            txt = (await opt.inner_text()).strip()
            if txt and "seleccionar" not in txt.lower() and "searching" not in txt.lower():
                course_options.append(txt)
        await page.keyboard.press("Escape")

        all_courses = []

        for course_txt in course_options:
            # Abrir dropdown y esperar 0.8s para que courseList AJAX empiece a cargar
            await _open_courses_dropdown(page)
            await asyncio.sleep(0.8)
            # filter(has_text=) usa retry automático de Playwright → no hay referencia stale
            await page.locator(".select2-results li").filter(has_text=course_txt).click(timeout=6000)

            # Esperar que el grade-data AJAX dispare y complete
            await asyncio.sleep(1)
            await _nw(page, 8000)
            await asyncio.sleep(0.5)

            # Expandir subcomponentes cerrados via JS (evita timeout de Playwright)
            await page.evaluate(
                "document.querySelectorAll('.nested-arrow.nested-arrow-closed').forEach(a => a.click())"
            )
            await asyncio.sleep(0.5)

            # Extraer datos de la tabla de componentes
            data = await page.evaluate("""() => {
                const clean = (txt) => txt.trim().replace(/\\s+/g,' ');
                const horasEl = document.querySelector('[xe-field="creditHours"]');
                const horasRaw = horasEl ? clean(horasEl.textContent) : '';
                const horasMatch = horasRaw.match(/([\\d.]+)/);
                const info = {
                    horas: horasMatch ? horasMatch[1] : horasRaw,
                    cal_no_disponible: document.body.innerText.includes('no disponible'),
                    componentes: []
                };
                document.querySelectorAll('table tbody tr').forEach(row => {
                    const cells = {};
                    row.querySelectorAll('[xe-field]').forEach(td => {
                        cells[td.getAttribute('xe-field')] = clean(td.textContent);
                    });
                    if (cells.name) {
                        cells['nested'] = row.querySelector('.nested-arrow') !== null;
                        if (cells.mustPass === 'Yes') cells.mustPass = 'Sí';
                        info.componentes.push(cells);
                    }
                });
                return info;
            }""")

            import re as _re

            def _clean_name(txt: str) -> str:
                txt = _re.sub(r'(?i)\s*press\s+enter\s+key.*', '', txt)
                return _re.sub(r'\s+', ' ', txt).strip()

            parts = course_txt.split("|")
            code_part = parts[0].strip()
            nrc = parts[1].strip() if len(parts) > 1 else ""

            # Separar código de nombre si el dropdown incluye " - Nombre"
            code_name_split = code_part.split(" - ", 1)
            codigo = code_name_split[0].strip()
            name_from_dropdown = _clean_name(code_name_split[1]) if len(code_name_split) > 1 else ""

            # Extraer nombre desde los componentes del curso (xe-field="courseTitle" en tbody)
            name_from_components = ""
            for comp in data.get("componentes", []):
                raw = comp.get("courseTitle", "").strip()
                if raw and raw.lower() not in ("course title", ""):
                    name_from_components = _clean_name(raw)
                    break

            # Prioridad: 1) dict hardcodeado  2) vista principal (nombres_map)
            #            3) componentes  4) dropdown  5) código
            nombre = (
                CURSO_NOMBRES.get(codigo)
                or nombres_map.get(codigo)
                or nombres_map.get(nrc)
                or name_from_components
                or name_from_dropdown
                or codigo
            )

            all_courses.append({
                "nrc": course_txt,
                "codigo": codigo,
                "nrc_num": nrc,
                "nombre": nombre,
                "horas": data.get("horas", ""),
                "cal_disponible": not data.get("cal_no_disponible", True),
                "componentes": data.get("componentes", [])
            })

        await browser.close()
        return all_courses


@app.post("/scrape")
async def scrape(body: ScrapeRequest = None):
    try:
        user = (body.username if body else None) or USERNAME
        pwd  = (body.password if body else None) or PASSWORD
        courses = await scrape_grades(user, pwd)
        return {"ok": True, "cursos": courses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
