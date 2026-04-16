# 🔧 Guía de Configuración - Sistema de Cuentas

## ✅ Prerequisitos

Antes de empezar, asegúrate de tener:

1. **Node.js 18+** → [Descargar](https://nodejs.org)
   ```bash
   node --version  # Verificar versión
   ```

2. **MySQL 8.0+** corriendo localmente
   - Usuario: `root`
   - Contraseña: `Almi`
   - Puerto: `3306`

3. **Editor de código** (VS Code recomendado)

4. **Terminal/PowerShell** funcionando

---

## 📝  Step 1: Confirmar que npm install terminó

El proyecto ya tiene `npm install` en progreso. Esperar a que termine:
```bash
cd C:\Users\ANDERSON\IdeaProjects\SISTEMA_CUENTAS
```

Si ves el prompt `PS >` significa que **NO está corriendo**. Ejecutar:
```bash
npm install
```

Esto instalará:
- ✅ next
- ✅ react
- ✅ @prisma/client
- ✅ prisma
- ✅ mysql2
- ✅ tailwindcss

**Tiempo estimado:** 2-5 minutos

---

## 🗄️ Step 2: Crear Base de Datos con Prisma

Una vez termine `npm install`, ejecutar:
```bash
npm run prisma:migrate
```

**¿Qué hace?**
1. Se conecta a MySQL con tu usuario/pass
2. Crea la BD `sistema_cuentas` (si no existe)
3. Crea las tablas `Ingreso` y `Egreso`
4. Aplica índices de optimización
5. Genera el cliente Prisma

**Salida esperada:**
```
✓ Generated Prisma Client
✓ Database seeded successfully
```

---

## 🚀 Step 3: Iniciar el Servidor

```bash
npm run dev
```

**¿Qué hace?**
- Inicia el servidor Next.js en modo desarrollo
- Hot reload activado (cambios reflejan automáticamente)
- Servidor escucha en `http://localhost:3000`

**Salida esperada:**
```
> next dev
  ▲ Next.js 15.1.3
  - Local:        http://localhost:3000
  ⚡ Ready in 2.5s
```

---

## 🌐 Step 4: Acceder a la Aplicación

Abre tu navegador y ve a:
```
http://localhost:3000
```

Deberías ver:
- ✅ Título "Sistema de Cuentas"
- ✅ Resumen con Ingresos (0), Egresos (0), Saldo (0)
- ✅ Tabs: Inicio, Ingresos, Egresos
- ✅ Formularios para registrar

---

## 🎮 Step 5: Probar Funcionalidades

### Registrar un Ingreso
1. Ve a tab **"Ingresos"**
2. Completa el formulario:
   - Cantidad: `1000`
   - Descripción: `Mi primer ingreso`
   - Categoría: `Salario`
   - Notas: (opcional)
3. Click en "Guardar Ingreso"
4. Ver que aparece en la tabla

### Registrar un Egreso
1. Ve a tab **"Egresos"**
2. Completa el formulario:
   - Cantidad: `200`
   - Descripción: `Comida`
   - Categoría: `Comida`
3. Click en "Guardar Egreso"
4. Ver que aparece en la tabla

### Verificar Resumen
1. El saldo debe actualizar: `1000 - 200 = 800`
2. Los totales mostrarse en las tarjetas superiores

---

## 🗄️  Step 6: Ver Base de Datos (Prisma Studio)

Abre otra terminal y ejecuta:
```bash
npm run prisma:studio
```

**¿Qué hace?**
- Abre Prisma Studio en `http://localhost:5555`
- Interfaz gráfica para ver/editar datos
- Sincronización en tiempo real

**En Prisma Studio puedes:**
- ✅ Ver todos los ingresos registrados
- ✅ Editar campos manualmente
- ✅ Eliminar registros
- ✅ Ver estructura de tablas
- ✅ Agregar registros directamente

---

## 🔄 Workflow Típico de Desarrollo

### Terminal 1: Servidor dev
```bash
npm run dev
# Escucha en http://localhost:3000
```

### Terminal 2: Prisma Studio (opcional)
```bash
npm run prisma:studio
# Escucha en http://localhost:5555
```

### Cambios en código
- Editar archivos en `app/`, `components/`, `lib/`
- Next.js recompila automáticamente
- Ver cambios en el navegador inmediatamente

### Cambios en BD
- Si modificas `prisma/schema.prisma`:
  ```bash
  npm run prisma:migrate
  ```

---

## 🛠️ Otros Comandos Útiles

### Compilar para producción
```bash
npm run build
npm start
```

### Linter (validar código)
```bash
npm run lint
```

### Reinstalar dependencias
```bash
rm -r node_modules package-lock.json
npm install
```

### Ver variables de entorno
```bash
cat .env.local
```

---

## 🐛 Troubleshooting

### ❌ Error: "Can't reach database server"

**Solución:**
1. Verificar que MySQL esté corriendo
   ```bash
   # En Windows, verificar Services o:
   mysql -u root -pAlmi -e "SELECT 1;"
   ```
2. Verificar credenciales en `.env.local`
3. Verificar puerto 3306

### ❌ Error: "EADDRINUSE: address already in use :::3000"

**Solución:**
1. Otra aplicación usa puerto 3000
2. Ejecutar en puerto diferente:
   ```bash
   npm run dev -- -p 3001
   ```

### ❌ Error en formularia: "Error creating ingreso"

**Solución:**
1. Verificar Prisma Studio está sincronizado
2. Revisar logs en terminal
3. Ejecutar migraciones:
   ```bash
   npm run prisma:migrate
   ```

### ❌ Cambios no se reflejan

**Solución:**
1. F5 en navegador (refresh completo)
2. Ctrl+Shift+Delete (limpiar caché)
3. Cerrar y reabrir terminal

---

## ✅ Checklist de Setup Exitoso

- [ ] Node.js instalado (`node --version`)
- [ ] MySQL corriendo localmente
- [ ] `npm install` completado exitosamente
- [ ] `npm run prisma:migrate` sin errores
- [ ] `npm run dev` escuchando en 3000
- [ ] Aplicación visible en http://localhost:3000
- [ ] Se puede registrar ingreso
- [ ] Se puede registrar egreso
- [ ] El resumen actualiza correctamente
- [ ] Prisma Studio muestra los datos

---

## 🎉 ¡Listo!

Tu **Sistema de Cuentas** está completamente funcional. Ahora puedes:

1. ✅ Registrar ingresos y egresos
2. ✅ Ver resumen en tiempo real
3. ✅ Editar datos en Prisma Studio
4. ✅ Desplegar cambios

Para próximos pasos, revisa:
- 📖 [API.md](./API.md) - Documentación de endpoints
- 📖 [PRISMA.md](./PRISMA.md) - Guía de Prisma ORM
- 📖 [README.md](./README.md) - Visión general del proyecto

---

**Última actualización:** 15 de abril de 2026
