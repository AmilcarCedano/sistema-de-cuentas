"""
Script: importar_excel.py
Propósito: Limpiar la BD local sistema_cuentas e importar datos del Excel Reporte_FinControl-2.xlsx
BD: MySQL en localhost:3306, base de datos sistema_cuentas
"""

import openpyxl
import mysql.connector
from datetime import datetime, date

# ─── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "Almi",
    "database": "sistema_cuentas",
    "charset": "utf8mb4",
}

EXCEL_PATH = r"c:\Users\ANDERSON\IdeaProjects\SISTEMA_CUENTAS\Reporte_FinControl-2.xlsx"

# ─── NOMBRE DE LA CUENTA QUE SE VA A CREAR ─────────────────────────────────────
CUENTA_NOMBRE = "CUENTAS_ABRIL"
CUENTA_COLOR = "#6366f1"  # Indigo bonito

# ─── MAPEO DE CATEGORÍAS A GRUPOS (con colores) ────────────────────────────────
GRUPOS_COLORES = {
    "Gastos de jercy":          "#f59e0b",
    "DEPOSITO_DE_CENTRO_HURANCHAL": "#10b981",
    "Centro_Medico":            "#3b82f6",
    "Sin categoría":            "#6b7280",
    "GASTOS_CASA":              "#ec4899",
    "Gastos_Amilcar":           "#8b5cf6",
    "Gastos y ingresos de mamá":"#f97316",
    "PASAJES":                  "#14b8a6",
    "MEDICAMENTOS":             "#ef4444",
    "INGRESO":                  "#22c55e",
}


def normalizar_categoria(raw: str) -> str:
    """Limpia espacios extra de la categoría."""
    if not raw:
        return "Sin categoría"
    return raw.strip()


def parsear_fecha(fecha_str: str, hora_str: str) -> datetime:
    """Convierte '11/5/2026' y '12:32 a.m.' a datetime."""
    try:
        # Fecha: d/m/yyyy
        partes = fecha_str.strip().split("/")
        d, m, y = int(partes[0]), int(partes[1]), int(partes[2])

        # Hora: '12:32 a.m.' o '07:31 p.m.'
        hora_str = hora_str.strip().lower()
        am_pm = "am" if "a.m." in hora_str else "pm"
        hora_limpia = hora_str.replace("a.m.", "").replace("p.m.", "").strip()
        h, mi = map(int, hora_limpia.split(":"))
        if am_pm == "pm" and h != 12:
            h += 12
        elif am_pm == "am" and h == 12:
            h = 0

        return datetime(y, m, d, h, mi, 0)
    except Exception:
        return datetime.now()


def limpiar_bd(cursor):
    """Elimina todos los datos en orden (respetando FK constraints)."""
    print("\n🧹 Limpiando base de datos...")
    tablas = [
        "Transaccion",
        "SaldoManual",
        "PagoMensual",
        "Grupo",
        "Nota",
        "Cuenta",
    ]
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    for tabla in tablas:
        cursor.execute(f"DELETE FROM `{tabla}`;")
        cursor.execute(f"ALTER TABLE `{tabla}` AUTO_INCREMENT = 1;")
        print(f"  ✓ Tabla {tabla} limpiada")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    print("✅ BD limpiada correctamente.\n")


def cargar_excel(path: str):
    """Lee el Excel y retorna listas de ingresos y egresos."""
    wb = openpyxl.load_workbook(path)
    ws = wb["CUENTAS_ABRIL"]

    rows = list(ws.iter_rows(values_only=True))

    ingresos = []
    egresos = []
    modo = None

    for i, row in enumerate(rows):
        col0 = str(row[0]) if row[0] else ""

        if "--- TABLA DE INGRESOS ---" in col0:
            modo = "ingreso"
            continue
        if "--- TABLA DE EGRESOS ---" in col0:
            modo = "egreso"
            continue
        if "--- RESUMEN FINAL ---" in col0:
            modo = None
            continue

        # Saltar cabeceras y totales
        if col0 in ("Fecha", "") or row[4] == "TOTAL INGRESOS:" or row[4] == "TOTAL EGRESOS:":
            continue

        # Fila de datos: debe tener fecha y monto
        if modo and row[0] and row[5] is not None:
            entry = {
                "fecha": str(row[0]),
                "hora":  str(row[1]) if row[1] else "12:00 p.m.",
                "categoria": normalizar_categoria(str(row[2]) if row[2] else "Sin categoría"),
                "concepto": str(row[3]).strip() if row[3] else "",
                "nota":  str(row[4]).strip() if row[4] else None,
                "monto": float(row[5]),
                "tipo":  modo,
            }
            if modo == "ingreso":
                ingresos.append(entry)
            else:
                egresos.append(entry)

    print(f"📊 Excel leído: {len(ingresos)} ingresos, {len(egresos)} egresos")
    return ingresos, egresos


