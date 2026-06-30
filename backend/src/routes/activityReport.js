const express = require('express');
const PDFDocument = require('pdfkit');
const path = require('path');
const { z } = require('zod');
const prisma = require('../db');

const router = express.Router();

const reportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const FAULT_CATEGORIES = [
  'VECHI_STRICAT', 'VARIATII_TENSIUNE', 'APA_GAZ', 'DEFECT_MECANIC',
  'DEFECT_ELECTRONIC', 'INSTALAT_INCORECT', 'GRESEALA_UTILIZATORULUI', 'ABUZ', 'ALTE',
];

const FAULT_CATEGORY_LABELS = {
  VECHI_STRICAT: 'Vechi & stricat',
  VARIATII_TENSIUNE: 'Variații tensiune',
  APA_GAZ: 'Apă/gaz',
  DEFECT_MECANIC: 'Defect mecanic',
  DEFECT_ELECTRONIC: 'Defect electronic',
  INSTALAT_INCORECT: 'Instalat incorect',
  GRESEALA_UTILIZATORULUI: 'Greșeala utilizatorului',
  ABUZ: 'Abuz',
  ALTE: 'Alte',
};

// GET /api/activity-report — raport agregat
router.get('/', async (req, res) => {
  try {
    const parsed = reportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Parametri invalidi (from/to în format YYYY-MM-DD)' });
    }

    const fromDate = new Date(parsed.data.from);
    const toDate = new Date(parsed.data.to);
    toDate.setHours(23, 59, 59, 999);

    // 1. Analiza activității
    const [repairCount, repairHours, mppCount, mppMinutes, verifCount, newDevices] = await Promise.all([
      prisma.repair_tickets.count({ where: { reportedAt: { gte: fromDate, lte: toDate } } }),
      prisma.repair_tickets.aggregate({ where: { reportedAt: { gte: fromDate, lte: toDate } }, _sum: { durationHours: true } }),
      prisma.mpp_executions.count({ where: { executedDate: { gte: fromDate, lte: toDate } } }),
      prisma.mpp_executions.aggregate({ where: { executedDate: { gte: fromDate, lte: toDate } }, _sum: { durationMinutes: true } }),
      prisma.verifications.count({ where: { performedAt: { gte: fromDate, lte: toDate } } }),
      prisma.devices.count({ where: { acquisitionDate: { gte: fromDate, lte: toDate } } }),
    ]);

    const activityAnalysis = {
      repairs: { count: repairCount, hours: Number(repairHours._sum.durationHours) || 0 },
      maintenance: { count: mppCount, hours: (Number(mppMinutes._sum.durationMinutes) || 0) / 60 },
      verifications: { count: verifCount, hours: 0 },
      training: { count: 0, hours: 0 },
      other: { count: 0, hours: 0 },
      totalHours: (Number(repairHours._sum.durationHours) || 0) + ((Number(mppMinutes._sum.durationMinutes) || 0) / 60),
    };

    // 2. Defalcarea cauzelor
    const ticketsWithCategory = await prisma.repair_tickets.findMany({
      where: { reportedAt: { gte: fromDate, lte: toDate } },
      select: { faultCategory: true, durationHours: true },
    });

    const faultBreakdown = {};
    FAULT_CATEGORIES.forEach((cat) => { faultBreakdown[cat] = { count: 0, hours: 0 }; });
    ticketsWithCategory.forEach((t) => {
      const cat = t.faultCategory || 'ALTE';
      if (!faultBreakdown[cat]) faultBreakdown[cat] = { count: 0, hours: 0 };
      faultBreakdown[cat].count++;
      faultBreakdown[cat].hours += Number(t.durationHours) || 0;
    });

    // 3. Analiza timpului pe intervale
    const timeIntervals = {
      under_1h: 0, '1_5h': 0, '5h_1day': 0, '1day_1week': 0, '1week_1month': 0, 'over_1month': 0,
    };
    ticketsWithCategory.forEach((t) => {
      const h = Number(t.durationHours) || 0;
      if (h < 1) timeIntervals['under_1h']++;
      else if (h < 5) timeIntervals['1_5h']++;
      else if (h < 24) timeIntervals['5h_1day']++;
      else if (h < 168) timeIntervals['1day_1week']++;
      else if (h < 720) timeIntervals['1week_1month']++;
      else timeIntervals['over_1month']++;
    });

    const report = {
      period: { from: parsed.data.from, to: parsed.data.to },
      activityAnalysis,
      faultBreakdown,
      timeIntervals,
      newDevicesInstalled: newDevices,
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating activity report:', error);
    res.status(500).json({ error: 'Eroare la generarea raportului de activitate' });
  }
});

