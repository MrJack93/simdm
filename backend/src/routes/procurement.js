const express = require('express');
const PDFDocument = require('pdfkit');
const path = require('path');
const { z } = require('zod');
const prisma = require('../db');

const router = express.Router();
const idSchema = z.coerce.number().int().positive();

const createPlanSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2099),
  type: z.enum(['DM', 'CONSUMABIL']),
  sectionId: z.coerce.number().int().positive().optional(),
  elaboratedBy: z.string().max(255).optional(),
});

const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  specification: z.string().max(1000).optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  unit: z.string().max(50).optional(),
  funding: z.string().max(100).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
});

const updateItemSchema = createItemSchema.partial();

const statusTransitionSchema = z.object({
  newStatus: z.enum(['COORDONAT', 'APROBAT']),
  coordSection: z.string().max(255).optional(),
  coordSibm: z.string().max(255).optional(),
});

const STATUS_FLOW = { DRAFT: ['COORDONAT'], COORDONAT: ['APROBAT'] };

async function recalcTotal(tx, planId) {
  const result = await tx.procurement_items.aggregate({ where: { planId }, _sum: { totalPrice: true } });
  await tx.procurement_plans.update({ where: { id: planId }, data: { totalAmount: result._sum.totalPrice || 0 } });
}

// GET /api/procurement/plans
router.get('/plans', async (req, res) => {
  try {
    const rawPage = Math.max(parseInt(req.query.page) || 1, 1);
    const rawLimit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (rawPage - 1) * rawLimit;
    const { year, type, status } = req.query;
    const where = {};
    if (year) where.year = parseInt(year);
    if (type) where.type = type;
    if (status) where.status = status;

    const [plans, total] = await Promise.all([
      prisma.procurement_plans.findMany({
        where,
        include: { section: { select: { id: true, name: true } }, items: true },
        skip, take: rawLimit, orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.procurement_plans.count({ where }),
    ]);
    res.json({ data: plans, pagination: { page: rawPage, limit: rawLimit, total, pages: Math.ceil(total / rawLimit) } });
  } catch (error) {
    console.error('Error fetching procurement plans:', error);
    res.status(500).json({ error: 'Eroare la preluarea planurilor' });
  }
});

// GET /api/procurement/plans/:id
router.get('/plans/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });
    const plan = await prisma.procurement_plans.findUnique({
      where: { id: idParse.data },
      include: { section: { select: { id: true, name: true } }, items: true, createdBy: { select: { id: true, fullName: true } } },
    });
    if (!plan) return res.status(404).json({ error: 'Plan negăsit' });
    res.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Eroare la preluarea planului' });
  }
});

// POST /api/procurement/plans
router.post('/plans', async (req, res) => {
  try {
    const parsed = createPlanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Date invalide', fields: parsed.error.flatten().fieldErrors });
    const plan = await prisma.$transaction(async (tx) => {
      const created = await tx.procurement_plans.create({
        data: { ...parsed.data, createdById: req.user.sub, updatedAt: new Date() },
        include: { section: { select: { id: true, name: true } }, items: true },
      });
      await tx.audit_logs.create({ data: { userId: req.user.sub, action: 'CREATE', entity: 'ProcurementPlan', entityId: String(created.id), changes: { year: created.year, type: created.type } } });
      return created;
    });
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Eroare la crearea planului' });
  }
});

// POST /api/procurement/plans/:id/items
router.post('/plans/:id/items', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });
    const plan = await prisma.procurement_plans.findUnique({ where: { id: idParse.data } });
    if (!plan) return res.status(404).json({ error: 'Plan negăsit' });
    if (plan.status !== 'DRAFT') return res.status(400).json({ error: 'Se pot adăuga rânduri doar în starea DRAFT' });

    const parsed = createItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Date invalide', fields: parsed.error.flatten().fieldErrors });

    const itemData = parsed.data;
    const totalPrice = (itemData.quantity || 1) * (itemData.unitPrice || 0);

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.procurement_items.create({ data: { ...itemData, planId: plan.id, totalPrice } });
      await recalcTotal(tx, plan.id);
      await tx.audit_logs.create({ data: { userId: req.user.sub, action: 'CREATE', entity: 'ProcurementItem', entityId: String(created.id), changes: { name: itemData.name, totalPrice } } });
      return created;
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Eroare la adăugarea rândului' });
  }
});

// PUT /api/procurement/items/:id
router.put('/items/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });
    const existing = await prisma.procurement_items.findUnique({ where: { id: idParse.data } });
    if (!existing) return res.status(404).json({ error: 'Rând negăsit' });

    const parsed = updateItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Date invalide', fields: parsed.error.flatten().fieldErrors });

    const data = parsed.data;
    const qty = data.quantity ?? existing.quantity;
    const price = data.unitPrice !== undefined ? data.unitPrice : (existing.unitPrice || 0);
    const totalPrice = qty * price;

    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.procurement_items.update({ where: { id: idParse.data }, data: { ...data, totalPrice } });
      await recalcTotal(tx, existing.planId);
      await tx.audit_logs.create({ data: { userId: req.user.sub, action: 'UPDATE', entity: 'ProcurementItem', entityId: String(updated.id), changes: { totalPrice } } });
      return updated;
    });
    res.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Eroare la actualizare' });
  }
});

// DELETE /api/procurement/items/:id
router.delete('/items/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });
    const existing = await prisma.procurement_items.findUnique({ where: { id: idParse.data } });
    if (!existing) return res.status(404).json({ error: 'Rând negăsit' });

    await prisma.$transaction(async (tx) => {
      await tx.procurement_items.delete({ where: { id: idParse.data } });
      await recalcTotal(tx, existing.planId);
      await tx.audit_logs.create({ data: { userId: req.user.sub, action: 'DELETE', entity: 'ProcurementItem', entityId: String(idParse.data) } });
    });
    res.json({ message: 'Rând șters' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Eroare la ștergere' });
  }
});

