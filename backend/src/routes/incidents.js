const express = require('express');
const { z } = require('zod');
const prisma = require('../db');

const router = express.Router();

// Zod schema for ID validation
const idSchema = z.coerce.number().int().positive();

const VALID_SEVERITIES = ['NEAR_MISS', 'MINOR', 'MODERAT', 'GRAV', 'CRITIC'];
const VALID_STATUSES = ['DESCHIS', 'IN_LUCRU', 'REZOLVAT', 'INCHIS', 'ESCALADAT_AMDM'];

async function logAudit(userId, action, entityId, changes = null) {
  try {
    await prisma.audit_logs.create({
      data: {
        userId,
        action,
        entity: 'incidents',
        entityId: entityId?.toString(),
        changes,
      },
    });
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

// Helper: Create audit log data for transactions
function createAuditLogData(userId, action, entityId, changes = null) {
  return {
    userId,
    action,
    entity: 'incidents',
    entityId: entityId?.toString(),
    changes,
  };
}

// GET /api/incidents
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, deviceId, severity, status } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (deviceId) where.deviceId = parseInt(deviceId);
    if (severity && VALID_SEVERITIES.includes(severity)) where.severity = severity;
    if (status && VALID_STATUSES.includes(status)) where.status = status;

    const [incidents, total] = await Promise.all([
      prisma.incidents.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { occurredAt: 'desc' },
        include: {
          devices: { select: { id: true, name: true, inventoryNumber: true } },
          sections: { select: { id: true, name: true } },
        },
      }),
      prisma.incidents.count({ where }),
    ]);

    res.json({
      data: incidents,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Eroare la preluarea incidentelor' });
  }
});

// GET /api/incidents/:id
router.get('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });
    const id = idParse.data;

    const incident = await prisma.incidents.findUnique({
      where: { id },
      include: {
        devices: { select: { id: true, name: true, inventoryNumber: true } },
        sections: { select: { id: true, name: true } },
      },
    });
    if (!incident) return res.status(404).json({ error: 'Incident nu găsit' });

    res.json(incident);
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ error: 'Eroare la preluarea incidentului' });
  }
});

// POST /api/incidents
router.post('/', async (req, res) => {
  try {
    const {
      deviceId, sectionId, occurredAt, description, severity,
      patientAffected, patientHarm, rootCause, correctiveAction,
      preventiveAction, reportedToAmdm, amdmReportDate, amdmReportRef,
    } = req.body;

    if (!deviceId) return res.status(400).json({ error: 'Dispozitivul este obligatoriu' });
    if (!occurredAt) return res.status(400).json({ error: 'Data incidentului este obligatorie' });
    if (!description?.trim()) return res.status(400).json({ error: 'Descrierea este obligatorie' });
    if (!severity || !VALID_SEVERITIES.includes(severity)) return res.status(400).json({ error: 'Severitatea este invalidă' });

    const deviceExists = await prisma.devices.findUnique({ where: { id: parseInt(deviceId) } });
    if (!deviceExists) return res.status(404).json({ error: 'Dispozitivul nu există' });

    const incident = await prisma.$transaction(async (tx) => {
      const created = await tx.incidents.create({
        data: {
          deviceId: parseInt(deviceId),
          sectionId: sectionId ? parseInt(sectionId) : null,
          occurredAt: new Date(occurredAt),
          description: description.trim(),
          severity,
          status: 'DESCHIS',
          patientAffected: Boolean(patientAffected),
          patientHarm: patientAffected ? (patientHarm?.trim() || null) : null,
          rootCause: rootCause?.trim() || null,
          correctiveAction: correctiveAction?.trim() || null,
          preventiveAction: preventiveAction?.trim() || null,
          reportedToAmdm: Boolean(reportedToAmdm),
          amdmReportDate: reportedToAmdm && amdmReportDate ? new Date(amdmReportDate) : null,
          amdmReportRef: reportedToAmdm ? (amdmReportRef?.trim() || null) : null,
          reportedById: req.user.sub,
          updatedAt: new Date(),
        },
        include: {
          devices: { select: { id: true, name: true, inventoryNumber: true } },
          sections: { select: { id: true, name: true } },
        },
      });
      await tx.audit_logs.create({
        data: createAuditLogData(req.user.sub, 'CREATE', created.id, {
          deviceId: parseInt(deviceId),
          severity,
        }),
      });
      return created;
    });

    res.status(201).json(incident);
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Eroare la crearea incidentului' });
  }
});

// PUT /api/incidents/:id
router.put('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });
    const id = idParse.data;

    const existing = await prisma.incidents.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Incident nu găsit' });

    const {
      occurredAt, description, severity, status,
      patientAffected, patientHarm, rootCause, correctiveAction,
      preventiveAction, resolvedAt, reportedToAmdm, amdmReportDate, amdmReportRef,
    } = req.body;

    if (severity && !VALID_SEVERITIES.includes(severity)) return res.status(400).json({ error: 'Severitatea este invalidă' });
    if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Statusul este invalid' });

    const [updated] = await prisma.$transaction([
      prisma.incidents.update({
        where: { id },
        data: {
          ...(occurredAt && { occurredAt: new Date(occurredAt) }),
          ...(description !== undefined && { description: description.trim() }),
          ...(severity && { severity }),
          ...(status && { status }),
          ...(patientAffected !== undefined && { patientAffected: Boolean(patientAffected) }),
          ...(patientHarm !== undefined && { patientHarm: patientHarm?.trim() || null }),
          ...(rootCause !== undefined && { rootCause: rootCause?.trim() || null }),
          ...(correctiveAction !== undefined && { correctiveAction: correctiveAction?.trim() || null }),
          ...(preventiveAction !== undefined && { preventiveAction: preventiveAction?.trim() || null }),
          ...(resolvedAt !== undefined && { resolvedAt: resolvedAt ? new Date(resolvedAt) : null }),
          ...(reportedToAmdm !== undefined && { reportedToAmdm: Boolean(reportedToAmdm) }),
          ...(amdmReportDate !== undefined && { amdmReportDate: amdmReportDate ? new Date(amdmReportDate) : null }),
          ...(amdmReportRef !== undefined && { amdmReportRef: amdmReportRef?.trim() || null }),
          updatedAt: new Date(),
        },
        include: {
          devices: { select: { id: true, name: true, inventoryNumber: true } },
          sections: { select: { id: true, name: true } },
        },
      }),
      prisma.audit_logs.create({
        data: createAuditLogData(req.user.sub, 'UPDATE', id, {
          status: status || existing.status,
          severity: severity || existing.severity
        }),
      }),
    ]);

    res.json(updated);
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ error: 'Eroare la actualizarea incidentului' });
  }
});

// DELETE /api/incidents/:id
router.delete('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) return res.status(400).json({ error: 'ID invalid' });
    const id = idParse.data;

    const existing = await prisma.incidents.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Incident nu găsit' });

    await prisma.$transaction([
      prisma.incidents.delete({ where: { id } }),
      prisma.audit_logs.create({
        data: createAuditLogData(req.user.sub, 'DELETE', id, { deviceId: existing.deviceId }),
      }),
    ]);

    res.json({ message: 'Incident șters cu succes' });
  } catch (error) {
    console.error('Error deleting incident:', error);
    res.status(500).json({ error: 'Eroare la ștergerea incidentului' });
  }
});

module.exports = router;
