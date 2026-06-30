const express = require('express');
const PDFDocument = require('pdfkit');
const path = require('path');
const { z } = require('zod');
const prisma = require('../db');

const router = express.Router();
const idSchema = z.coerce.number().int().positive();

const createCommissioningSchema = z.object({
  deviceId: z.coerce.number().int().positive(),
  installDate: z.coerce.date().optional(),
  warrantyMonths: z.coerce.number().int().min(0).optional(),
  contractNo: z.string().max(100).optional(),
  contractDate: z.coerce.date().optional(),
  conformityOk: z.boolean().default(false),
  operationTestOk: z.boolean().default(false),
  operationManual: z.boolean().default(false),
  serviceManual: z.boolean().default(false),
  trainingDone: z.boolean().default(false),
  trainees: z.array(z.object({ name: z.string().min(1), role: z.string().optional(), signature: z.string().optional() })).optional(),
  commissionMembers: z.string().max(1000).optional(),
  commissionDecision: z.string().max(1000).optional(),
  comments: z.string().max(2000).optional(),
  handoverActNo: z.string().max(100).optional(),
  supplier: z.string().max(255).optional(),
});

// GET /api/commissioning
router.get('/', async (req, res) => {
  try {
    const rawPage = Math.max(parseInt(req.query.page) || 1, 1);
    const rawLimit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (rawPage - 1) * rawLimit;
    const { deviceId } = req.query;
    const where = {};
    if (deviceId) {
      const dp = idSchema.safeParse(deviceId);
      if (!dp.success) return res.status(400).json({ error: 'ID dispozitiv invalid' });
      where.deviceId = dp.data;
    }
    const [records, total] = await Promise.all([
      prisma.commissioning_records.findMany({
        where,
        include: { device: { select: { id: true, name: true, inventoryNumber: true } } },
        skip, take: rawLimit, orderBy: { createdAt: 'desc' },
      }),
      prisma.commissioning_records.count({ where }),
    ]);
    res.json({ data: records, pagination: { page: rawPage, limit: rawLimit, total, pages: Math.ceil(total / rawLimit) } });
  } catch (error) {
    console.error('Error fetching commissioning records:', error);
    res.status(500).json({ error: 'Eroare la preluarea înregistrărilor' });
  }
});

// GET /api/commissioning/:id
router.get('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });
    const record = await prisma.commissioning_records.findUnique({
      where: { id: idParse.data },
      include: { device: { select: { id: true, name: true, inventoryNumber: true, serialNumber: true, model: true, manufacturer: true, yearMade: true, acquisitionValue: true } }, createdBy: { select: { id: true, fullName: true } } },
    });
    if (!record) return res.status(404).json({ error: 'Înregistrare negăsită' });
    res.json(record);
  } catch (error) {
    console.error('Error fetching commissioning record:', error);
    res.status(500).json({ error: 'Eroare la preluare' });
  }
});

// POST /api/commissioning
router.post('/', async (req, res) => {
  try {
    const parsed = createCommissioningSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Date invalide', fields: parsed.error.flatten().fieldErrors });
    const data = parsed.data;
    const device = await prisma.devices.findUnique({ where: { id: data.deviceId } });
    if (!device) return res.status(404).json({ error: 'Dispozitiv negăsit' });

    const warrantyEndDate = data.installDate && data.warrantyMonths
      ? new Date(new Date(data.installDate).getTime() + data.warrantyMonths * 30 * 24 * 60 * 60 * 1000)
      : undefined;

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.commissioning_records.create({
        data: { ...data, createdById: req.user.sub, updatedAt: new Date() },
        include: { device: { select: { id: true, name: true, inventoryNumber: true } } },
      });
      await tx.devices.update({
        where: { id: data.deviceId },
        data: {
          status: 'FUNCTIONAL',
          acquisitionDate: data.installDate || device.acquisitionDate,
          warrantyEndDate: warrantyEndDate || device.warrantyEndDate,
        },
      });
      await tx.audit_logs.create({ data: { userId: req.user.sub, action: 'CREATE', entity: 'CommissioningRecord', entityId: String(created.id), changes: { deviceId: data.deviceId, conformityOk: data.conformityOk } } });
      return created;
    });
    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating commissioning record:', error);
    res.status(500).json({ error: 'Eroare la creare' });
  }
});