def insertar_datos(cursor, ingresos, egresos):
    """Inserta cuenta, grupos y transacciones."""

    # 1) Crear la Cuenta
    now = datetime.now()
    cursor.execute(
        """INSERT INTO Cuenta (nombre, color, orden, estado, incluirEnKpis, createdAt, updatedAt)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (CUENTA_NOMBRE, CUENTA_COLOR, 0, "activa", True, now, now),
    )
    cuenta_id = cursor.lastrowid
    print(f"✅ Cuenta creada → id={cuenta_id}, nombre='{CUENTA_NOMBRE}'")

    # 2) Recopilar categorías únicas de TODOS los registros
    todas = ingresos + egresos
    cats_unicas = sorted(set(e["categoria"] for e in todas))

    grupo_ids = {}
    for orden, cat in enumerate(cats_unicas):
        color = GRUPOS_COLORES.get(cat, "#6b7280")
        cursor.execute(
            """INSERT INTO Grupo (nombre, color, orden, cuentaId, createdAt, updatedAt)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (cat, color, orden, cuenta_id, now, now),
        )
        grupo_ids[cat] = cursor.lastrowid
        print(f"  📁 Grupo '{cat}' → id={grupo_ids[cat]}")

    # 3) Insertar Transacciones
    total_insertadas = 0
    for orden, entry in enumerate(ingresos + egresos):
        dt = parsear_fecha(entry["fecha"], entry["hora"])
        grupo_id = grupo_ids.get(entry["categoria"])
        cursor.execute(
            """INSERT INTO Transaccion
               (titulo, monto, tipo, comentario, fecha, orden, activo, cuentaId, grupoId, createdAt, updatedAt)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                entry["concepto"] or entry["categoria"],
                entry["monto"],
                entry["tipo"],
                entry["nota"],
                dt,
                orden,
                True,
                cuenta_id,
                grupo_id,
                now,
                now,
            ),
        )
        total_insertadas += 1

    print(f"\n✅ {total_insertadas} transacciones insertadas ({len(ingresos)} ingresos + {len(egresos)} egresos)")
    return cuenta_id, grupo_ids, total_insertadas


def verificar(cursor, cuenta_id):
    """Muestra resumen de lo cargado."""
    print("\n" + "="*60)
    print("📋 VERIFICACIÓN FINAL")
    print("="*60)

    cursor.execute("SELECT COUNT(*) FROM Cuenta;")
    print(f"  Cuentas en BD:      {cursor.fetchone()[0]}")

    cursor.execute("SELECT COUNT(*) FROM Grupo WHERE cuentaId = %s;", (cuenta_id,))
    print(f"  Grupos creados:     {cursor.fetchone()[0]}")

    cursor.execute("SELECT COUNT(*) FROM Transaccion WHERE cuentaId = %s;", (cuenta_id,))
    print(f"  Transacciones:      {cursor.fetchone()[0]}")

    cursor.execute(
        "SELECT COUNT(*), SUM(monto) FROM Transaccion WHERE cuentaId=%s AND tipo='ingreso';",
        (cuenta_id,)
    )
    r = cursor.fetchone()
    print(f"  Ingresos: {r[0]} registros → S/ {r[1]:.2f}")

    cursor.execute(
        "SELECT COUNT(*), SUM(monto) FROM Transaccion WHERE cuentaId=%s AND tipo='egreso';",
        (cuenta_id,)
    )
    r = cursor.fetchone()
    print(f"  Egresos:  {r[0]} registros → S/ {r[1]:.2f}")

    cursor.execute(
        """SELECT SUM(CASE WHEN tipo='ingreso' THEN monto ELSE -monto END)
           FROM Transaccion WHERE cuentaId=%s;""",
        (cuenta_id,)
    )
    neto = cursor.fetchone()[0]
    print(f"\n  💰 SALDO NETO: S/ {neto:.2f}")
    print("="*60)


def main():
    print("="*60)
    print("  IMPORTADOR EXCEL → SISTEMA_CUENTAS (MySQL)")
    print("="*60)

    # Conexión
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✅ Conectado a MySQL (sistema_cuentas)")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return

    try:
        # 1) Limpiar BD
        limpiar_bd(cursor)
        conn.commit()

        # 2) Leer Excel
        ingresos, egresos = cargar_excel(EXCEL_PATH)

        # 3) Insertar datos
        cuenta_id, grupo_ids, total = insertar_datos(cursor, ingresos, egresos)
        conn.commit()

        # 4) Verificar
        verificar(cursor, cuenta_id)

        print("\n🎉 ¡Importación completada exitosamente!")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error durante la importación: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()
        print("🔌 Conexión cerrada.")


if __name__ == "__main__":
    main()
