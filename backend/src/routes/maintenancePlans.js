const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const PDFDocument = require('pdfkit');

const router = express.Router();

// Zod schemas
const idSchema = z.coerce.number().int().positive();
const generatePlanSchema = z.object({
  deviceId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().min(2020).max(2100),
  frequency: z.enum(['LUNAR', 'BIMESTRIAL', 'TRIMESTRIAL', 'SEMESTRIAL', 'ANUAL']),
  responsibleName: z.string().min(1).max(255),
  responsibleAffil: z.string().optional(),
});

const rescheduleSchema = z.object({
  newDate: z.coerce.date(),
  reason: z.string().min(5).max(1000),
});

// Helper: Map frequency to months [1..12]
function frequencyToMonths(frequency) {
  const mappings = {
    'LUNAR': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    'BIMESTRIAL': [2, 4, 6, 8, 10, 12],
    'TRIMESTRIAL': [3, 6, 9, 12],
    'SEMESTRIAL': [6, 12],
    'ANUAL': [12], // anchor to December
  };
  return mappings[frequency] || [];
}

// Helper: Calculate scheduled date for a month
function getScheduledDate(year, month) {
  return new Date(year, month - 1, 15); // Day 15 of month
}

// Helper: Calculate status dynamically
function calculateStatus(occurrence, executionId) {
  if (executionId) return 'EFECTUAT';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduled = new Date(occurrence.rescheduledTo ?? occurrence.scheduledDate);
  scheduled.setHours(0, 0, 0, 0);

  if (scheduled < today) return 'DEPASIT';
  const daysUntil = (scheduled - today) / (1000 * 60 * 60 * 24);
  if (daysUntil <= 7) return 'SCADENT';
  return 'PROGRAMAT';
}

// Păstrat doar generatorul conform Fazei 3 (/generate, /calendar, etc.)

// DELETE /api/maintenance-plans/:id
router.delete('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID invalid' });
    }

    const id = idParse.data;

    let plan = await prisma.maintenance_plans.findUnique({
      where: { id },
    });

    if (!plan) {
      const occurrence = await prisma.mpp_occurrences.findUnique({
        where: { id },
      });
      if (occurrence) {
        plan = await prisma.maintenance_plans.findUnique({
          where: { id: occurrence.planId },
        });
      }
    }

    if (!plan) {
      return res.status(404).json({ error: 'Plan de mentenanță nu a fost găsit' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.maintenance_plans.delete({
        where: { id: plan.id },
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'DELETE',
          entity: 'maintenance_plans',
          entityId: String(plan.id),
          changes: { reason: 'Plan șters din panoul de control' },
        },
      });
    });

    res.json({ message: 'Plan de mentenanță șters cu succes' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Eroare la ștergerea planului' });
  }
});

// POST /api/maintenance-plans/generate
router.post('/generate', async (req, res) => {
  try {
    const parseBody = generatePlanSchema.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({
        error: 'Validare eșuată',
        details: parseBody.error.flatten().fieldErrors
      });
    }

    const { deviceId, year, frequency, responsibleName, responsibleAffil } = parseBody.data;

    // Verify device exists
    const device = await prisma.devices.findUnique({ where: { id: deviceId } });
    if (!device) {
      return res.status(404).json({ error: 'Dispozitivul nu există' });
    }

    const months = frequencyToMonths(frequency);
    if (months.length === 0) {
      return res.status(400).json({ error: 'Frecvență invalidă' });
    }

    const plan = await prisma.$transaction(async (tx) => {
      // Upsert plan
      const created = await tx.maintenance_plans.upsert({
        where: { deviceId_year: { deviceId, year } },
        create: {
          deviceId,
          year,
          frequency,
          responsibleName,
          responsibleAffil: responsibleAffil || null,
          months,
          updatedAt: new Date(),
        },
        update: {
          frequency,
          responsibleName,
          responsibleAffil: responsibleAffil || null,
          months,
          updatedAt: new Date(),
        },
      });

      // Delete old non-executed occurrences
      await tx.mpp_occurrences.deleteMany({
        where: {
          planId: created.id,
          status: { not: 'EFECTUAT' },
        },
      });

      // Create new occurrences for each month
      const occurrences = [];
      for (const month of months) {
        occurrences.push({
          planId: created.id,
          deviceId,
          scheduledDate: getScheduledDate(year, month),
          status: 'PROGRAMAT',
        });
      }

      await tx.mpp_occurrences.createMany({ data: occurrences });

      // Create audit log
      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'CREATE',
          entity: 'maintenance_plans',
          entityId: String(created.id),
          changes: { frequency, months: months.length },
        },
      });

      return created;
    });

    res.status(201).json({
      ...plan,
      occurrenceCount: months.length,
    });
  } catch (error) {
    console.error('Error generating maintenance plan:', error);
    res.status(500).json({ error: 'Eroare la generarea planului' });
  }
});

