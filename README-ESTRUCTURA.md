# Sistema de Cuentas - Estructura del Proyecto

Sistema completo de gestión de **ingresos y egresos** con arquitectura modular.

## 📁 Estructura del Proyecto

```
SISTEMA_CUENTAS/
├── web/                      # 🎨 Frontend React + Vite
│   ├── src/
│   │   ├── App.jsx           # Componente principal (SPA)
│   │   ├── main.jsx          # Punto de entrada
│   │   └── index.css         # Estilos globales + Tailwind
│   ├── public/               # Archivos estáticos
│   ├── vite.config.js        # Configuración Vite
│   ├── tailwind.config.js    # Tailwind CSS
│   ├── Dockerfile            # Docker para producción (Nginx)
│   ├── nginx.conf            # Config Nginx
│   └── package.json          # Dependencias frontend
│
├── server/                   # 🛠️ Backend Express + Prisma
│   ├── src/
│   │   └── server.ts         # API REST completa + Export Excel
│   ├── prisma/
│   │   └── schema.prisma     # Esquema de BD (MySQL)
│   ├── .env                  # Variables de BD
│   ├── Dockerfile            # Docker para producción
│   └── package.json          # Dependencias backend
│
├── docs/                     # 📚 Documentación
├── docker-compose.yml        # Orquestación Docker + Traefik
└── package.json              # Scripts raíz
```

## 🚀 Inicio Rápido

### 1️⃣ Configurar Base de Datos (Primera vez)

```bash
# Desde la carpeta server/
npx prisma db push
```

Esto crea las tablas en MySQL automáticamente.

### 2️⃣ Iniciar Desarrollo

**Terminal 1 - Backend (http://localhost:3001)**
```bash
cd server && npm run dev
```

**Terminal 2 - Frontend (http://localhost:5173)**
```bash
cd web && npm run dev
```

## 📋 Scripts Disponibles

**Desde raíz (SISTEMA_CUENTAS/):**

```bash
npm run web-dev           # Inicia frontend Vite (puerto 5173)
npm run server-push       # Crea/actualiza tablas en MySQL
npm run server-migrate    # Ejecuta Prisma migration
npm run server-studio     # Abre Prisma Studio (BD visual)
npm run build             # Compila frontend para producción
```

## 🗄️ Modelos de Datos

### Cuenta (Billetera)
```prisma
- id: Int (PK)
- nombre: String
- color: String (default: "#3b82f6")
- orden: Int
- estado: String ("activa" | "cerrada")
- incluirEnKpis: Boolean
- fechaCierre: DateTime? (fecha de cierre/bloqueo)
- createdAt, updatedAt
```

### Transaccion
```prisma
- id: Int (PK)
- titulo: String
- monto: Float
- tipo: String ("ingreso" | "egreso")
- comentario: String? (Text)
- fecha: DateTime
- orden: Int
- activo: Boolean
- cuentaId → Cuenta
- grupoId → Grupo?
```

### Grupo (Categoría)
```prisma
- id: Int (PK)
- nombre, color, orden
- cuentaId → Cuenta
```

### SaldoManual (Arqueo)
```prisma
- id, nombre, monto
- cuentaId → Cuenta
```

### Nota
```prisma
- id, contenido (Text), color
```

## 🔌 API REST

### Cuentas
- `GET    /api/cuentas` - Lista todas (con transacciones, grupos, saldos)
- `POST   /api/cuentas` - Crear nueva
- `PUT    /api/cuentas/:id` - Actualizar
- `DELETE /api/cuentas/:id` - Eliminar (cascade)
- `PATCH  /api/cuentas/:id/lock` - Bloquear/Desbloquear cuenta

### Transacciones
- `POST   /api/cuentas/:id/transacciones` - Crear
- `PUT    /api/transacciones/:id` - Actualizar
- `DELETE /api/transacciones/:id` - Eliminar
- `PUT    /api/cuentas/:id/transacciones/reorder` - Reordenar (batch)
- `PATCH  /api/transacciones/:id/activo` - Activar/Desactivar

### Grupos
- `POST   /api/cuentas/:id/grupos` - Crear categoría
- `DELETE /api/grupos/:id` - Eliminar categoría

### Saldos Manuales
- `POST   /api/cuentas/:id/saldos` - Agregar saldo físico
- `DELETE /api/saldos/:id` - Eliminar

### Notas
- `GET    /api/notas` - Listar
- `POST   /api/notas` - Crear
- `PUT    /api/notas/:id` - Actualizar
- `DELETE /api/notas/:id` - Eliminar

### Exportación
- `GET    /api/export/excel?accountId=` - Descargar reporte Excel premium

## 🔧 Configuración

**Backend:** `server/.env`
```env
DATABASE_URL="mysql://root:Almi@localhost:3306/sistema_cuentas"
```

**Frontend:** `web/.env` (opcional)
```env
VITE_API_URL=http://localhost:3001/api
```

En producción se configura via `docker-compose.yml`.

## ✅ Funcionalidades

- ✅ Múltiples billeteras con colores personalizados
- ✅ Transacciones con categorías (Grupos)
- ✅ Drag & Drop para reordenar (desktop + mobile touch)
- ✅ Activar/Desactivar transacciones
- ✅ Arqueo / Auditoría (saldos manuales vs calculados)
- ✅ Bloqueo/Finalización de cuentas con fecha de cierre
- ✅ Exportación Excel premium (resumen + detalle por categoría)
- ✅ Notas/Apuntes con colores
- ✅ Modo incógnito
- ✅ Paleta de colores guardable
- ✅ KPIs globales con filtro de cuentas
- ✅ Despliegue Docker + Traefik (HTTPS)
