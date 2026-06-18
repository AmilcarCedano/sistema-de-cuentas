# Checklist de despliegue VPS — Sistema de Cuentas

## Pre-requisitos (ya deben estar en el VPS)

- [ ] Docker + Docker Compose instalados
- [ ] Dokploy corriendo (gestiona Traefik)
- [ ] Red `dokploy-network` creada (`docker network create dokploy-network`)
- [ ] DuckDNS `sistema-anderson.duckdns.org` apuntando a la IP del VPS
- [ ] WAHA ya levantado y funcionando (ver sección WAHA más abajo)

---

## 1. Variables de entorno — crear `.env` en la raíz del proyecto

Copiar `.env.example` y completar cada valor:

```bash
cp .env.example .env
nano .env
```

| Variable | Valor en VPS |
|---|---|
| `MYSQL_ROOT_PASSWORD` | Password segura (mín. 16 chars) |
| `MYSQL_DATABASE` | `sistema_cuentas` |
| `GEMINI_API_KEY` | Tu clave de AI Studio (`AQ.…`) |
| `WAHA_URL` | `http://host.docker.internal:3000` |
| `WAHA_API_KEY` | El mismo API key de WAHA (`anderson-waha-local-2026` o el que configures) |
| `WAHA_GROUP_ID` | ID del grupo WhatsApp (formato `120363XXXXXXXXXX@g.us`) |

---

## 2. Levantar la infraestructura

```bash
# Primera vez (o cambio en docker-compose.yml)
docker-compose up -d --build

# Ver que todos los contenedores estén OK
docker-compose ps
```

Contenedores esperados:
- `sistemacuentas-mysql` → healthy
- `sistemacuentas-redis` → healthy
- `sistemacuentas-backend` → running
- `sistemacuentas-frontend` → running

---

## 3. WAHA — configurar webhook y escanear QR

WAHA debe estar corriendo por separado en el VPS (su propio docker-compose en `/root/waha/`).

### 3.1 Configurar el webhook en WAHA

Acceder al dashboard de WAHA (`http://<IP_VPS>:3000/dashboard`) y configurar:

- **Webhook URL:** `https://sistema-anderson.duckdns.org/api/whatsapp/webhook`
- **Events:** solo `message` (desactivar el resto para no gastar recursos)

O vía API:

```bash
curl -X PUT http://localhost:3000/api/sessions/default/config \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: TU_API_KEY_WAHA" \
  -d '{
    "webhooks": [{
      "url": "https://sistema-anderson.duckdns.org/api/whatsapp/webhook",
      "events": ["message"]
    }]
  }'
```

### 3.2 Escanear el QR

```bash
# Ver QR en terminal
curl http://localhost:3000/api/screenshot?session=default \
  -H "X-Api-Key: TU_API_KEY_WAHA" --output qr.png
# O abrir http://<IP_VPS>:3000/dashboard y escanear desde ahí
```

Escanear con el número de WhatsApp que recibirá los comprobantes.

### 3.3 Verificar sesión activa

```bash
curl http://localhost:3000/api/sessions/default \
  -H "X-Api-Key: TU_API_KEY_WAHA"
# "status" debe ser "WORKING"
```

---

## 4. Obtener el ID del grupo

```bash
curl "http://localhost:3000/api/contacts?session=default&contactId=&limit=100" \
  -H "X-Api-Key: TU_API_KEY_WAHA"
```

Buscar el grupo "Pruebas" (u otro) en la lista. El `id` termina en `@g.us`.
Copiar ese valor a `WAHA_GROUP_ID` en el `.env`.

---

## 5. Verificar que todo funciona

```bash
# 1. La web debe responder
curl -I https://sistema-anderson.duckdns.org

# 2. El webhook debe responder
curl -X POST https://sistema-anderson.duckdns.org/api/whatsapp/webhook \
  -H "Content-Type: application/json" -d '{"event":"ping"}'
# debe devolver {"ok":true}

# 3. Enviar foto real al grupo de WhatsApp → debe aparecer en /Recientes
```

---

## Actualizar SOLO el backend o frontend (sin reiniciar todo)

Cuando hagas cambios en el código y quieras desplegar solo lo que cambió:

```bash
# Solo backend (server.ts, prisma, etc.)
docker-compose up -d --no-deps --build sistemacuentas-backend

# Solo frontend (App.jsx, estilos, etc.)
docker-compose up -d --no-deps --build sistemacuentas-frontend
```

`--no-deps` = no toca MySQL ni Redis
`--build` = reconstruye solo esa imagen

MySQL y Redis NO se reinician — los datos se mantienen.

---

## Consumo de recursos estimado (VPS optimizado)

| Contenedor | RAM máx configurada |
|---|---|
| MySQL | 256 MB |
| Redis | 96 MB (datos máx 64 MB) |
| Backend (Node) | 256 MB |
| Frontend (Nginx) | 64 MB |
| **Total** | **~672 MB** |

Redis no persiste en disco (solo cola temporal con TTL 24h).
WAHA corre separado — no cuenta en este stack.

---

## Notas importantes

- El flujo de WhatsApp **no corre 24/7**: se activa solo cuando llega una imagen al grupo.
- Para activarlo/desactivarlo: toggle en la sección "Recientes WhatsApp" del panel.
- Si Redis se reinicia, los pendientes se pierden (son temporales, máx 24h).
- Solo se procesan imágenes del grupo `WAHA_GROUP_ID`. Mensajes privados y de otros grupos son ignorados.
