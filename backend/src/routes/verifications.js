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
  validUntil: z.string().datetime().or(z.date()),
  result: z.enum(['CONFORM', 'NECONFORM']),
  certificateNo: z.string().min(1).max(255).optional(),
  inspectionBody: z.string().min(1).max(255).optional(),
  reportUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

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
      validUntil,
      result,
      certificateNo,
      inspectionBody,
      reportUrl,
      notes,
    } = parseBody.data;

    // Verify device exists and requires verification
    const device = await prisma.devices.findUnique({
      where: { id: deviceId },
      select: { id: true, requiresVerification: true, verificationType: true },
    });

    if (!device) {
      return res.status(404).json({ error: 'Dispozitivul nu există' });
    }

    if (!device.requiresVerification) {
      return res.status(400).json({ error: 'Dispozitivul nu necesită verificare' });
    }

    // Create verification in transaction
    const verification = await prisma.$transaction(async (tx) => {
      const created = await tx.verifications.create({
        data: {
          deviceId,
          type,
          performedAt: new Date(performedAt),
          validUntil: new Date(validUntil),
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
      } else {
        const validUntil = new Date(lastVerification.validUntil);
        validUntil.setHours(0, 0, 0, 0);

        daysLeft = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (validUntil < today) {
          status = 'EXPIRAT';
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
      expirat: deviceStatuses.filter((d) => d.status === 'EXPIRAT').length,
      neverificat: deviceStatuses.filter((d) => d.status === 'NEVERIFICAT').length,
    };

    // Sort by urgency (EXPIRAT first, then NEVERIFICAT, then CONFORM)
    const statusOrder = { EXPIRAT: 0, NEVERIFICAT: 1, CONFORM: 2 };
    deviceStatuses.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    res.json({
      ...stats,
      devices: deviceStatuses,
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: 'Eroare la generarea raportului' });
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
    const { deviceId, status, type, page = 1, limit = 50 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: 'Paginare invalidă' });
    }

    const where = {};
    if (deviceId) where.deviceId = parseInt(deviceId);
    if (type && ['LABORATOR', 'METROLOGIC'].includes(type)) where.type = type;

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

module.exports = router;
