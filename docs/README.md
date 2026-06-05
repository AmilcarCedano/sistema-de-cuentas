# Sistema de Cuentas

Sistema web personal para gestionar finanzas: billeteras, transacciones, categorías, pagos mensuales y notas.

**Stack:** React + Vite · Express + TypeScript · Prisma · MySQL · Docker

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
├── docs/                       # Esta carpeta
├── scripts/                    # Scripts de deploy y utilidades
├── db/                         # Dumps SQL y reportes (gitignored)
├── docker-compose.yml          # Producción: Traefik + contenedores
└── package.json                # Scripts raíz para desarrollo local
```

---

## Modelos de datos

### Cuenta (Billetera)
```
id, nombre, color, orden, estado ("activa"|"cerrada")
incluirEnKpis, fechaCierre?, createdAt, updatedAt
```

### Transaccion
```
id, titulo, monto (Float), tipo ("ingreso"|"egreso")
comentario?, fecha, orden, activo
→ cuentaId, grupoId?
```

### Grupo (Categoría)
```
id, nombre, color, orden
→ cuentaId
```

### PagoMensual
```
id, nombre, monto, diaPago, comentario?, activo
ultimoPago?, mesPagado? (formato "YYYY-MM")
→ cuentaId, grupoId?
```

### SaldoManual (Arqueo físico)
```
id, nombre, monto
→ cuentaId
```

### Nota
```
id, contenido (Text), color, createdAt, updatedAt
```

---

## Funcionalidades

- Múltiples billeteras con colores personalizados
- Transacciones con categorías (Grupos)
- Drag & drop para reordenar (desktop + touch móvil)
- Activar/desactivar transacciones sin borrarlas
- Pagos mensuales recurrentes con seguimiento por mes
- Arqueo: saldo calculado vs saldo físico real
- Bloqueo/finalización de cuentas con fecha de cierre
- Exportación Excel (resumen + detalle por categoría)
- Notas con colores
- Modo incógnito (oculta montos)
- KPIs globales con filtro de cuentas
- Orden automático por fecha al editar transacciones

---

## Documentación

| Archivo | Contenido |
|---|---|
| `SETUP.md` | Cómo correr el proyecto en local |
| `API.md` | Endpoints REST completos |
| `DOKPLOY_GUIDE.md` | VPS Contabo: SSH, credenciales, CB Medic ⚠️ gitignored |
| `DOCKER_VPS_GUIDE.md` | Guía general Docker + VPS (referencia) |
