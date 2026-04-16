# 🗄️ Guía de Prisma ORM

Prisma es el ORM (Object-Relational Mapping) que usamos para conectar la aplicación con MySQL.

---

## 📚 ¿Qué es Prisma?

Prisma es una librería que:
- ✅ Define el esquema de la BD (qué tablas y campos existen)
- ✅ Genera migraciones automáticas
- ✅ Proporciona un cliente tipado para hacer queries
- ✅ Incluye Prisma Studio (GUI para la BD)

---

## 📁 Archivos Importantes

### `prisma/schema.prisma`
Define la estructura de la base de datos.

**Ubicación:** `C:\Users\ANDERSON\IdeaProjects\SISTEMA_CUENTAS\prisma\schema.prisma`

**Estructura:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")  // De .env.local
}

model Ingreso {
  id          Int     @id @default(autoincrement())
  cantidad    Float
  descripcion String  @db.Text
  // ... más campos
}

model Egreso {
  id          Int     @id @default(autoincrement())
  cantidad    Float
  // ... más campos
}
```

**Conceptos:**
- `generator` - Cómo generar el cliente Prisma
- `datasource` - Conexión a MySQL
- `model` - Define una tabla en BD
- `@id` - Primary Key (identificador único)
- `@default` - Valor por defecto
- `@db.Text` - Tipo MySQL específico

---

## 🔄 Migraciones

Una **migración** es un cambio a la estructura de la BD.

### Crear Migración (Después de modificar schema.prisma)

```bash
npm run prisma:migrate
```

**¿Qué hace?**
1. Detecta cambios en `schema.prisma`
2. Genera archivo SQL correspondiente
3. Ejecuta el SQL en MySQL
4. Actualiza el cliente Prisma

**Ejemplo:**
Si cambias el campo `descripcion` de 200 a 500 caracteres:

```bash
npm run prisma:migrate
# Prompt: "What is the name of your migration?"
# Escribir: "increase_description_length"

# Resultado:
# ✓ Created migration `20260415_increase_description_length`
# ✓ Database has been updated
```

### Ver Migraciones

```bash
ls prisma/migrations/

# Salida:
# 20260415_init/
# 20260415_increase_description_length/
```

---

## 🎨 Prisma Studio (GUI de BD)

Interfaz web para ver/editar BD sin SQL.

### Abrir Prisma Studio

```bash
npm run prisma:studio
```

**URL:** `http://localhost:5555`

### Funcionalidades

#### Ver Tablas
1. Seleccionar modelo en sidebar (Ingreso, Egreso)
2. Tab "Data" muestra todos los registros

#### Agregar Registro
1. Click en "+ Add record"
2. Rellenar campos
3. Click en "Save"

#### Editar Registro
1. Click en registro
2. Modificar campos
3. Click en "Save"

#### Eliminar Registro
1. Click en registro
2. Click en trash icon

#### Filtrar
```
Buscador al lado de "Add record"
Ejemplo: cantidad > 1000
```

---

## 💻 Usando Prisma en Código

### Importar Cliente Prisma

**Archivo:** `lib/db.js`
```javascript
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

### En API Routes

Ejemplo: `app/api/ingresos/route.js`

```javascript
import { prisma } from "@/lib/db";

// GET - Obtener todos
export async function GET() {
  const ingresos = await prisma.ingreso.findMany();
  return Response.json(ingresos);
}

// POST - Crear nuevo
export async function POST(request) {
  const body = await request.json();
  const ingreso = await prisma.ingreso.create({
    data: {
      cantidad: body.cantidad,
      descripcion: body.descripcion,
      categoria: body.categoria,
    },
  });
  return Response.json(ingreso, { status: 201 });
}
```

---

## 📖 Operaciones Comunes

### Crear Registro

```javascript
const nuevoIngreso = await prisma.ingreso.create({
  data: {
    cantidad: 1000,
    descripcion: "Salario",
    categoria: "Salario",
    notas: "Salario abril",
  },
});
```

### Obtener Todos

```javascript
const ingresos = await prisma.ingreso.findMany();
```

### Obtener Todos (Ordenado)

```javascript
const ingresos = await prisma.ingreso.findMany({
  orderBy: { fecha: 'desc' },  // desc = descendente, asc = ascendente
});
```

### Obtener Uno por ID

```javascript
const ingreso = await prisma.ingreso.findUnique({
  where: { id: 1 },
});
```

### Actualizar Registro

```javascript
const ingreso = await prisma.ingreso.update({
  where: { id: 1 },
  data: {
    cantidad: 1500,  // Cambiar cantidad
    describiendo: "Nuevo nombre",
  },
});
```

### Eliminar Registro

```javascript
const ingreso = await prisma.ingreso.delete({
  where: { id: 1 },
});
```

### Filtrar (Where)

```javascript
// Ingresos mayores a 500
const ingresos = await prisma.ingreso.findMany({
  where: { cantidad: { gt: 500 } },  // gt = greater than
});

