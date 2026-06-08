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
    if sys.platform != "win32":
        return ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
    # Cada subdominio tiene IPs distintos — no usar wildcard.
    # Los dominios .pe de UPAO rechazan a Google DNS → IPs hardcodeados como fallback.
    exp_ip    = _resolve_ip("eee-dashboard-prod.10005.elluciancloud.com", "52.0.235.226")
    api_ip    = _resolve_ip("eee-api.10005.elluciancloud.com",            "54.230.124.29")
    sso_ip    = _resolve_ip("upaosso.upao.edu.pe",                        "200.62.147.92")
    rules = ",".join([
        f"MAP experience.elluciancloud.com {exp_ip}",
        f"MAP eee-dashboard-prod.10005.elluciancloud.com {exp_ip}",
        f"MAP eee-api.10005.elluciancloud.com {api_ip}",
        f"MAP upaosso.upao.edu.pe {sso_ip}",
        "MAP ssb.upao.edu.pe 129.153.7.236",
        "MAP login.upao.edu.pe 129.153.7.236",
    ])
    return [f"--host-resolver-rules={rules}"]

CHROMIUM_ARGS = _build_chromium_args()

app = FastAPI()

USERNAME = os.environ.get("UPAO_USER", "000280169")
PASSWORD = os.environ.get("UPAO_PASS", "AlmiGamer12")

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

async def scrape_grades(user: str = None, pwd: str = None):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=CHROMIUM_ARGS
        )
        context = await browser.new_context(ignore_https_errors=True)
        page = await context.new_page()

        # 1. Iniciar SSO — Experience redirige via SAML a upaosso.upao.edu.pe
        await page.goto(
            "https://experience.elluciancloud.com/upao/",
            wait_until="domcontentloaded", timeout=40000
        )
        # goto() ya sigue los redirects SAML; si no llegó, esperamos
        if "upaosso.upao.edu.pe" not in page.url:
            await page.wait_for_url("*upaosso.upao.edu.pe*", timeout=30000)
        # 2. Esperar el form de login
        await page.wait_for_selector("input[name='id_usuario']", timeout=15000)
        await page.fill("input[name='id_usuario']", user or USERNAME)
        await page.fill("input[name='nip']", pwd or PASSWORD)
        await page.click("input[name='btn_valida']")

        # 3. SAML callback vuelve a Experience, no a SSB directamente
        try:
            await page.wait_for_url("*experience.elluciancloud.com*", timeout=40000)
        except Exception:
            pass  # puede que ya esté en experience o en otra URL

        # 4. Navegar directo a SSB — el cookie de sesión de upaosso permite CAS auto-login
        active_page = page
        await active_page.goto(
            "https://ssb.upao.edu.pe/StudentSelfService/ssb/studentGrades",
            wait_until="domcontentloaded", timeout=50000
        )
        # Si CAS redirige de vuelta a upaosso para el ticket, esperar que vuelva a SSB
        if "upaosso" in active_page.url:
            await active_page.wait_for_url("*ssb.upao.edu.pe*", timeout=30000)
        try:
            await active_page.wait_for_load_state("networkidle", timeout=20000)
        except Exception:
            pass

        await asyncio.sleep(5)

        # Seleccionar periodo más reciente (primer item que no sea "All Terms")
        await active_page.click("#term-readonly")
        await asyncio.sleep(2)
        period_selected = False
        for opt in await active_page.locator(".select2-results li").all():
            txt = await opt.inner_text()
            if "All Terms" not in txt and txt.strip():
                await opt.click()
                period_selected = True
                break
        if not period_selected:
            raise Exception("No se encontró periodo disponible")
        await asyncio.sleep(3)

        # Seleccionar nivel (primer item disponible, usualmente PREGRADO)
        await active_page.click("#level-readonly")
        await asyncio.sleep(2)
        for opt in await active_page.locator(".select2-results li").all():
            txt = await opt.inner_text()
            if txt.strip():
                await opt.click()
                break
        await asyncio.sleep(8)
        await active_page.wait_for_selector("#courseWorkContainer", timeout=20000)

        # Entrar a la vista de componentes (texto en inglés en SSB)
        await active_page.locator(
            "a:has-text('Components'), button:has-text('Components')"
        ).first.click()
        await asyncio.sleep(5)
        await active_page.wait_for_load_state("networkidle", timeout=20000)

        # Obtener lista de cursos del selector
        await active_page.click("#courses-readonly")
        await asyncio.sleep(2)
        course_options = []
        for opt in await active_page.locator(".select2-results li").all():
            txt = (await opt.inner_text()).strip()
            if txt and "seleccionar" not in txt.lower():
                course_options.append(txt)
        await active_page.keyboard.press("Escape")
        await asyncio.sleep(0.5)

        all_courses = []

        for course_txt in course_options:
            # Abrir selector y seleccionar curso
            await active_page.click("#courses-readonly")
            await asyncio.sleep(2)
            for opt in await active_page.locator(".select2-results li").all():
                opt_txt = (await opt.inner_text()).strip()
                if opt_txt == course_txt:
                    await opt.click()
                    break

            await asyncio.sleep(5)
            await active_page.wait_for_load_state("networkidle", timeout=20000)

            # Expandir subcomponentes cerrados
            arrows = active_page.locator(".nested-arrow.nested-arrow-closed")
            for i in range(await arrows.count()):
                try:
                    await arrows.nth(i).click()
                    await asyncio.sleep(0.4)
                except:
                    pass
            await asyncio.sleep(1)

            # Extraer datos
            data = await active_page.evaluate("""() => {
                const clean = (txt) => txt.trim().replace(/\\s+/g,' ');
                // Título del curso seleccionado (header de la sección de componentes)
                const titleEl = document.querySelector('.grade-component-course-title, [xe-field="courseTitle"]');
                const titulo = titleEl ? clean(titleEl.textContent).split('Press')[0] : '';
                // Horas
                const horasEl = document.querySelector('[xe-field="creditHours"]');
                const horasRaw = horasEl ? clean(horasEl.textContent) : '';
                const horasMatch = horasRaw.match(/([\\d.]+)/);
                const horas = horasMatch ? horasMatch[1] : horasRaw;
                const info = {
                    titulo: titulo,
                    horas: horas,
                    cal_no_disponible: document.body.innerText.includes('no disponible'),
                    componentes: []
                };
                // Solo filas de componentes (tienen campo 'name'), no las de resumen del curso
                document.querySelectorAll('table tbody tr').forEach(row => {
                    const cells = {};
                    row.querySelectorAll('[xe-field]').forEach(td => {
                        cells[td.getAttribute('xe-field')] = clean(td.textContent);
                    });
                    // Solo incluir filas que tengan el campo 'name' (componentes de calificación)
                    if (cells.name) {
                        cells['nested'] = row.querySelector('.nested-arrow') !== null;
                        // Normalizar mustPass a español para compatibilidad con el UI
                        if (cells.mustPass === 'Yes') cells.mustPass = 'Sí';
                        info.componentes.push(cells);
                    }
                });
                return info;
            }""")

            # Parsear código del curso desde "ISIA 107 | 5592"
            parts = course_txt.split("|")
            codigo = parts[0].strip()  # "ISIA 107"
            nrc = parts[1].strip() if len(parts) > 1 else ""
            nombre = CURSO_NOMBRES.get(codigo, data.get("titulo", codigo))

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
