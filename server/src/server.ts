import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

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
        saldosManuales: true,
        pagosMensuales: { orderBy: { diaPago: 'asc' } }
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

// Lock/Unlock account
app.patch('/api/cuentas/:id/lock', async (req, res) => {
  const { locked } = req.body;
  const cuenta = await prisma.cuenta.update({
    where: { id: parseInt(req.params.id) },
    data: {
      estado: locked ? 'cerrada' : 'activa',
      fechaCierre: locked ? new Date() : null
    }
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

// ────────────────────────────── PAGOS MENSUALES ──────────────────────────────

app.get('/api/pagos-mensuales', async (req, res) => {
  const pagos = await prisma.pagoMensual.findMany({
    include: { cuenta: true },
    orderBy: { diaPago: 'asc' }
  });
  res.json(pagos);
});

app.post('/api/cuentas/:id/pagos-mensuales', async (req, res) => {
  const { nombre, monto, diaPago, comentario, grupoId } = req.body;
  const pago = await prisma.pagoMensual.create({
    data: {
      nombre,
      monto: parseFloat(monto),
      diaPago: parseInt(diaPago),
      comentario: comentario || null,
      grupoId: grupoId ? parseInt(grupoId) : null,
      cuentaId: parseInt(req.params.id)
    }
  });
  res.json(pago);
});

app.put('/api/pagos-mensuales/:id', async (req, res) => {
  const { nombre, monto, diaPago, comentario, grupoId, activo, cuentaId } = req.body;
  const pago = await prisma.pagoMensual.update({
    where: { id: parseInt(req.params.id) },
    data: {
      nombre, 
      monto: monto !== undefined ? parseFloat(monto) : undefined,
      diaPago: diaPago !== undefined ? parseInt(diaPago) : undefined,
      comentario,
      grupoId: grupoId !== undefined ? (grupoId ? parseInt(grupoId) : null) : undefined,
      activo,
      cuentaId: cuentaId ? parseInt(cuentaId) : undefined
    }
  });
  res.json(pago);
});

app.delete('/api/pagos-mensuales/:id', async (req, res) => {
  await prisma.pagoMensual.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ success: true });
});

// Pagar un pago mensual → crea transacción egreso y actualiza ultimoPago
app.post('/api/pagos-mensuales/:id/pagar', async (req, res) => {
  try {
    const pago = await prisma.pagoMensual.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    
    const cuentaId = req.body.cuentaId ? parseInt(req.body.cuentaId) : pago.cuentaId;
    const mesObjetivo = req.body.mesObjetivo || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const [anio, mes] = mesObjetivo.split('-');
    const mesNombre = meses[parseInt(mes) - 1];
    
    // Create the transaction
    await prisma.transaccion.create({
      data: {
        titulo: `[Pago Mensual] ${pago.nombre} - ${mesNombre} ${anio}`,
        monto: pago.monto,
        tipo: 'egreso',
        comentario: pago.comentario || `Pago mensual - ${mesNombre} ${anio} (día ${pago.diaPago})`,
        cuentaId: cuentaId,
        grupoId: pago.grupoId,
        fecha: new Date()
      }
    });
    
    // Update last payment date and month
    const updated = await prisma.pagoMensual.update({
      where: { id: pago.id },
      data: { ultimoPago: new Date(), mesPagado: mesObjetivo }
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error procesando pago' });
  }
});

// ────────────────────────────── EXPORT EXCEL (Premium Report) ──────────────────────────────



function barraIndicador(pct: number, chars = 18): string {
  const llenos = Math.round((pct / 100) * chars);
  return '█'.repeat(llenos) + '░'.repeat(chars - llenos);
}

function bordeFino(color = 'BDC3C7'): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: color } };
  return { left: side, right: side, top: side, bottom: side };
}

function bordeMedio(color = '1B2631'): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: color } };
  return { left: side, right: side, top: side, bottom: side };
}

const COLOR_DEFAULT_OSCURO = '424949';
const COLOR_DEFAULT_CLARO = 'EAECEE';