// PATCH /api/procurement/plans/:id/status
router.patch('/plans/:id/status', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });
    const plan = await prisma.procurement_plans.findUnique({ where: { id: idParse.data } });
    if (!plan) return res.status(404).json({ error: 'Plan negăsit' });

    const parsed = statusTransitionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Date invalide', fields: parsed.error.flatten().fieldErrors });

    const allowed = STATUS_FLOW[plan.status];
    if (!allowed || !allowed.includes(parsed.data.newStatus)) {
      return res.status(400).json({ error: `Tranziție invalidă: ${plan.status} → ${parsed.data.newStatus}` });
    }

    const updateData = { status: parsed.data.newStatus, updatedAt: new Date() };
    if (parsed.data.newStatus === 'COORDONAT') {
      updateData.coordSection = parsed.data.coordSection || null;
    }
    if (parsed.data.newStatus === 'APROBAT') {
      updateData.approvedAt = new Date();
      updateData.coordSibm = parsed.data.coordSibm || null;
      updateData.coordSection = parsed.data.coordSection || plan.coordSection;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.procurement_plans.update({ where: { id: idParse.data }, data: updateData });
      await tx.audit_logs.create({ data: { userId: req.user.sub, action: 'UPDATE', entity: 'ProcurementPlan', entityId: String(plan.id), changes: { from: plan.status, to: parsed.data.newStatus } } });
      return result;
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating plan status:', error);
    res.status(500).json({ error: 'Eroare la actualizarea statusului' });
  }
});

// GET /api/procurement/plans/:id/pdf — Formular Nr. 1 sau Nr. 2
router.get('/plans/:id/pdf', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });
    const plan = await prisma.procurement_plans.findUnique({
      where: { id: idParse.data },
      include: { items: true, section: { select: { name: true } } },
    });
    if (!plan) return res.status(404).json({ error: 'Plan negăsit' });

    const isDM = plan.type === 'DM';
    const title = isDM
      ? `Plan de procurare a dispozitivelor medicale pentru anul ${plan.year}`
      : `Plan de procurare a consumabilelor și pieselor de schimb pentru anul ${plan.year}`;
    const subtitle = isDM ? 'Anexa 6 — Formular Nr. 1' : 'Anexa 7 — Formular Nr. 2';
    const filename = isDM ? `Formular_1_Plan_${plan.year}.pdf` : `Formular_2_Plan_${plan.year}.pdf`;

    const doc = new PDFDocument({ margin: 40, layout: 'landscape' });
    doc.registerFont('Times-Roman-Custom', path.join(__dirname, '../assets/fonts/times.ttf'));
    doc.registerFont('Times-Bold-Custom', path.join(__dirname, '../assets/fonts/timesbd.ttf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.fontSize(12).font('Times-Bold-Custom').text(title, { align: 'center' });
    doc.fontSize(8).font('Times-Roman-Custom').text(subtitle, { align: 'center' });
    if (plan.section) doc.text(`Secția: ${plan.section.name}`, { align: 'center' });
    doc.moveDown();

    const headers = isDM
      ? ['Nr.', 'Denumire DM', 'Specificație / Cod', 'Cant.', 'Finanțare', 'Preț/uc. MDL', 'Sumă MDL']
      : ['Nr.', 'Denumire', 'Caracteristici', 'Cant.', 'Unitate', 'Preț/uc. MDL', 'Sumă MDL'];
    const colWidths = [30, 130, 130, 40, 60, 80, 80];

    let y = doc.y;
    doc.fontSize(7).font('Times-Bold-Custom');
    let x = 40;
    headers.forEach((h, i) => { doc.text(h, x, y, { width: colWidths[i], align: 'center' }); x += colWidths[i]; });

    doc.fontSize(7).font('Times-Roman-Custom');
    let totalSum = 0;
    plan.items.forEach((item, idx) => {
      y += 16;
      x = 40;
      const row = [
        String(idx + 1),
        item.name,
        (item.specification || '').substring(0, 40),
        String(item.quantity),
        item.funding || '—',
        item.unitPrice ? Number(item.unitPrice).toFixed(2) : '—',
        item.totalPrice ? Number(item.totalPrice).toFixed(2) : '—',
      ];
      row.forEach((cell, i) => { doc.text(cell, x, y, { width: colWidths[i] }); x += colWidths[i]; });
      if (item.totalPrice) totalSum += Number(item.totalPrice);
    });

    y += 20;
    doc.fontSize(8).font('Times-Bold-Custom');
    x = 40;
    doc.text('TOTAL', x, y, { width: colWidths.slice(0, -1).reduce((a, b) => a + b, 0) });
    doc.text(`${totalSum.toFixed(2)} MDL`, x + colWidths.slice(0, -1).reduce((a, b) => a + b, 0), y, { width: colWidths[colWidths.length - 1] });

    y += 30;
    doc.fontSize(9).font('Times-Roman-Custom');
    doc.text(`Bioinginer: ${plan.elaboratedBy || '________________'}`, 40, y);
    doc.text(`Șef secție: ${plan.coordSection || '________________'}`, 280, y);
    doc.text(`Șef D/SIBM: ${plan.coordSibm || '________________'}`, 520, y);

    doc.end();
  } catch (error) {
    console.error('Error generating plan PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea PDF-ului' });
  }
});

module.exports = router;
