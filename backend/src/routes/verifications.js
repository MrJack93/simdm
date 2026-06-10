const express = require('express');
const { z } = require('zod');
const prisma = require('../db');

const router = express.Router();

// Zod schemas
const idSchema = z.coerce.number().int().positive();
const createVerificationSchema = z.object({
  deviceId: z.coerce.number().int().positive(),
  type: z.enum(['LABORATOR', 'METROLOGIC']),
  performedAt: z.string().datetime().or(z.date()),
  // validUntil optional — calculat automat din device.verificationFreqMonths dacă lipsă
  validUntil: z.string().datetime().or(z.date()).optional(),
  result: z.enum(['CONFORM', 'NECONFORM']),
  certificateNo: z.string().min(1).max(255).optional(),
  inspectionBody: z.string().min(1).max(255).optional(),
  reportUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// POST /api/verifications - Create verification record
router.post('/', async (req, res) => {
  try {
    const parseBody = createVerificationSchema.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({
        error: 'Validare eșuată',
        details: parseBody.error.flatten().fieldErrors,
      });
    }

    const {
      deviceId,
      type,
      performedAt,
      validUntil: validUntilInput,
      result,
      certificateNo,
      inspectionBody,
      reportUrl,
      notes,
    } = parseBody.data;

    // Verify device exists and requires verification
    const device = await prisma.devices.findUnique({
      where: { id: deviceId },
      select: { id: true, requiresVerification: true, verificationType: true, verificationFreqMonths: true },
    });

    if (!device) {
      return res.status(404).json({ error: 'Dispozitivul nu există' });
    }

    if (!device.requiresVerification) {
      return res.status(400).json({ error: 'Dispozitivul nu necesită verificare' });
    }

    // Calculează validUntil: din input sau automat din verificationFreqMonths
    let validUntil;
    if (validUntilInput) {
      validUntil = new Date(validUntilInput);
    } else if (device.verificationFreqMonths) {
      validUntil = addMonths(performedAt, device.verificationFreqMonths);
    } else {
      return res.status(400).json({ error: 'validUntil este obligatoriu (dispozitivul nu are frecvență setată)' });
    }

    // Create verification in transaction
    const verification = await prisma.$transaction(async (tx) => {
      const created = await tx.verifications.create({
        data: {
          deviceId,
          type,
          performedAt: new Date(performedAt),
          validUntil,
          result,
          certificateNo: certificateNo || null,
          inspectionBody: inspectionBody || null,
          reportUrl: reportUrl || null,
          notes: notes || null,
          createdById: req.user.sub,
        },
        include: {
          device: { select: { id: true, name: true } },
        },
      });

      // Update device verification dates and optionally status
      const deviceUpdateData = {
        lastVerificationAt: new Date(performedAt),
        nextVerificationAt: new Date(validUntil),
      };
      if (result === 'NECONFORM') {
        deviceUpdateData.status = 'DEFECT';
      }
      await tx.devices.update({
        where: { id: deviceId },
        data: deviceUpdateData,
      });

      // Audit log
      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'CREATE',
          entity: 'verifications',
          entityId: String(created.id),
          changes: {
            type,
            result,
            validUntil: created.validUntil.toISOString(),
          },
        },
      });

      return created;
    });

    res.status(201).json(verification);
  } catch (error) {
    console.error('Error creating verification:', error);
    res.status(500).json({ error: 'Eroare la crearea verificării' });
  }
});

