# 📊 Sistema de Cuentas - Documentación Completa

## 🎯 ¿Qué es?

Un sistema web moderno para gestionar **ingresos y egresos** con:
- ✅ **Frontend React** | Interfaz moderna con Tailwind CSS
- ✅ **Backend API** | Rutas API con Next.js
- ✅ **Prisma ORM** | Gestión de base de datos MySQL
- ✅ **Base de Datos MySQL** | Almacenamiento local

---

## 📦 Estructura del Proyecto

```
SISTEMA_CUENTAS/
├── app/
│   ├── api/
│   │   ├── ingresos/
│   │   │   ├── route.js          (GET/POST ingresos)
│   │   │   └── [id]/route.js     (DELETE ingreso)
│   │   └── egresos/
│   │       ├── route.js          (GET/POST egresos)
│   │       └── [id]/route.js     (DELETE egreso)
│   ├── layout.js                 (Layout principal)
│   ├── page.js                   (Página principal)
│   └── globals.css               (Estilos globales)
├── components/
│   ├── FormIngreso.js            (Formulario para registrar ingreso)
│   ├── FormEgreso.js             (Formulario para registrar egreso)
│   ├── ListaIngresos.js          (Tabla de ingresos)
│   ├── ListaEgresos.js           (Tabla de egresos)
│   └── Resumen.js                (Resumen de totales)
├── lib/
│   └── db.js                     (Cliente Prisma singleton)
├── prisma/
│   └── schema.prisma             (Esquema de BD)
├── public/
├── docs/
│   ├── README.md                 (Este archivo)
│   ├── SETUP.md                  (Guía de instalación)
│   ├── API.md                    (Documentación de API)
│   └── PRISMA.md                 (Guía de Prisma)
├── .env.local                    (Credenciales - NO COMMITEAR)
├── package.json                  (Dependencias)
├── next.config.js                (Config de Next.js)
└── tailwind.config.js            (Config de Tailwind)
```

---

## 🚀 Comandos Rápidos

### Iniciar el proyecto en desarrollo
```bash
npm run dev
```
El proyecto estará disponible en: **http://localhost:3000**

### Ver/Editar BD con Prisma Studio
```bash
npm run prisma:studio
```
Se abrirá una interfaz web para gestionar la BD gráficamente en: **http://localhost:5555**

### Crear migraciones (cuando modifiques schema.prisma)
```bash
npm run prisma:migrate
```

### Compilar para producción
```bash
npm run build
npm start
```

---

## 📋 Características

### 🟢 Ingresos
- Registrar nuevos ingresos con cantidad, descripción, categoría
- Ver lista de todos los ingresos
- Categorías predefinidas: Salario, Inversión, Venta, Otro
- Eliminar ingresos
- Filtrar por fecha automáticamente

### 🔴 Egresos
- Registrar nuevos egresos con cantidad, descripción, categoría
- Ver lista de todos los egresos
- Categorías predefinidas: Comida, Transporte, Utilidades, Entretenimiento, Otro
- Eliminar egresos
- Filtrar por fecha automáticamente

### 💰 Resumen
- Total de ingresos
- Total de egresos
- **Saldo final** (Ingresos - Egresos)
- Se actualiza automáticamente

---

## 🔧 Requisitos Previos

1. **Node.js** 18+ instalado
2. **MySQL** corriendo localmente
3. Usuario MySQL: `root`
4. Contraseña: `Almi`
5. Puerto MySQL: `3306` (default)

---

## ⚙️ Configuración Inicial

### 1️⃣ Variables de Entorno
El archivo `.env.local` ya está configurado con:
```
DATABASE_URL="mysql://root:Almi@localhost:3306/sistema_cuentas"
```

### 2️⃣ Instalar Dependencias
```bash
npm install
```

### 3️⃣ Crear Base de Datos
```bash
npm run prisma:migrate
```
Esto va a:
- Crear la BD `sistema_cuentas` automáticamente
- Crear las tablas `Ingreso` y `Egreso`
- Aplicar índices en fechas para mejor rendimiento

### 4️⃣ Iniciar el Servidor
```bash
npm run dev
```

---

## 🎨 Interfaz de Usuario

### Página Principal
- **Tab "Inicio"**: Vista general con formularios y resumen
- **Tab "Ingresos"**: Gestión completa de ingresos
- **Tab "Egresos"**: Gestión completa de egresos

### Colores
- 🟢 Verde: Ingresos
- 🔴 Rojo: Egresos
- 🔵 Azul: Saldo (puede ser positivo o negativo)

---

## 📡 API Routes

Ver [API.md](./API.md) para documentación completa de endpoints.

**Endpoints principales:**
- `GET /api/ingresos` - Obtener todos los ingresos
- `POST /api/ingresos` - Crear nuevo ingreso
- `DELETE /api/ingresos/[id]` - Eliminar ingreso
- `GET /api/egresos` - Obtener todos los egresos
- `POST /api/egresos` - Crear nuevo egreso
- `DELETE /api/egresos/[id]` - Eliminar egreso

---

## 🗄️ Base de Datos

### Tabla `Ingreso`
```
Campos:
- id (INT, PK, Autoincrement)
- cantidad (DECIMAL)
- descripcion (TEXT)
- categoria (VARCHAR, default: "General")
- fecha (DATETIME, default: ahora)
- notas (TEXT, opcional)
- createdAt (DATETIME, default: ahora)
- updatedAt (DATETIME, auto-actualiza)
```

### Tabla `Egreso`
```
Campos:
- id (INT, PK, Autoincrement)
- cantidad (DECIMAL)
- descripcion (TEXT)
- categoria (VARCHAR, default: "General")
- fecha (DATETIME, default: ahora)
- notas (TEXT, opcional)
- createdAt (DATETIME, default: ahora)
- updatedAt (DATETIME, auto-actualiza)
```

---

## 🌐 Tecnologías Usadas

| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| Next.js | 15+ | Framework fullstack React |
| React | 19+ | UI Frontend |
| Prisma | 6+ | ORM para BD |
| MySQL | - | Base de datos |
| Tailwind CSS | 3+ | Estilos CSS |
| Node.js | 18+ | Runtime JavaScript |

---

## 🐛 Soluciones Comunes

### "Error: Can't reach database server"
- Verificar que MySQL esté corriendo
- Verificar credenciales en `.env.local`
- Verificar puerto 3306 (default)

### "Error: Prisma migrations not run"
```bash
npm run prisma:migrate
```

### "Error: Port 3000 already in use"
```bash
npm run dev -- -p 3001
```

### Ver logs detallados de BD
```bash
npm run prisma:studio
```

---

## 📞 Próximos Pasos Sugeridos

1. ✅ Seguir guía en [SETUP.md](./SETUP.md)
2. ✅ Revisar endpoints en [API.md](./API.md)
3. ✅ Aprender Prisma en [PRISMA.md](./PRISMA.md)
4. 💡 Agregar autenticación de usuarios
5. 💡 Exportar reportes a PDF
6. 💡 Gráficos de ingresos/egresos por mes

---

## ✅ Estado del Proyecto

- ✅ Estructura completa creada
- ✅ Base de datos configurada
- ✅ API routes funcionales
- ✅ Componentes React listos
- ✅ Estilos Tailwind CSS
- ✅ Prisma Studio habilitado
- ⏰ Listo para usar

---

**Creado:** 15 de abril de 2026  
**Versión:** 1.0.0
