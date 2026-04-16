# 📡 Documentación de API

Todos los endpoints están en `/app/api/` y son accesibles cuando el servidor está corriendo.

**URL Base:** `http://localhost:3000/api`

---

## 💰 Ingresos

### GET /api/ingresos
Obtiene todos los ingresos registrados.

**Método:** `GET`
**URL:** `http://localhost:3000/api/ingresos`

**Respuesta (200 OK):**
```json
[
  {
    "id": 1,
    "cantidad": 1000,
    "descripcion": "Salario mensual",
    "categoria": "Salario",
    "fecha": "2026-04-15T10:30:00.000Z",
    "notas": "Salario abril",
    "createdAt": "2026-04-15T10:30:00.000Z",
    "updatedAt": "2026-04-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "cantidad": 500,
    "descripcion": "Venta de artículos",
    "categoria": "Venta",
    "fecha": "2026-04-15T11:00:00.000Z",
    "notas": null,
    "createdAt": "2026-04-15T11:00:00.000Z",
    "updatedAt": "2026-04-15T11:00:00.000Z"
  }
]
```

**Nota:** Los ingresos se devuelven ordenados por fecha descendente (más recientes primero).

---

### POST /api/ingresos
Crea un nuevo ingreso.

**Método:** `POST`
**URL:** `http://localhost:3000/api/ingresos`
**Content-Type:** `application/json`

**Body (ejemplo):**
```json
{
  "cantidad": 1500,
  "descripcion": "Freelance proyecto web",
  "categoria": "Venta",
  "notas": "Proyecto completado"
}
```

**Campos requeridos:**
| Campo | Tipo | Requerido | Notas |
|-------|------|----------|-------|
| cantidad | Float | ✅ | Monto del ingreso |
| descripcion | String | ✅ | Máx 500 caracteres |
| categoria | String | ❌ | Default: "General" |
| notas | String | ❌ | Campo opcional |

**Respuesta (201 Created):**
```json
{
  "id": 3,
  "cantidad": 1500,
  "descripcion": "Freelance proyecto web",
  "categoria": "Venta",
  "fecha": "2026-04-15T12:00:00.000Z",
  "notas": "Proyecto completado",
  "createdAt": "2026-04-15T12:00:00.000Z",
  "updatedAt": "2026-04-15T12:00:00.000Z"
}
```

**Errores:**
- `400 Bad Request` - Campos faltantes o inválidos
- `500 Internal Server Error` - Error en BD

---

### DELETE /api/ingresos/[id]
Elimina un ingreso específico.

**Método:** `DELETE`
**URL:** `http://localhost:3000/api/ingresos/1`

**Parámetro:**
- `id` (URL) - ID del ingreso a eliminar (entero)

**Respuesta (200 OK):**
```json
{
  "id": 1,
  "cantidad": 1000,
  "descripcion": "Salario mensual",
  "categoria": "Salario",
  "fecha": "2026-04-15T10:30:00.000Z",
  "notas": "Salario abril",
  "createdAt": "2026-04-15T10:30:00.000Z",
  "updatedAt": "2026-04-15T10:30:00.000Z"
}
```

**Errores:**
- `404 Not Found` - ID de ingreso no existe
- `500 Internal Server Error` - Error en BD

---

## 💳 Egresos

### GET /api/egresos
Obtiene todos los egresos registrados.

**Método:** `GET`
**URL:** `http://localhost:3000/api/egresos`

**Respuesta (200 OK):**
```json
[
  {
    "id": 1,
    "cantidad": 200,
    "descripcion": "Comida semana",
    "categoria": "Comida",
    "fecha": "2026-04-15T08:00:00.000Z",
    "notas": "",
    "createdAt": "2026-04-15T08:00:00.000Z",
    "updatedAt": "2026-04-15T08:00:00.000Z"
  }
]
```

**Nota:** Los egresos se devuelven ordenados por fecha descendente.

---

### POST /api/egresos
Crea un nuevo egreso.

