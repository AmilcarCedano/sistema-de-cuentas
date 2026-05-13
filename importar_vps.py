"""importar_vps.py - Importa datos limpios al VPS"""
import paramiko, time

VPS_IP   = "213.199.58.162"
VPS_USER = "root"
VPS_PASS = "19LhNC0b"
DB_PASS  = "SistemaCuentas2026Secure"
DB_NAME  = "sistema_cuentas"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=20)
print("Conectado al VPS")

sftp = client.open_sftp()
sftp.put("dump_clean.sql", "/tmp/dump_clean.sql")
sftp.close()
print("Dump subido")

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
    out = stdout.read().decode(errors="replace").strip()
    err = stderr.read().decode(errors="replace").strip()
    rc  = stdout.channel.recv_exit_status()
    if out: print("  OUT:", out[:300])
    if err and rc != 0: print("  ERR:", err[:300])
    return rc, out

# Importar via docker exec
print("Importando datos...")
rc, out = run(f"docker exec -i sistemacuentas-mysql mysql -uroot -p{DB_PASS} --default-character-set=utf8mb4 {DB_NAME} < /tmp/dump_clean.sql && echo IMPORT_OK")
if rc == 0 or "IMPORT_OK" in out:
    print("Datos importados correctamente!")
else:
    print("Error importando, verificando estado...")

run("rm -f /tmp/dump_clean.sql")

# Verificar datos
def qry(sql):
    _, stdout, _ = client.exec_command(f"docker exec sistemacuentas-mysql mysql -uroot -p{DB_PASS} {DB_NAME} -se \"{sql}\" 2>/dev/null")
    return stdout.read().decode(errors="replace").strip()

print("\n=== VERIFICACION EN VPS ===")
print("Cuentas:       ", qry("SELECT COUNT(*) FROM Cuenta"))
print("Grupos:        ", qry("SELECT COUNT(*) FROM Grupo"))
print("Transacciones: ", qry("SELECT COUNT(*) FROM Transaccion"))
print("Ingresos:      ", qry("SELECT CONCAT(COUNT(*), ' - S/', ROUND(SUM(monto),2)) FROM Transaccion WHERE tipo='ingreso'"))
print("Egresos:       ", qry("SELECT CONCAT(COUNT(*), ' - S/', ROUND(SUM(monto),2)) FROM Transaccion WHERE tipo='egreso'"))
print("Saldo neto:    S/", qry("SELECT ROUND(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE -monto END),2) FROM Transaccion"))

client.close()
print("\nListo!")