// Operadores: gt, gte, lt, lte, equals, not, in, notIn, contains
```

### Contar Registros

```javascript
const count = await prisma.ingreso.count();
```

### Obtener con Paginación

```javascript
const ingresos = await prisma.ingreso.findMany({
  skip: 0,      // Saltar primeros N registros
  take: 10,     // Tomar 10 registros
  orderBy: { fecha: 'desc' },
});
```

---

## 🔍 Debugging

### Ver SQL que genera Prisma

En `lib/db.js`:
```javascript
const prisma = new PrismaClient({
  log: ["query", "error"],  // Muestra queries en consola
});
```

### Acceder a BD directamente

```bash
mysql -u root -pAlmi sistema_cuentas
```

### Validar esquema

```bash
npx prisma validate
```

---

## 🚨 Errores Comunes

### Error: "Prisma migrations not run"

**Solución:**
```bash
npm run prisma:migrate
```

### Error: "Can't reach database server"

**Solución:**
1. Verificar MySQL corriendo
2. Verificar credenciales en `.env.local`

### Error: "Unique constraint failed"

**Causa:** Intentar crear registro con campo único duplicado

```javascript
// Si tienes UNIQUE en schema
model Ingreso {
  email String @unique  // No pueden haber 2 iguales
}

// Error si intentas crear 2 con mismo email
```

### Error: "Column not found"

**Causa:** Cambio en schema pero migraciones no ejecutadas

```bash
npm run prisma:migrate
```

---

## 🔧 Modificar Esquema

### Agregar Campo a Tabla

**Paso 1:** Modifica `prisma/schema.prisma`
```prisma
model Ingreso {
  // ... campos existentes
  metodoPago String  @default("Efectivo")  // NUEVO
}
```

**Paso 2:** Crea migración
```bash
npm run prisma:migrate
# Escribe: "add_metodopago_to_ingreso"
```

**Paso 3:** Actualiza código de la app

```javascript
// En POST /api/ingresos
const ingreso = await prisma.ingreso.create({
  data: {
    cantidad: body.cantidad,
    metodoPago: body.metodoPago,  // NUEVO
  },
});
```

### Agregar Nueva Tabla

**Paso 1:** Modifica `prisma/schema.prisma`
```prisma
model Categoria {
  id    Int     @id @default(autoincrement())
  nombre String @unique
}
```

**Paso 2:** Migra
```bash
npm run prisma:migrate
# "add_categoria_model"
```

**Paso 3:** Usa en queries
```javascript
const categorias = await prisma.categoria.findMany();
```

---

## 📊 Relaciones (Futuro)

Para asociar Ingresos con Categorías:

```prisma
model Categoria {
  id      Int     @id @default(autoincrement())
  nombre  String  @unique
  ingresos Ingreso[]  // Relación inversa
}

model Ingreso {
  // ... campos
  categoriaId Int
  categoria Categoria @relation(fields: [categoriaId], references: [id])
}
```

Query con relación:
```javascript
const ingresos = await prisma.ingreso.findMany({
  include: { categoria: true },  // Incluye datos de categoria
});
```

---

## 🎓 Aprender Más

- 📖 [Prisma Docs Oficial](https://www.prisma.io/docs)
- 🎥 [Prisma Studio Tutorial](https://www.prisma.io/docs/orm/tools/prisma-studio)
- 💡 [Prisma Query Engine](https://www.prisma.io/docs/orm/reference/prisma-client-reference)

---

## ✅ Checklist para Cambios de BD

1. ✅ Editar `prisma/schema.prisma`
2. ✅ Ejecutar `npm run prisma:migrate`
3. ✅ Escribir nombre de migración
4. ✅ Esperar a "Database has been updated"
5. ✅ Actualizar código en API routes
6. ✅ Reiniciar servidor (`npm run dev`)
7. ✅ Verificar en Prisma Studio (`npm run prisma:studio`)

---

**Última actualización:** 15 de abril de 2026
