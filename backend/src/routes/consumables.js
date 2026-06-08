const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Zod schema for ID validation
const idSchema = z.coerce.number().int().positive();

// L1 Fix: Auth middleware now applied in index.js for consistency
// router.use(authMiddleware); // REMOVED - auth is applied in index.js

// Helper: Log audit trail (for non-transactional use only)
async function logAudit(userId, action, entity, entityId, changes = null) {
  try {
    await prisma.audit_logs.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId?.toString(),
        changes,
      },
    });
  } catch (error) {
    console.error('Error logging audit:', error.message);
  }
}

// Helper: Create audit log data (for use in transactions)
function createAuditLogData(userId, action, entity, entityId, changes = null) {
  return {
    userId,
    action,
    entity,
    entityId: entityId?.toString(),
    changes,
  };
}

// GET /api/consumables — lista cu paginare + filtre
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, minQuantity } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minQuantity) {
      where.quantity = { lt: parseInt(minQuantity) };
    }

    const [consumables, total] = await Promise.all([
      prisma.consumables.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
      }),
      prisma.consumables.count({ where }),
    ]);

    res.json({
      consumables,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching consumables:', error);
    res.status(500).json({ error: 'Eroare la preluarea consumabilelor' });
  }
});

// GET /api/consumables/dropdown — pentru form selectors
router.get('/dropdown', async (req, res) => {
  try {
    const consumables = await prisma.consumables.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, unitOfMeasure: true },
      orderBy: { name: 'asc' },
    });
    res.json(consumables);
  } catch (error) {
    console.error('Error fetching consumables dropdown:', error);
    res.status(500).json({ error: 'Eroare la preluarea consumabilelor' });
  }
});

// POST /api/consumables — creare consumabil
router.post('/', async (req, res) => {
  try {
    const { name, model, manufacturer, unitOfMeasure, quantity, minQuantity, expiryDate, location, notes } = req.body;

    // Validare
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Denumirea consumabilului este obligatorie' });
    }

    const q = parseInt(quantity) || 0;
    const minQ = parseInt(minQuantity) || 0;
    if (q < 0 || minQ < 0) {
      return res.status(400).json({ error: 'Cantitatea nu poate fi negativă' });
    }

    const [consumable] = await prisma.$transaction([
      prisma.consumables.create({
        data: {
          name: name.trim(),
          model: model?.trim() || null,
          manufacturer: manufacturer?.trim() || null,
          unitOfMeasure: unitOfMeasure?.trim() || 'buc',
          quantity: q,
          minQuantity: minQ,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          location: location?.trim() || null,
          notes: notes?.trim() || null,
          updatedAt: new Date(),
        },
      }),
      prisma.audit_logs.create({
        data: createAuditLogData(req.user.sub, 'CREATE', 'consumables', null, {
          name: name.trim(),
          quantity: q,
        }),
      }),
    ]);

    res.status(201).json(consumable);
  } catch (error) {
    console.error('Error creating consumable:', error);
    res.status(500).json({ error: 'Eroare la crearea consumabilului' });
  }
});

// PUT /api/consumables/:id — update
router.put('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID consumabil invalid', details: idParse.error.flatten().fieldErrors });
    }
    const consumableId = idParse.data;
    const { name, model, manufacturer, unitOfMeasure, quantity, minQuantity, expiryDate, location, notes } = req.body;

    const existing = await prisma.consumables.findUnique({ where: { id: consumableId } });
    if (!existing || existing.isDeleted) {
      return res.status(404).json({ error: 'Consumabil nu găsit' });
    }

    // Validare
    if (name !== undefined && (!name || name.trim() === '')) {
      return res.status(400).json({ error: 'Denumirea consumabilului este obligatorie' });
    }

    const q = quantity !== undefined ? parseInt(quantity) : existing.quantity;
    const minQ = minQuantity !== undefined ? parseInt(minQuantity) : existing.minQuantity;
    if (q < 0 || minQ < 0) {
      return res.status(400).json({ error: 'Cantitatea nu poate fi negativă' });
    }

    const [updated] = await prisma.$transaction([
      prisma.consumables.update({
        where: { id: consumableId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(model !== undefined && { model: model?.trim() || null }),
          ...(manufacturer !== undefined && { manufacturer: manufacturer?.trim() || null }),
          ...(unitOfMeasure !== undefined && { unitOfMeasure: unitOfMeasure?.trim() || 'buc' }),
          ...(quantity !== undefined && { quantity: q }),
          ...(minQuantity !== undefined && { minQuantity: minQ }),
          ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
          ...(location !== undefined && { location: location?.trim() || null }),
          ...(notes !== undefined && { notes: notes?.trim() || null }),
        },
      }),
      prisma.audit_logs.create({
        data: createAuditLogData(req.user.sub, 'UPDATE', 'consumables', consumableId, {
          name: updated.name,
          quantity: updated.quantity,
        }),
      }),
    ]);

    res.json(updated);
  } catch (error) {
    console.error('Error updating consumable:', error);
    res.status(500).json({ error: 'Eroare la actualizarea consumabilului' });
  }
});

// DELETE /api/consumables/:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID consumabil invalid' });
    }
    const consumableId = idParse.data;

    const existing = await prisma.consumables.findUnique({ where: { id: consumableId } });
    if (!existing) {
      return res.status(404).json({ error: 'Consumabil nu găsit' });
    }

    const [updated] = await prisma.$transaction([
      prisma.consumables.update({
        where: { id: consumableId },
        data: { isDeleted: true },
      }),
      prisma.audit_logs.create({
        data: createAuditLogData(req.user.sub, 'DELETE', 'consumables', consumableId, {
          name: existing.name,
        }),
      }),
    ]);

    res.json({ message: 'Consumabil șters cu succes', consumable: updated });
  } catch (error) {
    console.error('Error deleting consumable:', error);
    res.status(500).json({ error: 'Eroare la ștergerea consumabilului' });
  }
});

// POST /api/consumables/:id/stock — adaugă stoc
router.post('/:id/stock', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID consumabil invalid' });
    }
    const consumableId = idParse.data;
    const { quantity } = req.body;

    const addedQty = parseInt(quantity);
    if (isNaN(addedQty) || addedQty <= 0) {
      return res.status(400).json({ error: 'Cantitate trebuie să fie un număr pozitiv' });
    }

    const existing = await prisma.consumables.findUnique({ where: { id: consumableId } });
    if (!existing || existing.isDeleted) {
      return res.status(404).json({ error: 'Consumabil nu găsit' });
    }

    const [updated] = await prisma.$transaction([
      prisma.consumables.update({
        where: { id: consumableId },
        data: {
          quantity: { increment: addedQty },
          updatedAt: new Date(),
        },
      }),
      prisma.audit_logs.create({
        data: createAuditLogData(req.user.sub, 'UPDATE', 'consumables', consumableId, {
          name: existing.name,
          quantityAdded: addedQty,
          newQuantity: existing.quantity + addedQty,
        }),
      }),
    ]);

    res.json(updated);
  } catch (error) {
    console.error('Error adding consumable stock:', error);
    res.status(500).json({ error: 'Eroare la adaugarea stocului' });
  }
});

module.exports = router;
