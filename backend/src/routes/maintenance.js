const express = require('express');
const prisma = require('../db');

const router = express.Router();

const VALID_TYPES = ['PREVENTIVA', 'CORECTIVA', 'VERIFICARE', 'CALIBRARE'];

async function logAudit(userId, action, entityId, changes = null) {
  try {
    await prisma.audit_logs.create({
      data: {
        userId,
        action,
        entity: 'maintenance_records',
        entityId: entityId?.toString(),
        changes,
      },
    });
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

// GET /api/maintenance
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, deviceId, type, dateFrom, dateTo } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (deviceId) where.deviceId = parseInt(deviceId);
    if (type && VALID_TYPES.includes(type)) where.type = type;
    if (dateFrom || dateTo) {
      where.executedDate = {};
      if (dateFrom) where.executedDate.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.executedDate.lte = end;
      }
    }

    const [records, total] = await Promise.all([
      prisma.maintenance_records.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { executedDate: 'desc' },
        include: {
          devices: { select: { id: true, name: true, inventoryNumber: true } },
        },
      }),
      prisma.maintenance_records.count({ where }),
    ]);

    res.json({
      data: records,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ error: 'Eroare la preluarea înregistrărilor de mentenanță' });
  }
});

// GET /api/maintenance/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID invalid' });

    const record = await prisma.maintenance_records.findUnique({
      where: { id },
      include: {
        devices: { select: { id: true, name: true, inventoryNumber: true } },
      },
    });
    if (!record) return res.status(404).json({ error: 'Înregistrare nu găsită' });

    res.json(record);
  } catch (error) {
    console.error('Error fetching maintenance record:', error);
    res.status(500).json({ error: 'Eroare la preluarea înregistrării' });
  }
});

// POST /api/maintenance
router.post('/', async (req, res) => {
  try {
    const {
      deviceId, type, scheduledDate, executedDate, duration,
      description, partsReplaced, consumablesUsed, result,
      cost, externalService, serviceProvider, reportUrl, notes,
    } = req.body;

    if (!deviceId) return res.status(400).json({ error: 'Dispozitivul este obligatoriu' });
    if (!type || !VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Tipul mentenanței este invalid' });
    if (!executedDate) return res.status(400).json({ error: 'Data execuției este obligatorie' });
    if (!description?.trim()) return res.status(400).json({ error: 'Descrierea este obligatorie' });

    const deviceExists = await prisma.devices.findUnique({ where: { id: parseInt(deviceId) } });
    if (!deviceExists) return res.status(404).json({ error: 'Dispozitivul nu există' });

    const record = await prisma.maintenance_records.create({
      data: {
        deviceId: parseInt(deviceId),
        type,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        executedDate: new Date(executedDate),
        duration: duration ? parseFloat(duration) : null,
        description: description.trim(),
        partsReplaced: partsReplaced?.trim() || null,
        consumablesUsed: consumablesUsed?.trim() || null,
        result: result?.trim() || null,
        cost: cost ? parseFloat(cost) : null,
        externalService: Boolean(externalService),
        serviceProvider: serviceProvider?.trim() || null,
        reportUrl: reportUrl?.trim() || null,
        performedById: req.user.id,
        notes: notes?.trim() || null,
        updatedAt: new Date(),
      },
      include: {
        devices: { select: { id: true, name: true, inventoryNumber: true } },
      },
    });

    await logAudit(req.user.id, 'CREATE', record.id, { deviceId: record.deviceId, type: record.type });

    // Actualizare lastMaintenanceAt pe dispozitiv
    await prisma.devices.update({
      where: { id: parseInt(deviceId) },
      data: { lastMaintenanceAt: new Date(executedDate), updatedAt: new Date() },
    }).catch(() => {});

    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({ error: 'Eroare la crearea înregistrării de mentenanță' });
  }
});

// PUT /api/maintenance/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID invalid' });

    const existing = await prisma.maintenance_records.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Înregistrare nu găsită' });

    const {
      type, scheduledDate, executedDate, duration,
      description, partsReplaced, consumablesUsed, result,
      cost, externalService, serviceProvider, reportUrl, notes,
    } = req.body;

    if (type && !VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Tipul mentenanței este invalid' });

    const updated = await prisma.maintenance_records.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(scheduledDate !== undefined && { scheduledDate: scheduledDate ? new Date(scheduledDate) : null }),
        ...(executedDate && { executedDate: new Date(executedDate) }),
        ...(duration !== undefined && { duration: duration ? parseFloat(duration) : null }),
        ...(description !== undefined && { description: description.trim() }),
        ...(partsReplaced !== undefined && { partsReplaced: partsReplaced?.trim() || null }),
        ...(consumablesUsed !== undefined && { consumablesUsed: consumablesUsed?.trim() || null }),
        ...(result !== undefined && { result: result?.trim() || null }),
        ...(cost !== undefined && { cost: cost ? parseFloat(cost) : null }),
        ...(externalService !== undefined && { externalService: Boolean(externalService) }),
        ...(serviceProvider !== undefined && { serviceProvider: serviceProvider?.trim() || null }),
        ...(reportUrl !== undefined && { reportUrl: reportUrl?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        updatedAt: new Date(),
      },
      include: {
        devices: { select: { id: true, name: true, inventoryNumber: true } },
      },
    });

    await logAudit(req.user.id, 'UPDATE', id, { type: updated.type });

    res.json(updated);
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    res.status(500).json({ error: 'Eroare la actualizarea înregistrării' });
  }
});

// DELETE /api/maintenance/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID invalid' });

    const existing = await prisma.maintenance_records.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Înregistrare nu găsită' });

    await prisma.maintenance_records.delete({ where: { id } });
    await logAudit(req.user.id, 'DELETE', id, { deviceId: existing.deviceId });

    res.json({ message: 'Înregistrare ștearsă cu succes' });
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    res.status(500).json({ error: 'Eroare la ștergerea înregistrării' });
  }
});

module.exports = router;
