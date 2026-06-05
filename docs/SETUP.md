# Setup Local — Sistema de Cuentas

## Requisitos

- Node.js 18+
- MySQL 8.0 corriendo localmente (puerto 3306)

---

## Primera vez

### 1. Instalar dependencias

```bash
# Desde la raíz del proyecto
npm install

# O por separado:
cd server && npm install
cd web && npm install
```

### 2. Configurar base de datos del backend

Crear el archivo `server/.env`:

```env
DATABASE_URL="mysql://root:TU_PASSWORD@localhost:3306/sistema_cuentas"
PORT=3001
NODE_ENV=development
```

### 3. Crear las tablas en MySQL

```bash
cd server
npx prisma db push
```

Resultado esperado:
```
Your database is now in sync with your schema.
```

### 4. Iniciar el proyecto

**Terminal 1 — Backend** (http://localhost:3001)
```bash
cd server && npm run dev
```

**Terminal 2 — Frontend** (http://localhost:5173)
```bash
cd web && npm run dev
```

O desde la raíz con los scripts del package.json raíz:
```bash
npm run server-push      # Sync schema (primera vez)
npm run server-studio    # Abre Prisma Studio en :5555
```

---

## Scripts disponibles

### Raíz (`SISTEMA_CUENTAS/`)

| Script | Qué hace |
|---|---|
| `npm run server-push` | `prisma db push` — crea/actualiza tablas |
| `npm run server-migrate` | `prisma migrate dev` — migración con historial |
| `npm run server-studio` | Abre Prisma Studio en http://localhost:5555 |
| `npm run web-dev` | Inicia frontend Vite |
| `npm run build` | Compila frontend para producción |

### Backend (`server/`)

```bash
npm run dev        # tsx watch src/server.ts (hot reload)
```

### Frontend (`web/`)

```bash
npm run dev        # Vite dev server en :5173
npm run build      # Build para producción
npm run preview    # Preview del build
```

---

## URLs en desarrollo

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api |
| Prisma Studio | http://localhost:5555 |

El frontend redirige `/api/*` al backend automáticamente (configurado en `vite.config.js`).

---

## Troubleshooting

**"Can't reach database server"**
- Verificar que MySQL esté corriendo: `net start MySQL80` (Windows)
- Verificar `DATABASE_URL` en `server/.env`

**"Port 3001 already in use"**
```bash
# Ver qué proceso usa el puerto
netstat -ano | findstr :3001
# Matar proceso
taskkill /PID <PID> /F
```

**"EPERM / access denied" al iniciar backend**
- El script `npm run dev` en server ya está configurado para no regenerar el cliente Prisma en cada inicio (soluciona el error de permisos en Windows)

**Cambios en schema.prisma**
```bash
cd server
npx prisma db push        # Sync rápido (dev)
# o
npx prisma migrate dev    # Con historial de migración
```

---

## Producción (VPS)

Ver `DOKPLOY_GUIDE.md` para la infraestructura en Contabo.

El deploy usa Docker Compose + Traefik (HTTPS automático vía DuckDNS + Let's Encrypt):
- Frontend: https://sistema-anderson.duckdns.org
- API: https://sistema-anderson.duckdns.org/api

Script de deploy: `scripts/deploy_vps.py`