// GET /api/maintenance-plans/calendar?year=YYYY
router.get('/calendar', async (req, res) => {
  try {
    const { year } = req.query;
    const yearNum = year ? parseInt(year) : new Date().getFullYear();

    // Get all occurrences for the year
    const occurrences = await prisma.mpp_occurrences.findMany({
      where: {
        plan: { year: yearNum },
      },
      include: {
        plan: {
          select: {
            id: true,
            deviceId: true,
            frequency: true,
            device: {
              select: { id: true, name: true, inventoryNumber: true },
            },
          },
        },
      },
    });

    // Calculate status dynamically for each occurrence
    const occurrencesWithStatus = occurrences.map((occ) => ({
      ...occ,
      status: calculateStatus(occ, occ.executionId),
    }));

    res.json({
      year: yearNum,
      data: occurrencesWithStatus,
      total: occurrencesWithStatus.length,
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({ error: 'Eroare la preluarea calendarului' });
  }
});

// GET /api/maintenance-plans/:id
router.get('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID plan invalid' });
    }

    const plan = await prisma.maintenance_plans.findUnique({
      where: { id: idParse.data },
      include: {
        device: { select: { id: true, name: true, inventoryNumber: true } },
        occurrences: {
          orderBy: { scheduledDate: 'asc' },
        },
      },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan nu găsit' });
    }

    // Calculate status for each occurrence
    plan.occurrences = plan.occurrences.map((occ) => ({
      ...occ,
      status: calculateStatus(occ, occ.executionId),
    }));

    res.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Eroare la preluarea planului' });
  }
});

// PATCH /api/maintenance-plans/occurrence/:id/reschedule
router.patch('/occurrence/:id/reschedule', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID ocurență invalid' });
    }

    const parseBody = rescheduleSchema.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({
        error: 'Validare eșuată — motivul trebuie să aibă min 5 caractere',
        details: parseBody.error.flatten().fieldErrors,
      });
    }

    const { newDate, reason } = parseBody.data;
    const occurrenceId = idParse.data;

    const occurrence = await prisma.mpp_occurrences.findUnique({
      where: { id: occurrenceId },
    });

    if (!occurrence) {
      return res.status(404).json({ error: 'Ocurență nu găsită' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.mpp_occurrences.update({
        where: { id: occurrenceId },
        data: {
          rescheduledTo: newDate,
          rescheduleReason: reason,
        },
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'UPDATE',
          entity: 'mpp_occurrences',
          entityId: String(occurrenceId),
          changes: { rescheduledTo: newDate.toISOString(), reason },
        },
      });

      return upd;
    });

    res.json(updated);
  } catch (error) {
    console.error('Error rescheduling occurrence:', error);
    res.status(500).json({ error: 'Eroare la reprogramare' });
  }
});

// Helper: Return text as-is since custom TTF fonts support Romanian diacritics natively
function toSafePdfText(str) {
  return str || '';
}

