# API REST — Sistema de Cuentas

**Base URL local:** `http://localhost:3001/api`  
**Base URL producción:** `https://api-sistema-anderson.213.199.58.162.sslip.io/api`

---

## Cuentas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/cuentas` | Lista todas con transacciones, grupos, saldos y pagos |
| `POST` | `/cuentas` | Crear nueva cuenta |
| `PUT` | `/cuentas/:id` | Actualizar nombre, color, orden, incluirEnKpis |
| `DELETE` | `/cuentas/:id` | Eliminar (cascade a transacciones, grupos, etc.) |
| `PATCH` | `/cuentas/:id/lock` | Bloquear/desbloquear cuenta |

**POST /cuentas — body:**
```json
{ "nombre": "Efectivo", "color": "#10b981" }
```

**PATCH /cuentas/:id/lock — body:**
```json
{ "locked": true }
```

---

## Transacciones

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/cuentas/:id/transacciones` | Crear transacción en una cuenta |
| `PUT` | `/transacciones/:id` | Actualizar transacción |
| `DELETE` | `/transacciones/:id` | Eliminar |
| `PUT` | `/cuentas/:id/transacciones/reorder` | Reordenar batch (drag & drop) |
| `PATCH` | `/transacciones/:id/activo` | Activar/desactivar |

**POST /cuentas/:id/transacciones — body:**
```json
{
  "titulo": "Salario",
  "monto": 1500.00,
  "tipo": "ingreso",
  "comentario": "Mes de junio",
  "fecha": "2026-06-05T10:00:00.000Z",
  "grupoId": 3
}
```

**PUT /transacciones/:id — body (todos opcionales):**
```json
{
  "titulo": "Salario junio",
  "monto": 1600.00,
  "tipo": "ingreso",
  "comentario": "",
  "fecha": "2026-06-05T10:00:00.000Z",
  "grupoId": null
}
```

**PUT /cuentas/:id/transacciones/reorder — body:**
```json
{ "ordenes": [{ "id": 1, "orden": 0 }, { "id": 2, "orden": 1 }] }
```

---

## Grupos (Categorías)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/cuentas/:id/grupos` | Crear categoría en una cuenta |
| `PUT` | `/grupos/:id` | Actualizar nombre/color |
| `DELETE` | `/grupos/:id` | Eliminar (las transacciones quedan sin categoría) |

**POST /cuentas/:id/grupos — body:**
```json
{ "nombre": "Alimentación", "color": "#f59e0b" }
```

---

## Saldos Manuales (Arqueo)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/cuentas/:id/saldos` | Agregar saldo físico registrado |
| `DELETE` | `/saldos/:id` | Eliminar saldo manual |

**POST /cuentas/:id/saldos — body:**
```json
{ "nombre": "Conteo caja", "monto": 850.00 }
```

---

## Pagos Mensuales

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/cuentas/:id/pagos-mensuales` | Crear pago recurrente |
| `PUT` | `/pagos-mensuales/:id` | Actualizar |
| `DELETE` | `/pagos-mensuales/:id` | Eliminar |
| `POST` | `/pagos-mensuales/:id/pagar` | Registrar pago de un mes |

**POST /cuentas/:id/pagos-mensuales — body:**
```json
{
  "nombre": "Internet",
  "monto": 89.90,
  "diaPago": 15,
  "comentario": "Claro Hogar",
  "grupoId": 2
}
```

**POST /pagos-mensuales/:id/pagar — body:**
```json
{ "cuentaId": 1, "mesObjetivo": "2026-06" }
```

Crea una transacción de egreso y actualiza `mesPagado`. La operación es atómica (si falla una parte, se revierte todo).

---

## Notas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/notas` | Listar todas |
| `POST` | `/notas` | Crear nota |
| `PUT` | `/notas/:id` | Actualizar contenido/color |
| `DELETE` | `/notas/:id` | Eliminar |

**POST /notas — body:**
```json
{ "contenido": "Recordar pagar luz el 20", "color": "#fcd34d" }
```

---

## Exportación

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/export/excel?accountId=:id` | Descarga reporte Excel premium |

Genera un archivo `.xlsx` con resumen por categoría, historial completo y KPIs de la cuenta seleccionada.

---

## Respuestas de error

| Código | Situación |
|---|---|
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor |

Los endpoints no tienen autenticación (uso personal en red privada/VPS).
