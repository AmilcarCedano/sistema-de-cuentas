"""verificar_vps.py - Verifica estado del sistema en el VPS"""
import paramiko, urllib.request, ssl

VPS_IP   = "213.199.58.162"
VPS_USER = "root"
VPS_PASS = "19LhNC0b"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=20)

def run(cmd):
    _, stdout, _ = client.exec_command(cmd, timeout=20)
    return stdout.read().decode(errors="replace").strip()

print("=== ESTADO CONTENEDORES ===")
print(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"))

print("\n=== LOGS BACKEND (ultimas 15 lineas) ===")
print(run("docker logs sistemacuentas-backend --tail 15 2>&1"))

print("\n=== LOGS FRONTEND (ultimas 5 lineas) ===")
print(run("docker logs sistemacuentas-frontend --tail 5 2>&1"))

print("\n=== REDES DOCKER ===")
print(run("docker inspect sistemacuentas-frontend --format '{{range .NetworkSettings.Networks}}{{.NetworkID}} {{end}}'"))

client.close()

# Probar HTTPS
print("\n=== TEST HTTP ===")
urls = [
    "https://sistema-anderson.213.199.58.162.sslip.io",
    "https://api-sistema-anderson.213.199.58.162.sslip.io/api/cuentas",
]
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for url in urls:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, context=ctx, timeout=10)
        print(f"  ✅ {url} → HTTP {resp.status}")
    except Exception as e:
        print(f"  ⏳ {url} → {str(e)[:80]}")
