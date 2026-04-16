import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ────────────────────────────── CUENTAS ──────────────────────────────

app.get('/api/cuentas', async (req, res) => {
  try {
    const cuentas = await prisma.cuenta.findMany({
      include: { 
        transacciones: {
          include: { grupo: true },
          orderBy: [{ orden: 'asc' }, { fecha: 'desc' }]
        },
        grupos: { orderBy: { orden: 'asc' } },
        saldosManuales: true
      },
      orderBy: { orden: 'asc' }
    });
    res.json(cuentas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cuentas' });
  }
});

app.post('/api/cuentas', async (req, res) => {
  const { nombre, color, orden } = req.body;
  const last = await prisma.cuenta.findFirst({ orderBy: { orden: 'desc' } });
  const cuenta = await prisma.cuenta.create({
    data: { nombre, color: color || '#3b82f6', orden: orden ?? (last ? last.orden + 1 : 0) }
  });
  res.json(cuenta);
});

app.put('/api/cuentas/:id', async (req, res) => {
  const { nombre, color, orden, incluirEnKpis, estado } = req.body;
  const cuenta = await prisma.cuenta.update({
    where: { id: parseInt(req.params.id) },
    data: { nombre, color, orden, incluirEnKpis, estado }
  });
  res.json(cuenta);
});

app.delete('/api/cuentas/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.transaccion.deleteMany({ where: { cuentaId: id } });
  await prisma.grupo.deleteMany({ where: { cuentaId: id } });
  await prisma.saldoManual.deleteMany({ where: { cuentaId: id } });
  await prisma.cuenta.delete({ where: { id } });
  res.json({ success: true });
});

// ────────────────────────────── SALDOS MANUALES (ARQUEO) ──────────────────────────────

app.post('/api/cuentas/:id/saldos', async (req, res) => {
  const { nombre, monto } = req.body;
  const saldo = await prisma.saldoManual.create({
    data: { nombre, monto: parseFloat(monto), cuentaId: parseInt(req.params.id) }
  });
  res.json(saldo);
});

app.delete('/api/saldos/:id', async (req, res) => {
  await prisma.saldoManual.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

// ────────────────────────────── GRUPOS ──────────────────────────────

app.post('/api/cuentas/:id/grupos', async (req, res) => {
  const { nombre, color } = req.body;
  const grupo = await prisma.grupo.create({
    data: { nombre, color: color || '#3b82f6', cuentaId: parseInt(req.params.id) }
  });
  res.json(grupo);
});

app.delete('/api/grupos/:id', async (req, res) => {
  await prisma.grupo.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

// ────────────────────────────── TRANSACCIONES ──────────────────────────────

app.post('/api/cuentas/:id/transacciones', async (req, res) => {
  const { titulo, monto, tipo, comentario, grupoId, fecha, orden } = req.body;
  const transaccion = await prisma.transaccion.create({
    data: {
      titulo,
      monto: parseFloat(monto),
      tipo,
      comentario,
      cuentaId: parseInt(req.params.id),
      grupoId: grupoId ? parseInt(grupoId) : null,
      fecha: fecha ? new Date(fecha) : new Date(),
      orden: orden || 0
    }
  });
  res.json(transaccion);
});

app.put('/api/transacciones/:id', async (req, res) => {
    const { titulo, monto, tipo, comentario, grupoId, fecha, orden } = req.body;
    const transaccion = await prisma.transaccion.update({
      where: { id: parseInt(req.params.id) },
      data: {
        titulo,
        monto: monto ? parseFloat(monto) : undefined,
        tipo,
        comentario,
        grupoId: grupoId !== undefined ? (grupoId ? parseInt(grupoId) : null) : undefined,
        fecha: fecha ? new Date(fecha) : undefined,
        orden: orden !== undefined ? orden : undefined
      }
    });
    res.json(transaccion);
});

app.delete('/api/transacciones/:id', async (req, res) => {
  await prisma.transaccion.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

// Reorder transactions (batch update orden)
app.put('/api/cuentas/:id/transacciones/reorder', async (req, res) => {
  const { ordenes } = req.body; // Array of { id, orden }
  try {
    for (const item of ordenes) {
      await prisma.transaccion.update({
        where: { id: item.id },
        data: { orden: item.orden }
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error reordenando transacciones' });
  }
});

// Toggle transaction activo status
app.patch('/api/transacciones/:id/activo', async (req, res) => {
  const { activo } = req.body;
  const transaccion = await prisma.transaccion.update({
    where: { id: parseInt(req.params.id) },
    data: { activo: activo !== undefined ? activo : true }
  });
  res.json(transaccion);
});

// ────────────────────────────── NOTAS ──────────────────────────────

app.get('/api/notas', async (req, res) => {
  const notas = await prisma.nota.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(notas);
});

app.post('/api/notas', async (req, res) => {
  const { contenido, color } = req.body;
  const nota = await prisma.nota.create({ data: { contenido, color } });
  res.json(nota);
});

app.put('/api/notas/:id', async (req, res) => {
  const { contenido, color } = req.body;
  const nota = await prisma.nota.update({
    where: { id: parseInt(req.params.id) },
    data: { contenido, color }
  });
  res.json(nota);
});

app.delete('/api/notas/:id', async (req, res) => {
  await prisma.nota.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor en Puerto ${PORT}`);
});