// GET /api/commissioning/:id/formular4-pdf — Formular Nr. 4
router.get('/:id/formular4-pdf', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });
    const record = await prisma.commissioning_records.findUnique({
      where: { id: idParse.data },
      include: { device: true },
    });
    if (!record) return res.status(404).json({ error: 'Înregistrare negăsită' });
    const d = record.device;

    const doc = new PDFDocument({ margin: 50 });
    doc.registerFont('Times-Roman-Custom', path.join(__dirname, '../assets/fonts/times.ttf'));
    doc.registerFont('Times-Bold-Custom', path.join(__dirname, '../assets/fonts/timesbd.ttf'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Formular_4_${d.inventoryNumber}.pdf"`);
    doc.pipe(res);

    doc.fontSize(12).font('Times-Bold-Custom').text('FORMULAR DE DARE ÎN EXPLOATARE A DISPOZITIVULUI MEDICAL', { align: 'center' });
    doc.fontSize(8).font('Times-Roman-Custom').text('Anexa 10 — Formular Nr. 4', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).font('Times-Bold-Custom').text('DATE DISPOZITIV');
    doc.fontSize(9).font('Times-Roman-Custom');
    doc.text(`Denumire: ${d.name}`);
    doc.text(`Model: ${d.model || '—'}`);
    doc.text(`Producător: ${d.manufacturer || '—'}`);
    doc.text(`An: ${d.yearMade || '—'}`);
    doc.text(`Serie: ${d.serialNumber || '—'}`);
    doc.text(`Nr. inventar: ${d.inventoryNumber}`);
    doc.text(`Preț: ${d.acquisitionValue || '—'} MDL`);
    doc.moveDown();

    doc.fontSize(10).font('Times-Bold-Custom').text('CHECKLIST');
    doc.fontSize(9).font('Times-Roman-Custom');
    doc.text(`☐ Conformitate: ${record.conformityOk ? 'DA' : 'NU'}`);
    doc.text(`☐ Test operare: ${record.operationTestOk ? 'DA' : 'NU'}`);
    doc.text(`☐ Manual operare: ${record.operationManual ? 'DA' : 'NU'}`);
    doc.text(`☐ Manual deservire: ${record.serviceManual ? 'DA' : 'NU'}`);
    doc.text(`☐ Training: ${record.trainingDone ? 'DA' : 'NU'}`);
    if (record.trainees && record.trainees.length) {
      doc.text(`Persoane instruite: ${record.trainees.map(t => t.name).join(', ')}`);
    }
    doc.moveDown();

    doc.fontSize(10).font('Times-Bold-Custom').text('COMISIA');
    doc.fontSize(9).font('Times-Roman-Custom');
    doc.text(`Componența: ${record.commissionMembers || '—'}`);
    doc.text(`Decizia: ${record.commissionDecision || '—'}`);
    if (record.comments) doc.text(`Observații: ${record.comments}`);
    doc.moveDown();

    doc.text(`Data instalării: ${record.installDate ? new Date(record.installDate).toLocaleDateString('ro-RO') : '—'}`);
    doc.text(`Garantație: ${record.warrantyMonths || '—'} luni`);

    doc.end();
  } catch (error) {
    console.error('Error generating formular 4 PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea PDF-ului' });
  }
});

// GET /api/commissioning/:id/formular3-pdf — Act predare-primire (Formular Nr. 3, Anexa 9)
router.get('/:id/formular3-pdf', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });

    const record = await prisma.commissioning_records.findUnique({
      where: { id: idParse.data },
      include: { device: true },
    });
    if (!record) return res.status(404).json({ error: 'Înregistrare negăsită' });
    const d = record.device;

    const doc = new PDFDocument({ margin: 50 });
    doc.registerFont('Times-Roman-Custom', path.join(__dirname, '../assets/fonts/times.ttf'));
    doc.registerFont('Times-Bold-Custom', path.join(__dirname, '../assets/fonts/timesbd.ttf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Formular_3_${d.inventoryNumber}.pdf"`);
    doc.pipe(res);

    doc.fontSize(14).font('Times-Bold-Custom').text('ACT DE PREDARE-PRIMIRE A BUNURILOR MATERIALE', { align: 'center' });
    doc.fontSize(8).font('Times-Roman-Custom').text('Anexa 9 — Formular Nr. 3', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).font('Times-Roman-Custom');
    doc.text(`Nr. ${record.handoverActNo || '________'} din ${record.contractDate ? new Date(record.contractDate).toLocaleDateString('ro-RO') : '________'}`);
    doc.text(`Furnizor: ${record.supplier || '________'}`);
    doc.text('Beneficiar: Spitalul Privat');
    doc.moveDown();

    doc.fontSize(11).font('Times-Bold-Custom').text('BUNURI RECEPȚIONATE');
    doc.fontSize(10).font('Times-Roman-Custom');
    doc.text(`1. ${d.name} — Model: ${d.model || '—'}, Serie: ${d.serialNumber || '—'}, Nr. inventar: ${d.inventoryNumber}`);
    doc.text('   Cantitate: 1 buc.');
    doc.moveDown();

    doc.text('Confirm că am primit bunurile menționate mai sus și nu am obiecții față de starea lor.');
    doc.moveDown(2);

    doc.fontSize(10).font('Times-Roman-Custom');
    doc.text('Predat: _________________________                Primit: _________________________');
    doc.text('        (Nume, Prenume, Semnătura)                       (Nume, Prenume, Semnătura)');

    doc.end();
  } catch (error) {
    console.error('Error generating formular 3 PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea Formularului Nr. 3' });
  }
});

module.exports = router;
