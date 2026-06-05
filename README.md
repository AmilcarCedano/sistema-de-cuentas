# Sistema de Cuentas

Sistema web personal para gestionar finanzas: billeteras, transacciones, categorías, pagos mensuales y notas.

**Demo en producción:** https://sistema-anderson.duckdns.org

**Stack:** React + Vite · Express + TypeScript · Prisma · MySQL · Docker

---

## Funcionalidades

- Múltiples billeteras con colores personalizados
- Transacciones con categorías (Grupos)
- Drag & drop para reordenar (desktop + touch móvil)
- Activar/desactivar transacciones sin borrarlas
- Pagos mensuales recurrentes con seguimiento por mes y botón "Pagar este mes"
- Arqueo: saldo calculado vs saldo físico real
- Bloqueo/finalización de cuentas con fecha de cierre
- Exportación Excel (resumen + detalle por categoría)
- Notas con colores
- Modo incógnito (oculta montos)
- KPIs globales con filtro de cuentas
- Orden automático por fecha al editar transacciones

---

## Estructura del proyecto

```
SISTEMA_CUENTAS/
├── web/                        # Frontend React + Vite
│   ├── src/
│   │   ├── App.jsx             # SPA principal (toda la UI)
│   │   └── index.css           # Estilos globales + Tailwind
│   ├── nginx.conf              # Proxy reverso en producción
│   ├── Dockerfile
│   └── vite.config.js          # Proxy /api → localhost:3001 en dev
│
├── server/                     # Backend Express + Prisma
│   ├── src/server.ts           # API REST completa
│   ├── prisma/schema.prisma    # Esquema MySQL
│   ├── .env                    # DATABASE_URL (no commitear)
│   └── Dockerfile
│
├── docs/                       # Documentación
├── scripts/                    # Scripts de deploy y utilidades
├── db/                         # Dumps SQL (gitignored)
├── docker-compose.yml          # Producción: Traefik + contenedores
└── package.json                # Scripts raíz para desarrollo local
```

---

## Setup local

Ver [`docs/SETUP.md`](docs/SETUP.md) para instrucciones completas.

```bash
# Instalar dependencias
cd server && npm install
cd ../web && npm install

# Crear server/.env con DATABASE_URL
# Sincronizar schema
cd server && npx prisma db push

# Iniciar
cd server && npm run dev      # http://localhost:3001
cd web && npm run dev          # http://localhost:5173
```

---

## API

Ver [`docs/API.md`](docs/API.md) para todos los endpoints.

**Base URL producción:** `https://sistema-anderson.duckdns.org/api`

---

## Producción (VPS)

Desplegado en Contabo VPS con Docker Compose + Traefik (HTTPS automático via DuckDNS + Let's Encrypt).

| Servicio | URL |
|---|---|
| Frontend | https://sistema-anderson.duckdns.org |
| API | https://sistema-anderson.duckdns.org/api |

La API no está expuesta directamente: nginx dentro del contenedor frontend la proxea internamente hacia el backend.