// GET /api/maintenance-plans/:year/formular5-pdf
router.get('/:year/formular5-pdf', async (req, res) => {
  try {
    const yearNum = parseInt(req.params.year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      return res.status(400).json({ error: 'An invalid' });
    }

    // Get all plans for the year with their devices
    const plans = await prisma.maintenance_plans.findMany({
      where: { year: yearNum },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            sectionId: true,
            sections: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (plans.length === 0) {
      return res.status(404).json({ error: 'Nu există planuri pentru anul specificat' });
    }

    // Create PDF
    const path = require('path');
    const pdf = new PDFDocument({ size: 'A4', layout: 'landscape' });
    
    // Register custom TTF fonts that support Romanian diacritics
    pdf.registerFont('Times-Roman-Custom', path.join(__dirname, '../assets/fonts/times.ttf'));
    pdf.registerFont('Times-Bold-Custom', path.join(__dirname, '../assets/fonts/timesbd.ttf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Formular-5-${yearNum}.pdf"`);

    pdf.pipe(res);

    // Title
    pdf.fontSize(14).font('Times-Bold-Custom').text(toSafePdfText('PLAN DE MENTENANȚĂ PREVENTIVĂ'), { align: 'center' });
    pdf.fontSize(12).font('Times-Roman-Custom').text(toSafePdfText(`pentru dispozitivele medicale pentru anul ${yearNum}`), { align: 'center' });
    pdf.fontSize(10).text(toSafePdfText('Formular Nr. 5 – Anexa 16, Procedura MDM Nr. 6'), { align: 'center' });
    pdf.moveDown(0.5);

    // Table header
    const columns = [
      { header: 'Nr', width: 30 },
      { header: toSafePdfText('Denumirea dispozitivului medical'), width: 130 },
      { header: toSafePdfText('Cod DM / Nr. de serie'), width: 90 },
      { header: toSafePdfText('Secția medicală'), width: 90 },
      { header: toSafePdfText('Persoana responsabilă (Afiliat | Nume)'), width: 120 },
      ...Array.from({ length: 12 }, (_, i) => ({
        header: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        width: 25,
      })),
    ];

    // Draw header row
    let x = 20;
    const headerY = pdf.y;
    columns.forEach((col) => {
      pdf.fontSize(9).font('Times-Bold-Custom')
        .text(col.header, x, headerY, { width: col.width, align: 'center', valign: 'center' });
      x += col.width;
    });
    pdf.moveDown(1.5);

    // Draw data rows
    plans.forEach((plan, planIdx) => {
      let x = 20;
      const rowY = pdf.y;

      // Row number
      pdf.fontSize(9).font('Times-Roman-Custom')
        .text(String(planIdx + 1), x, rowY, { width: 30, align: 'center', valign: 'top' });
      x += 30;

      // Device name
      pdf.text(toSafePdfText(plan.device.name), x, rowY, { width: 130, align: 'left', valign: 'top' });
      x += 130;

      // Serial / Code
      const serial = plan.device.serialNumber || '-';
      pdf.text(toSafePdfText(serial), x, rowY, { width: 90, align: 'left', valign: 'top' });
      x += 90;

      // Section
      const section = plan.device.sections?.name || '-';
      pdf.text(toSafePdfText(section), x, rowY, { width: 90, align: 'left', valign: 'top' });
      x += 90;

      // Responsible (Afiliat | Nume)
      const responsibleText = plan.responsibleAffil
        ? `${plan.responsibleAffil} | ${plan.responsibleName}`
        : plan.responsibleName;
      pdf.text(toSafePdfText(responsibleText), x, rowY, { width: 120, align: 'left', valign: 'top' });
      x += 120;

      // Months (X markers)
      for (let month = 1; month <= 12; month++) {
        const marker = plan.months.includes(month) ? 'X' : '';
        pdf.text(marker, x, rowY + 8, { width: 25, align: 'center', valign: 'center' });
        x += 25;
      }

      pdf.moveDown(2);
    });

    // Footer
    pdf.moveDown();
    pdf.fontSize(9).font('Times-Roman-Custom').text(toSafePdfText(`Data generării: ${new Date().toLocaleDateString('ro-RO')}`), { align: 'right' });

    pdf.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea PDF-ului' });
  }
});

module.exports = router;