// GET /api/verifications/compliance-report - Compliance status report
router.get('/compliance-report', async (req, res) => {
  try {
    // Get all devices that require verification
    const devices = await prisma.devices.findMany({
      where: {
        requiresVerification: true,
        status: { not: 'CASAT' },
      },
      include: {
        verifications: {
          orderBy: { performedAt: 'desc' },
          take: 1,
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate compliance status for each device
    const deviceStatuses = devices.map((device) => {
      const lastVerification = device.verifications[0];

      let status;
      let daysLeft = null;

      if (!lastVerification) {
        status = 'NEVERIFICAT';
      } else if (lastVerification.result === 'NECONFORM') {
        status = 'NECONFORM';
      } else {
        const validUntil = new Date(lastVerification.validUntil);
        validUntil.setHours(0, 0, 0, 0);

        daysLeft = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (validUntil < today) {
          status = 'EXPIRAT';
        } else if (daysLeft <= 30) {
          status = 'EXPIRA_CURAND';
        } else {
          status = 'CONFORM';
        }
      }

      return {
        deviceId: device.id,
        deviceName: device.name,
        inventoryNumber: device.inventoryNumber,
        requiresVerification: device.requiresVerification,
        verificationType: device.verificationType,
        verificationFreqMonths: device.verificationFreqMonths,
        status,
        daysLeft,
        lastVerification: lastVerification ? {
          id: lastVerification.id,
          performedAt: lastVerification.performedAt,
          validUntil: lastVerification.validUntil,
          result: lastVerification.result,
          type: lastVerification.type,
        } : null,
      };
    });

    // Aggregate statistics
    const stats = {
      total: deviceStatuses.length,
      conform: deviceStatuses.filter((d) => d.status === 'CONFORM').length,
      expiraCurand: deviceStatuses.filter((d) => d.status === 'EXPIRA_CURAND').length,
      expirat: deviceStatuses.filter((d) => d.status === 'EXPIRAT').length,
      neverificat: deviceStatuses.filter((d) => d.status === 'NEVERIFICAT').length,
      neconform: deviceStatuses.filter((d) => d.status === 'NECONFORM').length,
    };

    // Sort by urgency: NECONFORM → EXPIRAT → EXPIRA_CURAND → NEVERIFICAT → CONFORM
    const statusOrder = { NECONFORM: 0, EXPIRAT: 1, EXPIRA_CURAND: 2, NEVERIFICAT: 3, CONFORM: 4 };
    deviceStatuses.sort((a, b) => (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4));

    res.json({
      ...stats,
      devices: deviceStatuses,
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: 'Eroare la generarea raportului' });
  }
});

// GET /api/verifications/:id/certificate - PDF buletin verificare (Anexa 16)
router.get('/:id/certificate', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID verificare invalid' });
    }

    const verification = await prisma.verifications.findUnique({
      where: { id: idParse.data },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            inventoryNumber: true,
            serialNumber: true,
            manufacturer: true,
            model: true,
            sections: { select: { name: true } },
          },
        },
      },
    });

    if (!verification) {
      return res.status(404).json({ error: 'Verificare nu găsit' });
    }

    const PDFDocument = require('pdfkit');
    const path = require('path');
    const pdf = new PDFDocument({ size: 'A4' });

    pdf.registerFont('Times-Roman-Custom', path.join(__dirname, '../assets/fonts/DejaVuSans.ttf'));
    pdf.registerFont('Times-Bold-Custom', path.join(__dirname, '../assets/fonts/DejaVuSans-Bold.ttf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Buletin-Verificare-${verification.id}.pdf"`
    );
    pdf.pipe(res);

    // Antet
    pdf.fontSize(14).font('Times-Bold-Custom')
      .text(toSafePdfText('BULETIN DE VERIFICARE'), { align: 'center' });
    pdf.fontSize(10).font('Times-Roman-Custom')
      .text(toSafePdfText('Formular - Anexa 16, Ghidul Bioinginerului (Ordinul MS nr. 889/2024)'), { align: 'center' });
    pdf.moveDown(0.8);

    // Info verificare
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('1. Date verificare'), { underline: true });
    pdf.fontSize(10).font('Times-Roman-Custom');
    pdf.text(toSafePdfText(`Nr. buletin: ${verification.certificateNo || `VRF-${verification.id}`}`));
    pdf.text(toSafePdfText(`Tip verificare: ${verification.type}`));
    pdf.text(toSafePdfText(`Data efectuarii: ${new Date(verification.performedAt).toLocaleDateString('ro-RO')}`));
    pdf.text(toSafePdfText(`Valabil pana: ${new Date(verification.validUntil).toLocaleDateString('ro-RO')}`));
    pdf.text(toSafePdfText(`Rezultat: ${verification.result}`));
    if (verification.inspectionBody) {
      pdf.text(toSafePdfText(`Organism de inspectie: ${verification.inspectionBody}`));
    }
    pdf.moveDown(0.6);

    // Info dispozitiv
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('2. Dispozitiv medical'), { underline: true });
    pdf.fontSize(10).font('Times-Roman-Custom');
    pdf.text(toSafePdfText(`Denumire: ${verification.device.name}`));
    pdf.text(toSafePdfText(`Producator: ${verification.device.manufacturer || 'N/A'}`));
    pdf.text(toSafePdfText(`Model: ${verification.device.model || 'N/A'}`));
    pdf.text(toSafePdfText(`Nr. serie: ${verification.device.serialNumber || 'N/A'}`));
    pdf.text(toSafePdfText(`Nr. inventar: ${verification.device.inventoryNumber}`));
    if (verification.device.sections) {
      pdf.text(toSafePdfText(`Sectia: ${verification.device.sections.name}`));
    }
    pdf.moveDown(0.6);

    // Note
    if (verification.notes) {
      pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('3. Observatii'), { underline: true });
      pdf.fontSize(10).font('Times-Roman-Custom').text(toSafePdfText(verification.notes));
      pdf.moveDown(0.6);
    }

    // Concluzie
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('Concluzie'), { underline: true });
    pdf.fontSize(10).font('Times-Roman-Custom');
    if (verification.result === 'CONFORM') {
      pdf.text(toSafePdfText('Dispozitivul medical a fost verificat si declarat CONFORM cerintelor tehnice si metrologice.'));
    } else {
      pdf.fillColor('red').text(toSafePdfText('Dispozitivul medical a fost declarat NECONFORM. Se interzice utilizarea pana la remediere.'));
      pdf.fillColor('black');
    }
    pdf.moveDown(1);

    // Semnatura
    pdf.fontSize(10).font('Times-Roman-Custom')
      .text(toSafePdfText('Responsabil verificare: ___________________________   Data: ___________'), { indent: 20 });

    // Footer
    pdf.fontSize(8).font('Times-Roman-Custom')
      .text(toSafePdfText(`Generat: ${new Date().toLocaleDateString('ro-RO')} | SIMDM`), { align: 'center' });

    pdf.end();
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea buletinului' });
  }
});

