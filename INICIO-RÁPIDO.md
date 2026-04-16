# ⚡ INICIO RÁPIDO - Guía de 3 Pasos

## 🎯 Objetivo
Que el sistema esté funcionando en **5 minutos**.

---

## 📌 PASO 1: Crear Base de Datos

**Donde ejecutar:** En la carpeta raíz (`SISTEMA_CUENTAS/`)

```bash
npm run server-push
```

**Qué hace:**
- Instala dependencias en `server/`
- Sincroniza esquema Prisma con MySQL
- Crea tablas: `reloj_ingresos` y `reloj_egresos`

**Resultado esperado:**
```
✔ Your database is now in sync with your schema.
```

---

## 🏃 PASO 2: Iniciar Frontend (Opción 1: Simple)

**Terminal nueva** → En la carpeta raíz

```bash
npm run web-dev
```

**Qué sucede:**
- Instala dependencias en `web/`
- Inicia servidor Next.js en http://localhost:3000
- Compilación automática (espera ~30 segundos)

**Abre en navegador:** http://localhost:3000

✨ **El sistema está listo para usar**

---

## 🔍 PASO 3: Ver Base de Datos (Opcional)

**Terminal nueva** → En la carpeta raíz

```bash
npm run server-studio
```

**Qué abre:**
- Prisma Studio en http://localhost:5555
- Interfaz gráfica para ver/editar datos
- Puedes ver los ingresos/egresos que crees en la web

---

## 📊 El Sistema Ahora Funciona

```
http://localhost:3000  ← Interfaz web (crea ingresos/egresos)
        ↓
   API REST
        ↓
   MySQL BD
        ↓
http://localhost:5555  ← Prisma Studio (ver datos)
```

### Prueba:
1. En http://localhost:3000:
   - Completa el formulario "Registrar Ingreso"
   - Escribe cantidad: `100`, descripción: `Salario`
   - Haz clic en "Registrar"

2. VerAS el ingreso en:
   - Tabla "Ingresos" (abajo en la web)
   - Cambio en "Saldo" (resumen arriba)
   - Prisma Studio http://localhost:5555 (si lo abriste)

---

## 🛑 Detener Servidores

Cada terminal:
```bash
Ctrl + C
```

Esto detiene:
- Frontend (Ctrl+C en terminal 1)
- Prisma Studio (Ctrl+C en terminal 2)

---

## 🔄 La Próxima Vez

Solo necesitas:

```bash
# Terminal 1
npm run web-dev

# Terminal 2 (opcional, para ver datos)
npm run server-studio
```

**La BD ya está creada** ✅ No repitas `npm run server-push`

---

## 📚 Si Algo Falla

**Error: "Cannot find module 'next'"**
```bash
npm run web-dev  # Esto instala todo automáticamente
```

**Error: "Cannot connect to database"**
- ✅ ¿MySQL está corriendo?
  - Windows: Abre "Servicios" → "MySQL80" → Estado "Iniciado"
  - O ejecuta: `net start MySQL80`

**Error: "Port 3000 already in use"**
```bash
npm run dev -- -p 3001  # Usa puerto 3001
```

---

## 📖 Documentación Completa

Una vez que funcione:
- [README-ESTRUCTURA.md](README-ESTRUCTURA.md) - Estructura del proyecto
- [web/INSTRUCCIONES.md](web/INSTRUCCIONES.md) - Detalles frontend
- [server/INSTRUCCIONES.md](server/INSTRUCCIONES.md) - Detalles backend
- [docs/SETUP.md](docs/SETUP.md) - Instalación avanzada
- [docs/API.md](docs/API.md) - Endpoints REST
- [docs/PRISMA.md](docs/PRISMA.md) - Guía Prisma ORM

---

**¡Listo! 🚀**

Los 3 pasos tan simple:
```bash
npm run server-push   # Una sola vez
npm run web-dev       # Cada vez que develops
```

¿Preguntas? Ver documentación en `docs/` o `INSTRUCCIONES.md` en cada carpeta.
