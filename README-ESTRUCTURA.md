# Sistema de Cuentas - Estructura Reorganizada

Sistema completo de gestión de **ingresos y egresos** con arquitectura modular.

## 📁 Estructura del Proyecto

```
SISTEMA_CUENTAS/
├── web/                      # 🎨 Frontend Next.js + React
│   ├── app/                  # Rutas y API
│   │   ├── api/              # Endpoints REST
│   │   │   ├── ingresos/
│   │   │   └── egresos/
│   │   ├── page.js           # Dashboard principal
│   │   ├── layout.js         # Estructura HTML raíz
│   │   └── globals.css       # Estilos Tailwind
│   ├── components/           # Componentes React
│   │   ├── FormIngreso.js
│   │   ├── FormEgreso.js
│   │   ├── ListaIngresos.js
│   │   ├── ListaEgresos.js
│   │   └── Resumen.js
│   ├── lib/
│   │   └── db.js             # Prisma Client singleton
│   ├── public/               # Archivos estáticos
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json          # Scripts web
│
├── server/                   # 🛠️ Backend + BD
│   ├── prisma/
│   │   └── schema.prisma     # Esquema de BD
│   ├── .env                  # Variables de BD
│   ├── .env.local
│   └── package.json          # Scripts Prisma
│
├── docs/                     # 📚 Documentación
│   ├── README.md             # Descripción general
│   ├── SETUP.md              # Guía de instalación
│   ├── API.md                # Endpoints REST
│   └── PRISMA.md             # Guía Prisma ORM
│
└── package.json              # Scripts raíz
```

## 🚀 Inicio Rápido

### 1️⃣ Configurar Base de Datos (Primera vez)

```bash
# Desde la raíz del proyecto
npm run server-push
```

Esto crea las tablas en MySQL automáticamente.

### 2️⃣ Iniciar Desarrollo

**Terminal 1 - Frontend (http://localhost:3000)**
```bash
npm run web-dev
```

**Terminal 2 - Prisma Studio (http://localhost:5555)**
```bash
npm run server-studio
```

## 📋 Scripts Disponibles

**Desde raíz (SISTEMA_CUENTAS/):**

```bash
npm run web-dev           # Inicia frontend en dev (puerto 3000)
npm run server-push       # Crea/actualiza tablas en MySQL
npm run server-migrate    # Ejecuta Prisma migration
npm run server-studio     # Abre Prisma Studio (BD visual)
npm run build             # Compila frontend para producción
npm run start             # Inicia frontend en producción
```

## 🗄️ Modelos de Datos

### Ingreso
```prisma
- id: Int (PK)
- cantidad: Float
- descripcion: String
- categoria: String
- notas: String? (opcional)
- fecha: DateTime (auto)
- createdAt: DateTime (auto)
- updatedAt: DateTime (auto)
```

### Egreso
```prisma
- id: Int (PK)
- cantidad: Float
- descripcion: String
- categoria: String
- notas: String? (opcional)
- fecha: DateTime (auto)
- createdAt: DateTime (auto)
- updatedAt: DateTime (auto)
```

## 🔌 API REST

### Ingresos
- `GET /api/ingresos` - Lista todos
- `POST /api/ingresos` - Crear nuevo
- `DELETE /api/ingresos/[id]` - Eliminar

### Egresos
- `GET /api/egresos` - Lista todos
- `POST /api/egresos` - Crear nuevo
- `DELETE /api/egresos/[id]` - Eliminar

## 🎨 Componentes React

| Componente | Descripción |
|---|---|
| **FormIngreso** | Formulario para registrar ingresos |
| **FormEgreso** | Formulario para registrar egresos |
| **ListaIngresos** | Tabla de ingresos con opción eliminar |
| **ListaEgresos** | Tabla de egresos con opción eliminar |
| **Resumen** | Tarjetas con totales e ingresos vs egresos |

## 🔧 Configuración BD

**Archivo:** `server/.env`

```env
DATABASE_URL="mysql://root:Almi@localhost:3306/sistema_cuentas"
```

- **Host:** localhost
- **Puerto:** 3306
- **Usuario:** root
- **Contraseña:** Almi
- **BD:** sistema_cuentas

## 📚 Documentación Completa

- [SETUP.md](docs/SETUP.md) - Instalación detallada
- [API.md](docs/API.md) - Endpoints con ejemplos
- [PRISMA.md](docs/PRISMA.md) - Guía ORM

## ✅ Estado

- ✅ Estructura frontend (Next.js + React)
- ✅ Componentes completos (5 componentes)
- ✅ API REST (6 endpoints)
- ✅ Esquema Prisma
- ✅ Tailwind CSS
- 🟡 BD: Ejecutar `npm run server-push` para crear tablas
- 🟡 Dev: Ejecutar `npm run web-dev` para iniciar

---

**Próximos pasos:**
1. `npm run server-push` - Crear BD
2. `npm run web-dev` - Iniciar servidor dev
3. Abrir http://localhost:3000 en navegador