// GET /api/activity-report/formular12-pdf — PDF Formular Nr. 12
router.get('/formular12-pdf', async (req, res) => {
  try {
    const parsed = reportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Parametri invalidi (from/to)' });
    }

    const fromDate = new Date(parsed.data.from);
    const toDate = new Date(parsed.data.to);
    toDate.setHours(23, 59, 59, 999);

    // Fetch data for PDF
    const [repairCount, repairTickets, mppCount, mppExecutions, verifCount, newDevices] = await Promise.all([
      prisma.repair_tickets.count({ where: { reportedAt: { gte: fromDate, lte: toDate } } }),
      prisma.repair_tickets.findMany({ where: { reportedAt: { gte: fromDate, lte: toDate } }, select: { faultCategory: true, durationHours: true } }),
      prisma.mpp_executions.count({ where: { executedDate: { gte: fromDate, lte: toDate } } }),
      prisma.mpp_executions.findMany({ where: { executedDate: { gte: fromDate, lte: toDate } }, select: { durationMinutes: true } }),
      prisma.verifications.count({ where: { performedAt: { gte: fromDate, lte: toDate } } }),
      prisma.devices.count({ where: { acquisitionDate: { gte: fromDate, lte: toDate } } }),
    ]);

    const totalRepairHours = repairTickets.reduce((s, t) => s + (Number(t.durationHours) || 0), 0);
    const totalMppHours = mppExecutions.reduce((s, e) => s + (Number(e.durationMinutes) || 0) / 60, 0);

    const doc = new PDFDocument({ margin: 50 });
    doc.registerFont('Times-Roman-Custom', path.join(__dirname, '../assets/fonts/times.ttf'));
    doc.registerFont('Times-Bold-Custom', path.join(__dirname, '../assets/fonts/timesbd.ttf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Formular_12_Raport_${parsed.data.from}_${parsed.data.to}.pdf"`);
    doc.pipe(res);

    doc.fontSize(14).font('Times-Bold-Custom').text('RAPORTUL ACTIVITĂȚII D/SIBM', { align: 'center' });
    doc.fontSize(8).font('Times-Roman-Custom').text(`Formular Nr. 12 — Perioada: ${parsed.data.from} — ${parsed.data.to}`, { align: 'center' });
    doc.moveDown();

    // Tabel 1: Analiza activității
    doc.fontSize(11).font('Times-Bold-Custom').text('1. ANALIZA ACTIVITĂȚII');
    doc.fontSize(9).font('Times-Roman-Custom');
    doc.text(`Reparații: ${repairCount} ( ${totalRepairHours.toFixed(1)} ore )`);
    doc.text(`Mentenanță preventivă: ${mppCount} ( ${totalMppHours.toFixed(1)} ore )`);
    doc.text(`Verificări: ${verifCount}`);
    doc.text(`DM instalate: ${newDevices}`);
    doc.text(`Total ore lucrate: ${(totalRepairHours + totalMppHours).toFixed(1)}`);
    doc.moveDown();

    // Tabel 2: Defalcarea cauzelor
    doc.fontSize(11).font('Times-Bold-Custom').text('2. DEFALCAREA CAUZELOR DEFECȚIUNILOR');
    doc.fontSize(9).font('Times-Roman-Custom');
    const faultCounts = {};
    repairTickets.forEach((t) => {
      const cat = t.faultCategory || 'ALTE';
      if (!faultCounts[cat]) faultCounts[cat] = { count: 0, hours: 0 };
      faultCounts[cat].count++;
      faultCounts[cat].hours += Number(t.durationHours) || 0;
    });
    FAULT_CATEGORIES.forEach((cat) => {
      const data = faultCounts[cat] || { count: 0, hours: 0 };
      if (data.count > 0) {
        doc.text(`${FAULT_CATEGORY_LABELS[cat]}: ${data.count} ( ${data.hours.toFixed(1)} ore )`);
      }
    });
    doc.moveDown();

    // Footer
    doc.fontSize(8).font('Times-Roman-Custom').text(`Generat: ${new Date().toLocaleString('ro-RO')}`, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating formular 12 PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea PDF-ului' });
  }
});

module.exports = router;
