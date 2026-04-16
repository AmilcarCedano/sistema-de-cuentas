# 🛠️ SERVER - Backend + Prisma ORM

## 📌 Descripción

Backend que gestiona la **base de datos MySQL** mediante **Prisma ORM**:
- ✅ Esquema de datos (Ingreso, Egreso)
- ✅ Migraciones automáticas
- ✅ Prisma Studio (interfaz gráfica)
- ✅ Conexión directa a MySQL local

## 🗄️ Base de Datos

**Conexión:**
```env
DATABASE_URL="mysql://root:Almi@localhost:3306/sistema_cuentas"
```

- **Host:** localhost
- **Puerto:** 3306
- **Usuario:** root
- **Contraseña:** Almi
- **Base de datos:** sistema_cuentas

## 🚀 Cómo Usar

### Instalación (Primera vez)
```bash
cd server
npm install
```

### Crear/Actualizar Tablas en BD

**Opción 1: db push (Recomendado - más rápido)**
```bash
npm run prisma:push
```
Sincroniza el esquema directamente con BD sin migrations.

**Opción 2: migrate (Con historial)**
```bash
npm run prisma:migrate
```
Crea migrations registradas en historial.

### Abrir Prisma Studio (Interfaz Visual)
```bash
npm run prisma:studio
```
Abre http://localhost:5555 para ver/editar datos en BD visualmente.

## 📁 Estructura

```
server/
├── prisma/
│   └── schema.prisma           # 📋 Esquema de datos
│       └── Ingreso             # Modelo de ingresos
│       └── Egreso              # Modelo de egresos
├── .env                        # 🔐 Variables de BD
├── .env.local                  # 🔐 Overrides locales
├── package.json                # Scripts Prisma
└── INSTRUCCIONES.md            # Este archivo
```

## 📊 Modelos de Datos

### Ingreso
```prisma
model Ingreso {
  id           Int      @id @default(autoincrement())
  cantidad     Float
  descripcion  String
  categoria    String
  notas        String?
  fecha        DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("reloj_ingresos")
}
```

**Campos:**
- `id`: Identificador único (auto-incremento)
- `cantidad`: Monto del ingreso
- `descripcion`: Breve descripción
- `categoria`: Tipo (Salario, Venta, Inversión, etc.)
- `notas`: Detalles adicionales (opcional)
- `fecha`: Cuándo ocurrió el ingreso
- `createdAt`: Cuándo se registró (auto)
- `updatedAt`: Última actualización (auto)

### Egreso
```prisma
model Egreso {
  id           Int      @id @default(autoincrement())
  cantidad     Float
  descripcion  String
  categoria    String
  notas        String?
  fecha        DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("reloj_egresos")
}
```

Estructura idéntica a Ingreso.

## 🔧 Configuración (.env)

**Archivo:** `.env` (se crea automáticamente)

```env
# Conexión MySQL
DATABASE_URL="mysql://root:Almi@localhost:3306/sistema_cuentas"
```

**Cambiar credenciales:**

Si tu MySQL tiene:
- Usuario distinto: `usuario_custom`
- Contraseña distinta: `mi_contraseña`
- Puerto distinto: `3307`
- BD distinta: `otra_bd`

Actualiza:
```env
DATABASE_URL="mysql://usuario_custom:mi_contraseña@localhost:3307/otra_bd"
```

## 📝 Migraciones

### Primer Setup (Crear tablas)
```bash
npm run prisma:push
```

### Después de editar schema.prisma
Si modificas `prisma/schema.prisma`:

```bash
npm run prisma:migrate
```

Esto te pedirá:
1. Nombre de la migración (ej: "add-categoria-field")
2. La migración se guarda en `prisma/migrations/`

### Ver historial de migraciones
```bash
ls prisma/migrations/
```

## 🎯 Flujo: Cómo Los Datos Llegan a MySQL

```
1. Frontend (web/) hace POST /api/ingresos
   ↓
2. API Route (web/app/api/ingresos/route.js) recibe datos
   ↓
3. Importa Prisma Client: import { prisma } from '@/lib/db'
   ↓
4. Ejecuta: await prisma.ingreso.create({ data: {...} })
   ↓
5. Prisma transforma a SQL MySQL
   ↓
6. MySQL ejecuta: INSERT INTO reloj_ingresos (...)
   ↓
7. BD responde con ID del nuevo registro
   ↓
8. API retorna JSON: { id, cantidad, descripcion, ... }
   ↓
9. Frontend actualiza lista visualmente
```

## 🔍 Verificar Conexión BD

### Comando 1: Ver que Prisma detecta schema
```bash
npx prisma validate
```

### Comando 2: Ver que conecta a BD
```bash
npx prisma db execute --stdin
# Escribe: SELECT 1;
# Presiona Ctrl+D o Ctrl+Z (Windows)
```

### Comando 3: Abrir Studio y ver datos
```bash
npm run prisma:studio
```

## ⚠️ Problemas Comunes

**Error: "Could not connect to database"**
- ✅ ¿MySQL está corriendo? (`net start MySQL80` en Windows)
- ✅ ¿Credenciales correctas en `.env`?
- ✅ ¿Puerto correcto (3306)?

**Error: "A migration failed"**
- Intenta: `npm run prisma:push` en lugar de `npm run prisma:migrate`

**Error: "schema.prisma syntax error"**
- Revisa la sintaxis en `prisma/schema.prisma`
- Usa `npx prisma validate`

**Prisma Studio no abre**
- Espera 3-5 segundos después de ejecutar
- Abre manualmente: http://localhost:5555

## 🔗 Relaciones con Frontend

**web/lib/db.js** importa PrismaClient y se conecta aquí automáticamente.

Cuando ejecutas `npm run dev` en `web/`:
1. Carga `web/lib/db.js`
2. Este crea instancia de PrismaClient
3. Lee `DATABASE_URL` (que apunta a server/)
4. Se conecta a MySQL

## 📚 Documentación Relacionada

- [ROOT README](../README-ESTRUCTURA.md) - Estructura general
- [../docs/SETUP.md](../docs/SETUP.md) - Instalación detallada
- [../docs/PRISMA.md](../docs/PRISMA.md) - Guía Prisma completa
- [Documentación Prisma Oficial](https://www.prisma.io/docs/)

## 🎓 Próximos Pasos

1. **Crear BD:** `npm run prisma:push`
2. **Verificar:** `npm run prisma:studio`
3. **Volver a web/:** `npm run dev` (desde web/)
4. **Crear primer ingreso:** En http://localhost:3000

---

**Resumen Rápido:**
```bash
npm install                # 1. Instalar dependencias
npm run prisma:push        # 2. Crear tablas en BD
npm run prisma:studio      # 3. Ver BD visualmente (opcional)
# Luego desde web/:
npm run dev                # 4. Iniciar desarrollo
```
