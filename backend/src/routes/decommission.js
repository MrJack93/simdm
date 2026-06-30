const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { z } = require('zod');
const prisma = require('../db');

const router = express.Router();

const idSchema = z.coerce.number().int().positive();

const VALID_DECOMMISSION_TYPES = ['DEFECTARE', 'CONSERVARE', 'CASARE'];

const createDecommissionSchema = z.object({
  deviceId: z.coerce.number().int().positive(),
  type: z.enum(VALID_DECOMMISSION_TYPES),
  nonUsageDate: z.coerce.date().optional(),
  normativeLifespan: z.string().max(255).optional(),
  commissioningDate: z.coerce.date().optional(),
  nominalPrice: z.coerce.number().min(0).optional(),
  currentValue: z.coerce.number().min(0).optional(),
  technicalState: z.string().max(2000).optional(),
  cause: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  responsibleName: z.string().max(255).optional(),
  sectionChief: z.string().max(255).optional(),
  engineerName: z.string().max(255).optional(),
  sibmChief: z.string().max(255).optional(),
  recyclingInfo: z.string().max(2000).optional(),
});

const TYPE_STATUS_MAP = {
  CASARE: 'CASAT',
  CONSERVARE: 'CONSERVAT',
  DEFECTARE: 'DEFECT',
};

