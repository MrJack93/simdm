const express = require('express');
const PDFDocument = require('pdfkit');
const path = require('path');
const { z } = require('zod');
const prisma = require('../db');

const router = express.Router();

const idSchema = z.coerce.number().int().positive();

const createDutyLogSchema = z.object({
  deviceId: z.coerce.number().int().positive().optional(),
  deviceName: z.string().min(1).max(255),
  faultDescription: z.string().min(1).max(2000),
  reportedBy: z.string().min(1).max(255),
});

const resolveSchema = z.object({
  resolution: z.string().min(1).max(2000),
  engineerName: z.string().min(1).max(255),
});

// GET /api/duty-log — listă cu filtre + paginare
router.get('/', async (req, res) => {
  try {
    const rawPage = Math.max(parseInt(req.query.page) || 1, 1);
    const rawLimit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (rawPage - 1) * rawLimit;

    const { resolved, deviceId } = req.query;
    const where = {};

    if (resolved === 'true') where.resolvedAt = { not: null };
    else if (resolved === 'false') where.resolvedAt = null;

    if (deviceId) {
      const dp = idSchema.safeParse(deviceId);
      if (!dp.success) return res.status(400).json({ error: 'ID dispozitiv invalid' });
      where.deviceId = dp.data;
    }

    const [entries, total] = await Promise.all([
      prisma.duty_log_entries.findMany({
        where,
        include: {
          device: { select: { id: true, name: true, inventoryNumber: true } },
        },
        skip,
        take: rawLimit,
        orderBy: { reportedAt: 'desc' },
      }),
      prisma.duty_log_entries.count({ where }),
    ]);

    res.json({
      data: entries,
      pagination: { page: rawPage, limit: rawLimit, total, pages: Math.ceil(total / rawLimit) },
    });
  } catch (error) {
    console.error('Error fetching duty log:', error);
    res.status(500).json({ error: 'Eroare la preluarea jurnalului de gardă' });
  }
});

// POST /api/duty-log — raportare defecțiune
router.post('/', async (req, res) => {
  try {
    const parsed = createDutyLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Date invalide', fields: parsed.error.flatten().fieldErrors });
    }

    const data = parsed.data;

    if (data.deviceId) {
      const device = await prisma.devices.findUnique({ where: { id: data.deviceId } });
      if (!device) return res.status(404).json({ error: 'Dispozitiv negăsit' });
    }

    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.duty_log_entries.create({
        data: {
          ...data,
          createdById: req.user.sub,
          updatedAt: new Date(),
        },
        include: {
          device: { select: { id: true, name: true, inventoryNumber: true } },
        },
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'CREATE',
          entity: 'DutyLogEntry',
          entityId: String(created.id),
          changes: { deviceName: data.deviceName, faultDescription: data.faultDescription },
        },
      });

      return created;
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating duty log entry:', error);
    res.status(500).json({ error: 'Eroare la crearea înregistrării' });
  }
});

// PATCH /api/duty-log/:id/resolve — soluționare
router.patch('/:id/resolve', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });

    const parsed = resolveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Date invalide', fields: parsed.error.flatten().fieldErrors });
    }

    const existing = await prisma.duty_log_entries.findUnique({ where: { id: idParse.data } });
    if (!existing) return res.status(404).json({ error: 'Înregistrare negăsită' });
    if (existing.resolvedAt) return res.status(409).json({ error: 'Deja soluționat' });

    const entry = await prisma.$transaction(async (tx) => {
      const updated = await tx.duty_log_entries.update({
        where: { id: idParse.data },
        data: {
          resolution: parsed.data.resolution,
          engineerName: parsed.data.engineerName,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          device: { select: { id: true, name: true, inventoryNumber: true } },
        },
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'UPDATE',
          entity: 'DutyLogEntry',
          entityId: String(updated.id),
          changes: { resolution: parsed.data.resolution, engineerName: parsed.data.engineerName },
        },
      });

      return updated;
    });

    res.json(entry);
  } catch (error) {
    console.error('Error resolving duty log:', error);
    res.status(500).json({ error: 'Eroare la soluționare' });
  }
});

// GET /api/duty-log/formular11-pdf — Formular Nr. 11
router.get('/formular11-pdf', async (req, res) => {
  try {
    const entries = await prisma.duty_log_entries.findMany({
      orderBy: { reportedAt: 'desc' },
      take: 50,
    });

    const doc = new PDFDocument({ margin: 40, layout: 'landscape' });
    doc.registerFont('Times-Roman-Custom', path.join(__dirname, '../assets/fonts/times.ttf'));
    doc.registerFont('Times-Bold-Custom', path.join(__dirname, '../assets/fonts/timesbd.ttf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Formular_11_Jurnal_Garda.pdf"');
    doc.pipe(res);

    doc.fontSize(12).font('Times-Bold-Custom').text('JOURNAL DE GARDA', { align: 'center' });
    doc.fontSize(8).font('Times-Roman-Custom').text('Anexa 4 — Formular Nr. 11', { align: 'center' });
    doc.moveDown();

    const tableTop = doc.y;
    const colWidths = [80, 100, 120, 100, 120, 80, 80];
    const headers = ['Data/Ora', 'DM Defectat', 'Defectul', 'Responsabil gardă', 'Soluționarea', 'Data/Ora ing.', 'Resp. D/SIBM'];

    doc.fontSize(7).font('Times-Bold-Custom');
    let x = 40;
    headers.forEach((h, i) => {
      doc.text(h, x, tableTop, { width: colWidths[i], align: 'center' });
      x += colWidths[i];
    });

    doc.fontSize(7).font('Times-Roman-Custom');
    entries.forEach((entry, idx) => {
      const y = tableTop + 15 + idx * 18;
      x = 40;
      const row = [
        entry.reportedAt ? new Date(entry.reportedAt).toLocaleString('ro-RO') : '—',
        entry.deviceName,
        (entry.faultDescription || '').substring(0, 40),
        entry.reportedBy,
        (entry.resolution || '—').substring(0, 40),
        entry.resolvedAt ? new Date(entry.resolvedAt).toLocaleString('ro-RO') : '—',
        entry.engineerName || '—',
      ];
      row.forEach((cell, i) => {
        doc.text(cell, x, y, { width: colWidths[i] });
        x += colWidths[i];
      });
    });

    doc.end();
  } catch (error) {
    console.error('Error generating formular 11 PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea PDF-ului' });
  }
});

module.exports = router;
