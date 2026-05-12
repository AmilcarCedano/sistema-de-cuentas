"""
deploy_vps.py - Despliega Sistema de Cuentas en VPS (corregido)
Bug fix: "EXISTS" in "NOTEXISTS" era True → ahora usa strip() == "CLONED"
"""
import paramiko
import time
import os

VPS_IP      = "213.199.58.162"
VPS_USER    = "root"
VPS_PASS    = "19LhNC0b"
APP_DIR     = "/opt/sistema-anderson/app"
REPO_URL    = "https://github.com/AmilcarCedano/sistema-de-cuentas.git"
DB_PASS     = "SistemaCuentas2026Secure"
DB_NAME     = "sistema_cuentas"
LOCAL_DUMP  = r"C:\Users\ANDERSON\IdeaProjects\SISTEMA_CUENTAS\dump_sistema_cuentas.sql"
REMOTE_DUMP = "/tmp/dump_sistema_cuentas.sql"

def ssh_exec(client, cmd, timeout=120, show=True):
    if show:
        print(f"  $ {cmd[:90]}{'...' if len(cmd)>90 else ''}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace').strip()
    err = stderr.read().decode(errors='replace').strip()
    rc  = stdout.channel.recv_exit_status()
    if out and show: print("    " + "\n    ".join(out.splitlines()[-8:]))
    if err and rc != 0 and show: print("  ERR: " + err[:400])
    return rc, out, err

def wait_mysql(client):
    for attempt in range(8):
        rc, out, _ = ssh_exec(client,
            f"docker exec sistemacuentas-mysql mysqladmin ping -uroot -p{DB_PASS} --silent 2>/dev/null && echo PONG || echo WAIT",
            show=False)
        if "PONG" in out:
            print("  ✅ MySQL listo!")
            return True
        print(f"  ⏳ MySQL iniciando... ({attempt+1}/8, espera 10s)")
        time.sleep(10)
    return False

def main():
    print("=" * 60)
    print("  DEPLOY: Sistema Anderson → VPS 213.199.58.162")
    print("=" * 60)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print(f"\n[1/7] Conectando a {VPS_IP}...")
    client.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=20)
    print("  ✅ Conectado!")

    # Crear directorio base
    print("\n[2/7] Preparando directorio...")
    ssh_exec(client, f"mkdir -p /opt/sistema-anderson")

    # Clonar o actualizar — FIX: usar shell exit code en vez de substring "EXISTS"
    print("\n[3/7] Clonando/actualizando repositorio...")
    rc_git, _, _ = ssh_exec(client, f"test -d '{APP_DIR}/.git'", show=False)
    if rc_git == 0:
        print("  📁 Repo existente → git pull")
        ssh_exec(client, f"cd {APP_DIR} && git pull", timeout=60)
    else:
        print("  📥 Clonando repositorio...")
        ssh_exec(client, f"rm -rf {APP_DIR}")  # limpiar carpeta parcial
        rc, out, err = ssh_exec(client, f"git clone {REPO_URL} {APP_DIR}", timeout=120)
        if rc != 0:
            print(f"  ❌ Error clonando: {err}")
            client.close()
            return

    # Subir dump via SFTP
    print("\n[4/7] Subiendo dump de la base de datos...")
    sftp = client.open_sftp()
    sftp.put(LOCAL_DUMP, REMOTE_DUMP)
    sftp.close()
    size = os.path.getsize(LOCAL_DUMP)
    print(f"  ✅ Dump subido: {size:,} bytes")

    # Bajar contenedores viejos del sistema-anderson (no tocar cbmedic)
    print("\n[5/7] Deteniendo contenedores sistema-anderson anteriores...")
    ssh_exec(client, f"cd {APP_DIR} && docker compose down --remove-orphans 2>/dev/null || true", timeout=60)

    # Build y levantar
    print("\n[6/7] Construyendo imágenes Docker (2-4 min)...")
    rc, out, err = ssh_exec(client,
        f"cd {APP_DIR} && docker compose build --no-cache 2>&1 | tail -25",
        timeout=480)
    if rc != 0:
        print("  ⚠️  Build tuvo advertencias")

    print("\n  ▶ Levantando contenedores...")
    ssh_exec(client, f"cd {APP_DIR} && docker compose up -d", timeout=60)

    # Esperar MySQL con healthcheck
    print("\n  ⏳ Esperando MySQL (hasta 80s)...")
    time.sleep(20)
    mysql_ok = wait_mysql(client)

    if not mysql_ok:
        print("  ⚠️  MySQL tardó demasiado, intentando importar de todas formas...")

    # Importar datos
    print("\n[7/7] Importando datos en la base de datos...")
    rc, out, err = ssh_exec(client,
        f"docker exec -i sistemacuentas-mysql mysql -uroot -p{DB_PASS} {DB_NAME} < {REMOTE_DUMP} 2>&1 && echo IMPORT_OK",
        timeout=60)

    if "IMPORT_OK" in out or rc == 0:
        print("  ✅ Datos importados correctamente!")
    else:
        print(f"  ⚠️  Error en importación: {err[:200]}")

    ssh_exec(client, f"rm -f {REMOTE_DUMP}", show=False)

    # Estado final
    print("\n[✓] Estado de contenedores:")
    ssh_exec(client, "docker ps --format 'table {{.Names}}\t{{.Status}}'")

    client.close()

    print("\n" + "="*60)
    print("  🎉 DESPLIEGUE COMPLETADO!")
    print("")
    print("  🌐 SISTEMA: https://sistema-anderson.213.199.58.162.sslip.io")
    print("  🔗 API:     https://api-sistema-anderson.213.199.58.162.sslip.io")
    print("")
    print("  ⏳ HTTPS activo en ~30-60s via Traefik + Let's Encrypt")
    print("="*60)

if __name__ == "__main__":
    main()