// GET /api/decommission — listă cu filtre + paginare
router.get('/', async (req, res) => {
  try {
    const rawPage = Math.max(parseInt(req.query.page) || 1, 1);
    const rawLimit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (rawPage - 1) * rawLimit;

    const { type, deviceId } = req.query;
    const where = {};

    if (type) where.type = type;
    if (deviceId) {
      const dp = idSchema.safeParse(deviceId);
      if (!dp.success) return res.status(400).json({ error: 'ID dispozitiv invalid' });
      where.deviceId = dp.data;
    }

    const [records, total] = await Promise.all([
      prisma.decommission_records.findMany({
        where,
        include: {
          device: { select: { id: true, name: true, inventoryNumber: true } },
          createdBy: { select: { id: true, fullName: true, username: true } },
        },
        skip,
        take: rawLimit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.decommission_records.count({ where }),
    ]);

    res.json({
      data: records,
      pagination: { page: rawPage, limit: rawLimit, total, pages: Math.ceil(total / rawLimit) },
    });
  } catch (error) {
    console.error('Error fetching decommission records:', error);
    res.status(500).json({ error: 'Eroare la preluarea înregistrărilor de casare' });
  }
});

// GET /api/decommission/:id — detalii
router.get('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });

    const record = await prisma.decommission_records.findUnique({
      where: { id: idParse.data },
      include: {
        device: { select: { id: true, name: true, inventoryNumber: true, serialNumber: true, model: true, manufacturer: true, yearMade: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
    });

    if (!record) return res.status(404).json({ error: 'Înregistrare negăsită' });
    res.json(record);
  } catch (error) {
    console.error('Error fetching decommission record:', error);
    res.status(500).json({ error: 'Eroare la preluarea înregistrării' });
  }
});

// POST /api/decommission — creare casare/conservare/defectare
router.post('/', async (req, res) => {
  try {
    const parsed = createDecommissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Date invalide', fields: parsed.error.flatten().fieldErrors });
    }

    const data = parsed.data;
    const device = await prisma.devices.findUnique({ where: { id: data.deviceId } });
    if (!device) return res.status(404).json({ error: 'Dispozitiv negăsit' });

    const newStatus = TYPE_STATUS_MAP[data.type];

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.decommission_records.create({
        data: {
          ...data,
          createdById: req.user.sub,
          updatedAt: new Date(),
        },
        include: {
          device: { select: { id: true, name: true, inventoryNumber: true } },
          createdBy: { select: { id: true, fullName: true, username: true } },
        },
      });

      await tx.devices.update({
        where: { id: data.deviceId },
        data: { status: newStatus, decommissionDate: new Date() },
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'CREATE',
          entity: 'DecommissionRecord',
          entityId: String(created.id),
          changes: { deviceId: data.deviceId, type: data.type, newStatus },
        },
      });

      return created;
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating decommission record:', error);
    res.status(500).json({ error: 'Eroare la crearea înregistrării de casare' });
  }
});

// GET /api/decommission/:id/formular10-pdf — Formular Nr. 10
router.get('/:id/formular10-pdf', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });

    const record = await prisma.decommission_records.findUnique({
      where: { id: idParse.data },
      include: { device: true },
    });

    if (!record) return res.status(404).json({ error: 'Înregistrare negăsită' });

    const d = record.device;
    const typeLabels = { CASARE: 'casare', CONSERVARE: 'conservare', DEFECTARE: 'defectare' };
    const typeLabel = typeLabels[record.type] || record.type.toLowerCase();

    const doc = new PDFDocument({ margin: 50 });
    doc.registerFont('Times-Roman-Custom', path.join(__dirname, '../assets/fonts/times.ttf'));
    doc.registerFont('Times-Bold-Custom', path.join(__dirname, '../assets/fonts/timesbd.ttf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Formular_10_${d.inventoryNumber}.pdf"`);
    doc.pipe(res);

    doc.fontSize(14).font('Times-Bold-Custom').text(`Formular de ☐ defectare ☐ conservare ☐ ${typeLabel} a dispozitivului medical`, { align: 'center' });
    doc.fontSize(8).font('Times-Roman-Custom').text('Anexa 29 — Procedura MDM Nr. 10', { align: 'center' });
    doc.moveDown();

    // Secția medicală
    doc.fontSize(11).font('Times-Bold-Custom').text('1. SECȚIA MEDICALĂ');
    doc.fontSize(10).font('Times-Roman-Custom');
    doc.text(`Denumirea instituției: Spitalul Privat`);
    doc.text(`Locația: ${d.room || '—'}`);
    doc.text(`Nr. inventar: ${d.inventoryNumber}`);
    doc.text(`Data de non-utilizare: ${record.nonUsageDate ? new Date(record.nonUsageDate).toLocaleDateString('ro-RO') : '—'}`);
    doc.moveDown();

    // D/SIBM
    doc.fontSize(11).font('Times-Bold-Custom').text('2. D/SIBM');
    doc.fontSize(10).font('Times-Roman-Custom');
    doc.text(`Producător: ${d.manufacturer || '—'}`);
    doc.text(`An producere: ${d.yearMade || '—'}`);
    doc.text(`Nume dispozitiv: ${d.name}`);
    doc.text(`Model: ${d.model || '—'}`);
    doc.text(`Nr. serie: ${d.serialNumber || '—'}`);
    doc.text(`Nr. inventar: ${d.inventoryNumber}`);
    doc.moveDown();

    // Contabilitate
    doc.fontSize(11).font('Times-Bold-Custom').text('3. CONTABILITATE');
    doc.fontSize(10).font('Times-Roman-Custom');
    doc.text(`Cod dispozitiv: ${d.cndCode || '—'}`);
    doc.text(`Termen normativ exploatare: ${record.normativeLifespan || '—'}`);
    doc.text(`Data dării în exploatare: ${record.commissioningDate ? new Date(record.commissioningDate).toLocaleDateString('ro-RO') : '—'}`);
    doc.text(`Preț nominal: ${record.nominalPrice || '—'} MDL`);
    doc.text(`Valoarea curentă: ${record.currentValue || '—'} MDL`);
    doc.moveDown();

    // Descriere
    doc.fontSize(11).font('Times-Bold-Custom').text('4. DESCRIERE');
    doc.fontSize(10).font('Times-Roman-Custom');
    doc.text(`Starea tehnică: ${record.technicalState || '—'}`);
    doc.text(`Cauza neutilizării: ${record.cause || '—'}`);
    if (record.notes) doc.text(`Notă: ${record.notes}`);
    if (record.recyclingInfo) doc.text(`Reciclare/DEEE: ${record.recyclingInfo}`);
    doc.moveDown();

    // Semnături
    doc.fontSize(11).font('Times-Bold-Custom').text('5. SEMNĂTURI');
    doc.fontSize(10).font('Times-Roman-Custom');
    doc.text(`Persoană responsabilă: ${record.responsibleName || '________________'}`);
    doc.text(`Șef secție medicală: ${record.sectionChief || '________________'}`);
    doc.text(`Inginer responsabil: ${record.engineerName || '________________'}`);
    doc.text(`Șef D/SIBM: ${record.sibmChief || '________________'}`);

    doc.end();
  } catch (error) {
    console.error('Error generating formular 10 PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea PDF-ului' });
  }
});

module.exports = router;
