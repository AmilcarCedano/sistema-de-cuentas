# 🎨 WEB - Frontend Next.js + React

## 📌 Descripción

Frontend completo desarrollado con **Next.js 15** y **React 19**, incluyendo:
- ✅ Componentes React para ingresos/egresos
- ✅ Formularios validados
- ✅ Tablas de datos
- ✅ Dashboard de resumen
- ✅ Estilos con **Tailwind CSS**

## 🚀 Cómo Usar

### Instalación (Primera vez)
```bash
cd web
npm install
```

### Desarrollo
```bash
npm run dev
```
Abre http://localhost:3000 en tu navegador.

### Compilar para Producción
```bash
npm run build
npm start
```

## 📁 Estructura

```
web/
├── app/
│   ├── api/                    # Rutas API REST
│   │   ├── ingresos/
│   │   │   ├── route.js        # GET (lista) / POST (crear)
│   │   │   └── [id]/route.js   # DELETE
│   │   └── egresos/
│   │       ├── route.js        # GET (lista) / POST (crear)
│   │       └── [id]/route.js   # DELETE
│   ├── layout.js               # HTML raíz (header, meta)
│   ├── page.js                 # Dashboard principal ✨
│   └── globals.css             # Tailwind + estilos globales
├── components/
│   ├── FormIngreso.js          # 📝 Formulario ingresos
│   ├── FormEgreso.js           # 📝 Formulario egresos
│   ├── ListaIngresos.js        # 📋 Tabla ingresos
│   ├── ListaEgresos.js         # 📋 Tabla egresos
│   └── Resumen.js              # 📊 Tarjetas de totales
├── lib/
│   └── db.js                   # 🔗 Prisma Client (conexión BD)
├── public/                     # 📦 Archivos estáticos
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 🔌 Endpoints API

Todos los endpoints están en `app/api/`:

### Ingresos
```
GET    /api/ingresos           # Obtener todos
POST   /api/ingresos           # Crear nuevo
DELETE /api/ingresos/[id]      # Eliminar por ID
```

### Egresos
```
GET    /api/egresos            # Obtener todos
POST   /api/egresos            # Crear nuevo
DELETE /api/egresos/[id]       # Eliminar por ID
```

## 🎨 Componentes React

### FormIngreso.js
Renderiza un formulario para registrar ingresos:
- Campos: Cantidad, Descripción, Categoría, Notas
- Validación y envío a `/api/ingresos`
- Props: `onSuccess()` callback al crear

### FormEgreso.js
Similar a FormIngreso, para registrar egresos.

### ListaIngresos.js
Muestra tabla de todos los ingresos:
- Columnas: Fecha, Descripción, Categoría, Cantidad
- Botón eliminar por ingreso
- Recarga automática al eliminar

### ListaEgresos.js
Equivalente a ListaIngresos, para egresos.

### Resumen.js
Dashboard con 3 tarjetas:
- 🟢 Total Ingresos
- 🔴 Total Egresos
- 🔵 Saldo (Ingresos - Egresos)

## 🔗 Conexión a BD

**Archivo:** `lib/db.js`

Importa `PrismaClient` y lo exporta como singleton. Esto permite:
- ✅ Una única conexión compartida
- ✅ Sin múltiples conexiones abiertas
- ✅ Compatible con desarrollo y producción

**Uso en componentes API:**
```javascript
import { prisma } from '@/lib/db';

// Usar directamente:
const usuarios = await prisma.ingreso.findMany();
```

**Nota:** En `lib/db.js` se define `NODE_ENV` para autosincronizar con BD en desarrollo.

## 🛠️ Desarrollo

### Scripts
```bash
npm run dev      # Inicia servidor dev
npm run build    # Compila para producción
npm start        # Inicia servidor (requiere build)
npm run lint     # Ejecuta ESLint
```

### Estructura de Archivos

Cada ruta API en `app/api/` se convierte automáticamente:
- `app/api/ingresos/route.js` → `GET/POST /api/ingresos`
- `app/api/ingresos/[id]/route.js` → `DELETE /api/ingresos/123`

### Componentes "use client"

Todos los componentes en `components/` usan:
```javascript
'use client'  // Permite hooks (useState, useEffect)
```

## 🎯 Flujo de Datos

```
Usuario en navegador
        ↓
React Componente (FormIngreso)
        ↓
POST /api/ingresos
        ↓
API Route (app/api/ingresos/route.js)
        ↓
Prisma ORM (lib/db.js)
        ↓
MySQL BD (en server/)
        ↓
Response JSON
        ↓
Componente actualiza UI (ListaIngresos)
```

## ⚠️ Problemas Comunes

**Error: "Cannot find @/lib/db"**
- Asegúrate que `lib/db.js` existe en esta carpeta (web/lib/)

**Error: "Prisma Client not initialized"**
- Verifica que `server/` tiene `prisma/schema.prisma`
- Ejecuta `npm run server-push` desde raíz para crear tablas

**Puerto 3000 ya en uso**
- Ejecuta: `npm run dev -- -p 3001`

## 📚 Documentación Relacionada

- [ROOT README](../README-ESTRUCTURA.md) - Estructura general
- [../docs/SETUP.md](../docs/SETUP.md) - Instalación detallada
- [../docs/API.md](../docs/API.md) - Endpoints con ejemplos