**Método:** `POST`
**URL:** `http://localhost:3000/api/egresos`
**Content-Type:** `application/json`

**Body (ejemplo):**
```json
{
  "cantidad": 50,
  "descripcion": "Gasolina carro",
  "categoria": "Transporte",
  "notas": "Carga completa"
}
```

**Campos requeridos:**
| Campo | Tipo | Requerido | Notas |
|-------|------|----------|-------|
| cantidad | Float | ✅ | Monto del egreso |
| descripcion | String | ✅ | Máx 500 caracteres |
| categoria | String | ❌ | Default: "General" |
| notas | String | ❌ | Campo opcional |

**Respuesta (201 Created):**
```json
{
  "id": 2,
  "cantidad": 50,
  "descripcion": "Gasolina carro",
  "categoria": "Transporte",
  "fecha": "2026-04-15T12:30:00.000Z",
  "notas": "Carga completa",
  "createdAt": "2026-04-15T12:30:00.000Z",
  "updatedAt": "2026-04-15T12:30:00.000Z"
}
```

---

### DELETE /api/egresos/[id]
Elimina un egreso específico.

**Método:** `DELETE`
**URL:** `http://localhost:3000/api/egresos/1`

**Parámetro:**
- `id` (URL) - ID del egreso a eliminar (entero)

**Respuesta (200 OK):**
```json
{
  "id": 1,
  "cantidad": 200,
  "descripcion": "Comida semana",
  "categoria": "Comida",
  "fecha": "2026-04-15T08:00:00.000Z",
  "notas": "",
  "createdAt": "2026-04-15T08:00:00.000Z",
  "updatedAt": "2026-04-15T08:00:00.000Z"
}
```

---

## 🧪 Ejemplos con curl

### Crear un Ingreso
```bash
curl -X POST http://localhost:3000/api/ingresos \
  -H "Content-Type: application/json" \
  -d '{
    "cantidad": 2000,
    "descripcion": "Bonus laboral",
    "categoria": "Salario"
  }'
```

### Obtener todos los Ingresos
```bash
curl http://localhost:3000/api/ingresos
```

### Eliminar un Ingreso
```bash
curl -X DELETE http://localhost:3000/api/ingresos/1
```

### Crear un Egreso
```bash
curl -X POST http://localhost:3000/api/egresos \
  -H "Content-Type: application/json" \
  -d '{
    "cantidad": 100,
    "descripcion": "Utilidades",
    "categoria": "Utilidades",
    "notas": "Agua y luz"
  }'
```

---

## 📊 Códigos de Estado HTTP

| Código | Significado |
|--------|-----------|
| 200 | Éxito GET o DELETE |
| 201 | Éxito POST (recurso creado) |
| 400 | Bad Request - Datos inválidos |
| 404 | Not Found - Recurso no existe |
| 500 | Internal Server Error - Error del servidor |

---

## ⏱️ Rendimiento

**Índices Base de Datos:**
- Ambas tablas tienen índice en campo `fecha` para búsquedas rápidas
- Queries típicas: **< 50ms**

**Límite de Registros:**
- No hay límite por defecto (potencial de optimización futura)
- Para aplicaciones con miles de registros, considerar paginación

---

## 🔐 Seguridad (Consideraciones Futuras)

Actualmente la API es **abierta sin autenticación**. Para producción:

1. Agregar JWT authentication
2. Validación más estricta de inputs
3. Rate limiting
4. HTTPS obligatorio
5. CORS configurado

---

## 🌐 Testing en Postman

1. Descargar [Postman](https://www.postman.com/downloads/)
2. Crear colección "Sistema Cuentas"
3. Agregar requests:
   - `GET /api/ingresos`
   - `POST /api/ingresos`
   - `DELETE /api/ingresos/:id`
   - `GET /api/egresos`
   - `POST /api/egresos`
   - `DELETE /api/egresos/:id`

---

**Última actualización:** 15 de abril de 2026