// GET /api/verifications/:id - Get verification details
router.get('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID verificare invalid' });
    }

    const verification = await prisma.verifications.findUnique({
      where: { id: idParse.data },
      include: {
        device: { select: { id: true, name: true, inventoryNumber: true } },
      },
    });

    if (!verification) {
      return res.status(404).json({ error: 'Verificare nu găsit' });
    }

    res.json(verification);
  } catch (error) {
    console.error('Error fetching verification:', error);
    res.status(500).json({ error: 'Eroare la preluarea verificării' });
  }
});

// GET /api/verifications - List verifications with filters
router.get('/', async (req, res) => {
  try {
    const { deviceId, status, result, type, page = 1, limit = 50 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: 'Paginare invalidă' });
    }

    const where = {};
    if (deviceId) where.deviceId = parseInt(deviceId);
    if (type && ['LABORATOR', 'METROLOGIC'].includes(type)) where.type = type;

    const resFilter = result || status;
    if (resFilter && ['CONFORM', 'NECONFORM'].includes(resFilter)) {
      where.result = resFilter;
    }

    const [verifications, total] = await Promise.all([
      prisma.verifications.findMany({
        where,
        include: {
          device: { select: { id: true, name: true, inventoryNumber: true } },
        },
        orderBy: { performedAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.verifications.count({ where }),
    ]);

    res.json({
      data: verifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error listing verifications:', error);
    res.status(500).json({ error: 'Eroare la preluarea verificărilor' });
  }
});

// DELETE /api/verifications/:id - Șterge verificare
router.delete('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID verificare invalid' });
    }

    const verification = await prisma.verifications.findUnique({
      where: { id: idParse.data },
    });

    if (!verification) {
      return res.status(404).json({ error: 'Verificare nu găsit' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.verifications.delete({ where: { id: idParse.data } });
      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'DELETE',
          entity: 'verifications',
          entityId: String(idParse.data),
          changes: { deviceId: verification.deviceId, type: verification.type },
        },
      });
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting verification:', error);
    res.status(500).json({ error: 'Eroare la ștergerea verificării' });
  }
});

// Helper: Return text as-is since custom TTF fonts support Romanian diacritics natively
function toSafePdfText(str) {
  return str || '';
}

module.exports = router;