app.get('/api/export/excel', async (req, res) => {
  try {
    const accountId = req.query.accountId as string | undefined;
    
    let cuentasData = await prisma.cuenta.findMany({
      include: {
        transacciones: { include: { grupo: true }, orderBy: { fecha: 'desc' } },
        grupos: true,
        saldosManuales: true
      }
    });
    
    if (accountId && accountId !== 'all') {
      cuentasData = cuentasData.filter(c => c.id === parseInt(accountId));
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'FinControl';

    for (const cuenta of cuentasData) {
      const sheetName = cuenta.nombre.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 31) || 'Cuenta';
      const ws = wb.addWorksheet(sheetName);
      
      const activeTxs = (cuenta.transacciones || []).filter((t: any) => t.activo !== false);
      const ingresos = activeTxs.filter((t: any) => t.tipo === 'ingreso');
      const egresos = activeTxs.filter((t: any) => t.tipo === 'egreso');
      const totalIng = ingresos.reduce((s: number, t: any) => s + t.monto, 0);
      const totalEgr = egresos.reduce((s: number, t: any) => s + t.monto, 0);
      const neto = totalIng - totalEgr;

      // Build category color map from grupo colors
      const buildColorMap = (txs: any[]) => {
        const map: Record<string, [string, string]> = {};
        txs.forEach((t: any) => {
          const cat = t.grupo?.nombre || 'Sin categoría';
          if (!map[cat] && t.grupo?.color) {
            const hex = t.grupo.color.replace('#', '');
            map[cat] = [hex, hex + '30'];
          }
        });
        return map;
      };
      const ingColorMap = buildColorMap(ingresos);
      const egrColorMap = buildColorMap(egresos);

      // Group by category
      const groupByCategory = (txs: any[]) => {
        const groups: Record<string, any[]> = {};
        txs.forEach((t: any) => {
          const cat = t.grupo?.nombre || 'Sin categoría';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(t);
        });
        return Object.entries(groups).sort((a, b) => {
          const sumA = a[1].reduce((s: number, t: any) => s + t.monto, 0);
          const sumB = b[1].reduce((s: number, t: any) => s + t.monto, 0);
          return sumB - sumA;
        });
      };
      const egrCats = groupByCategory(egresos);
      const ingCats = groupByCategory(ingresos);

      // Column widths
      ws.columns = [
        { width: 5 }, { width: 12 }, { width: 24 }, { width: 28 }, { width: 14 }, { width: 2 }, { width: 20 },
        { width: 3 },
        { width: 5 }, { width: 12 }, { width: 24 }, { width: 28 }, { width: 14 }, { width: 2 }, { width: 20 }
      ];

      let row = 1;

      // ── TITLE ──
      ws.mergeCells(`A${row}:O${row}`);
      const titleCell = ws.getCell(`A${row}`);
      titleCell.value = `REPORTE FINANCIERO – ${cuenta.nombre.toUpperCase()}`;
      titleCell.font = { name: 'Arial', bold: true, size: 14, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B2631' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(row).height = 32;
      row++;

      ws.mergeCells(`A${row}:O${row}`);
      const subCell = ws.getCell(`A${row}`);
      subCell.value = 'Ingresos y Egresos con detalle completo por categoría';
      subCell.font = { name: 'Arial', italic: true, size: 9, color: { argb: 'FFFFFF' } };
      subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E4057' } };
      subCell.alignment = { horizontal: 'center' };
      ws.getRow(row).height = 16;
      row++;
      ws.getRow(row).height = 8; row++;

      // ── SECTION HEADERS ──
      ws.mergeCells(`A${row}:G${row}`);
      const egrHeader = ws.getCell(`A${row}`);
      egrHeader.value = '  📤  EGRESOS – RESUMEN';
      egrHeader.font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FFFFFF' } };
      egrHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '922B21' } };
      egrHeader.alignment = { horizontal: 'left', vertical: 'middle' };

      ws.mergeCells(`I${row}:O${row}`);
      const ingHeader = ws.getCell(`I${row}`);
      ingHeader.value = '  📥  INGRESOS – RESUMEN';
      ingHeader.font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FFFFFF' } };
      ingHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1D8348' } };
      ingHeader.alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getRow(row).height = 24; row++;

      // ── SUMMARY HEADERS ──
      const summaryHeaders = ['Categoría', 'Total (S/)', 'N° Mov.', '% Total', 'Indicador'];
      const writeHeaders = (startCol: number) => {
        summaryHeaders.forEach((h, i) => {
          const c = ws.getCell(row, startCol + i);
          c.value = h;
          c.font = { name: 'Arial', bold: true, size: 9, color: { argb: 'FFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B2631' } };
          c.alignment = { horizontal: 'center', vertical: 'middle' };
          c.border = bordeFino('555555');
        });
      };
      writeHeaders(1); writeHeaders(9);
      ws.getRow(row).height = 20; row++;

      // ── SUMMARY ROWS ──
      const writeSummaryRows = (cats: [string, any[]][], total: number, startCol: number, colorMap: Record<string, [string, string]>) => {
        let r = row;
        cats.forEach(([cat, txs]) => {
          const catTotal = txs.reduce((s: number, t: any) => s + t.monto, 0);
          const pct = total > 0 ? (catTotal / total) * 100 : 0;
          const [oscuro, claro] = colorMap[cat] || [COLOR_DEFAULT_OSCURO, COLOR_DEFAULT_CLARO];
          const vals = [cat.trim(), catTotal, txs.length, pct / 100, barraIndicador(pct)];
          vals.forEach((v, i) => {
            const c = ws.getCell(r, startCol + i);
            c.value = v;
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: claro.length === 6 ? claro : COLOR_DEFAULT_CLARO } };
            c.border = bordeFino();
            c.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' };
            c.font = i === 4
              ? { name: 'Courier New', size: 7, color: { argb: oscuro } }
              : { name: 'Arial', size: 9, color: { argb: i === 0 ? oscuro : '1B2631' }, bold: i === 0 };
            if (i === 1) c.numFmt = '#,##0.00';
            if (i === 3) c.numFmt = '0.0%';
          });
          ws.getRow(r).height = 18;
          r++;
        });
        return r;
      };
      const egrEnd = writeSummaryRows(egrCats, totalEgr, 1, egrColorMap);
      const ingEnd = writeSummaryRows(ingCats, totalIng, 9, ingColorMap);
      const totalRow = Math.max(egrEnd, ingEnd);

      // ── TOTAL ROW ──
      const writeTotalRow = (r: number, startCol: number, total: number, count: number, bgColor: string) => {
        const vals = ['TOTAL GENERAL', total, count, 1.0, '█'.repeat(18)];
        vals.forEach((v, i) => {
          const c = ws.getCell(r, startCol + i);
          c.value = v;
          c.font = { name: 'Arial', bold: true, size: 9, color: { argb: 'FFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          c.border = bordeMedio(bgColor);
          c.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' };
          if (i === 1) c.numFmt = '#,##0.00';
          if (i === 3) c.numFmt = '0.0%';
          if (i === 4) c.font = { name: 'Courier New', size: 7, color: { argb: 'F39C12' } };
        });
        ws.getRow(r).height = 22;
      };
      row = totalRow;
      writeTotalRow(row, 1, totalEgr, egresos.length, '7B241C');
      writeTotalRow(row, 9, totalIng, ingresos.length, '1D8348');
      row += 2;

      // ── BALANCE ──
      ws.mergeCells(`A${row}:O${row}`);
      const balTitle = ws.getCell(`A${row}`);
      balTitle.value = '  💰  BALANCE FINAL DE LA CUENTA';
      balTitle.font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FFFFFF' } };
      balTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B2631' } };
      balTitle.alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getRow(row).height = 24; row++;

      ['Concepto', 'Monto (S/)'].forEach((h, i) => {
        const c = ws.getCell(row, 1 + i);
        c.value = h;
        c.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E4057' } };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        c.border = bordeFino();
      });
      ws.getRow(row).height = 20; row++;

      const balItems = [
        { label: '📥  Total Ingresos', val: totalIng, dark: '1D8348', light: 'D5F5E3' },
        { label: '📤  Total Egresos', val: totalEgr, dark: '7B241C', light: 'FADBD8' },
      ];
      balItems.forEach(item => {
        const c1 = ws.getCell(row, 1); c1.value = item.label;
        c1.font = { name: 'Arial', bold: true, size: 10, color: { argb: item.dark } };
        c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.light } };
        c1.alignment = { horizontal: 'left', vertical: 'middle' };
        c1.border = bordeFino();
        const c2 = ws.getCell(row, 2); c2.value = item.val;
        c2.font = { name: 'Arial', bold: true, size: 10, color: { argb: item.dark } };
        c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.light } };
        c2.numFmt = '#,##0.00'; c2.alignment = { horizontal: 'center', vertical: 'middle' };
        c2.border = bordeFino();
        ws.getRow(row).height = 20; row++;
      });

      const colorNeto = neto >= 0 ? '1D6A27' : '922B21';
      const cn1 = ws.getCell(row, 1); cn1.value = '✅  MONTO NETO (Ingresos − Egresos)';
      cn1.font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FFFFFF' } };
      cn1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorNeto } };
      cn1.alignment = { horizontal: 'left', vertical: 'middle' };
      cn1.border = bordeMedio(colorNeto);
      const cn2 = ws.getCell(row, 2); cn2.value = neto;
      cn2.font = { name: 'Arial', bold: true, size: 12, color: { argb: 'FFFFFF' } };
      cn2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorNeto } };
      cn2.numFmt = '#,##0.00'; cn2.alignment = { horizontal: 'center', vertical: 'middle' };
      cn2.border = bordeMedio(colorNeto);
      ws.getRow(row).height = 26; row += 2;

      // ── DETAIL SECTION ──
      ws.mergeCells(`A${row}:O${row}`);
      const detTitle = ws.getCell(`A${row}`);
      detTitle.value = '  📋  DETALLE COMPLETO POR CATEGORÍA';
      detTitle.font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FFFFFF' } };
      detTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E4057' } };
      detTitle.alignment = { horizontal: 'left', vertical: 'middle' };
      ws.getRow(row).height = 24; row++;

      ws.mergeCells(`A${row}:G${row}`);
      const egrLabel = ws.getCell(`A${row}`);
      egrLabel.value = '  📤  EGRESOS'; egrLabel.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FFFFFF' } };
      egrLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '7B241C' } };
      ws.mergeCells(`I${row}:O${row}`);
      const ingLabel = ws.getCell(`I${row}`);
      ingLabel.value = '  📥  INGRESOS'; ingLabel.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FFFFFF' } };
      ingLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1D8348' } };
      ws.getRow(row).height = 20; row++;

      // Write detail blocks
      const writeDetailBlock = (cats: [string, any[]][], total: number, startCol: number, colorMap: Record<string, [string, string]>, startRow: number) => {
        let r = startRow;
        for (const [cat, txs] of cats) {
          const [oscuro] = colorMap[cat] || [COLOR_DEFAULT_OSCURO, COLOR_DEFAULT_CLARO];
          const catTotal = txs.reduce((s: number, t: any) => s + t.monto, 0);
          const pct = total > 0 ? (catTotal / total) * 100 : 0;

          // Category header
          for (let i = 0; i < 7; i++) {
            const c = ws.getCell(r, startCol + i);
            if (i === 0) c.value = `  ${cat.trim().toUpperCase()}   |   S/ ${catTotal.toFixed(2)}   |   ${txs.length} mov.   |   ${pct.toFixed(1)}%`;
            c.font = { name: 'Arial', bold: true, size: 9, color: { argb: 'FFFFFF' } };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: oscuro } };
            c.alignment = { horizontal: 'left', vertical: 'middle' };
          }
          ws.mergeCells(r, startCol, r, startCol + 6);
          ws.getRow(r).height = 20; r++;

          // Column headers
          ['#', 'Fecha', 'Concepto', 'Nota', 'Monto (S/)'].forEach((h, i) => {
            const c = ws.getCell(r, startCol + i);
            c.value = h;
            c.font = { name: 'Arial', bold: true, size: 8, color: { argb: 'FFFFFF' } };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: oscuro } };
            c.alignment = { horizontal: 'center', vertical: 'middle' };
            c.border = bordeFino(oscuro);
          });
          ws.getRow(r).height = 16; r++;

          // Transaction rows
          const sorted = [...txs].sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
          sorted.forEach((t: any, idx: number) => {
            const bgColor = idx % 2 === 0 ? 'FFFFFF' : COLOR_DEFAULT_CLARO;
            const fecha = new Date(t.fecha);
            const fechaStr = `${String(fecha.getDate()).padStart(2,'0')}/${String(fecha.getMonth()+1).padStart(2,'0')}/${fecha.getFullYear()}`;
            const vals = [idx + 1, fechaStr, t.titulo, t.comentario || '', t.monto];
            vals.forEach((v, i) => {
              const c = ws.getCell(r, startCol + i);
              c.value = v;
              c.font = { name: 'Arial', size: 8 };
              c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
              c.alignment = { horizontal: [0,1,4].includes(i) ? 'center' : 'left', vertical: 'middle' };
              c.border = bordeFino();
              if (i === 4) c.numFmt = '#,##0.00';
            });
            ws.getRow(r).height = 16; r++;
          });

          // Subtotal
          for (let i = 0; i < 5; i++) {
            const c = ws.getCell(r, startCol + i);
            if (i < 4) { if (i === 0) c.value = 'SUBTOTAL'; }
            else { c.value = catTotal; c.numFmt = '#,##0.00'; }
            c.font = { name: 'Arial', bold: true, size: 8, color: { argb: 'FFFFFF' } };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: oscuro } };
            c.alignment = { horizontal: i < 4 ? 'right' : 'center' };
            c.border = bordeMedio(oscuro);
          }
          ws.mergeCells(r, startCol, r, startCol + 3);
          ws.getRow(r).height = 18; r++;
          ws.getRow(r).height = 6; r++;
        }
        return r;
      };

      const egrDetailEnd = writeDetailBlock(egrCats, totalEgr, 1, egrColorMap, row);
      const ingDetailEnd = writeDetailBlock(ingCats, totalIng, 9, ingColorMap, row);

      // ── PAGOS MENSUALES SECTION ──
      const pagos = (cuenta as any).pagosMensuales || [];
      if (pagos.length > 0) {
        let pmRow = Math.max(egrDetailEnd, ingDetailEnd) + 2;

        ws.mergeCells(`A${pmRow}:O${pmRow}`);
        const pmTitle = ws.getCell(`A${pmRow}`);
        pmTitle.value = '  🔄  PAGOS MENSUALES PROGRAMADOS';
        pmTitle.font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FFFFFF' } };
        pmTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '7D3C98' } };
        pmTitle.alignment = { horizontal: 'left', vertical: 'middle' };
        ws.getRow(pmRow).height = 24; pmRow++;

        const pmHeaders = ['Pago', 'Monto (S/)', 'Categoría', 'Día del Mes', 'Último Pago', 'Estado'];
        pmHeaders.forEach((h, i) => {
          const c = ws.getCell(pmRow, 1 + i);
          c.value = h;
          c.font = { name: 'Arial', bold: true, size: 9, color: { argb: 'FFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '5B2C6F' } };
          c.alignment = { horizontal: 'center', vertical: 'middle' };
          c.border = bordeFino('5B2C6F');
        });
        ws.getRow(pmRow).height = 20; pmRow++;

        let totalPagos = 0;
        const grupos = (cuenta as any).grupos || [];
        pagos.forEach((p: any, idx: number) => {
          totalPagos += p.monto;
          const bgColor = idx % 2 === 0 ? 'F5EEF8' : 'FFFFFF';
          const ultimoPago = p.ultimoPago ? new Date(p.ultimoPago).toLocaleDateString() : 'Nunca';
          const catName = p.grupoId ? (grupos.find((g: any) => g.id === p.grupoId)?.nombre || 'Sin categoría') : 'Sin categoría';
          const vals = [p.nombre, p.monto, catName, `Día ${p.diaPago}`, ultimoPago, p.activo ? 'Activo' : 'Inactivo'];
          vals.forEach((v, i) => {
            const c = ws.getCell(pmRow, 1 + i);
            c.value = v;
            c.font = { name: 'Arial', size: 9, color: { argb: i === 5 ? (p.activo ? '1D8348' : '922B21') : '1B2631' }, bold: i === 0 };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            c.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' };
            c.border = bordeFino();
            if (i === 1) c.numFmt = '#,##0.00';
          });
          ws.getRow(pmRow).height = 18; pmRow++;
        });

        // Total row
        ['TOTAL MENSUAL', totalPagos, '', '', '', `${pagos.filter((p: any) => p.activo).length} activos`].forEach((v, i) => {
          const c = ws.getCell(pmRow, 1 + i);
          c.value = v;
          c.font = { name: 'Arial', bold: true, size: 9, color: { argb: 'FFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '7D3C98' } };
          c.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' };
          c.border = bordeMedio('7D3C98');
          if (i === 1) c.numFmt = '#,##0.00';
        });
        ws.getRow(pmRow).height = 22;
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Reporte_FinControl.xlsx');
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ error: 'Error generando Excel' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor en Puerto ${PORT}`);
});
