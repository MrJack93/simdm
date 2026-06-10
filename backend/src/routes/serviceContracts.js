const express = require('express');
const { z } = require('zod');
const prisma = require('../db');

const router = express.Router();

// Zod schemas
const idSchema = z.coerce.number().int().positive();

const createProviderSchema = z.object({
  name: z.string().min(1).max(255),
  contact: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
});

const createContractSchema = z.object({
  providerId: z.coerce.number().int().positive(),
  contractNo: z.string().min(1).max(100),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  value: z.coerce.number().positive().optional(),
  currency: z.string().default('MDL'),
  slaHours: z.coerce.number().int().positive().optional(),
  scope: z.string().max(1000).optional(),
  coveredDeviceIds: z.array(z.coerce.number().int().positive()).default([]),
});

const rateProviderSchema = z.object({
  score: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// POST /api/service-contracts/providers - Create service provider
router.post('/providers', async (req, res) => {
  try {
    const parseBody = createProviderSchema.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({
        error: 'Validare eșuată',
        details: parseBody.error.flatten().fieldErrors,
      });
    }

    const { name, contact, email, phone } = parseBody.data;

    const provider = await prisma.$transaction(async (tx) => {
      const created = await tx.service_providers.create({
        data: {
          name,
          contact: contact || null,
          email: email || null,
          phone: phone || null,
          updatedAt: new Date(),
        },
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'CREATE',
          entity: 'service_providers',
          entityId: String(created.id),
          changes: { name, contact, email },
        },
      });

      return created;
    });

    res.status(201).json(provider);
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).json({ error: 'Eroare la crearea furnizorului' });
  }
});

// POST /api/service-contracts/contracts - Create service contract
router.post('/contracts', async (req, res) => {
  try {
    const parseBody = createContractSchema.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({
        error: 'Validare eșuată',
        details: parseBody.error.flatten().fieldErrors,
      });
    }

    const {
      providerId,
      contractNo,
      startDate,
      endDate,
      value,
      currency,
      slaHours,
      scope,
      coveredDeviceIds,
    } = parseBody.data;

    // Verify provider exists
    const provider = await prisma.service_providers.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Furnizor nu găsit' });
    }

    // Create contract in transaction
    const contract = await prisma.$transaction(async (tx) => {
      const created = await tx.service_contracts.create({
        data: {
          providerId,
          contractNo,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          value: value ? parseFloat(value.toString()) : null,
          currency,
          slaHours: slaHours || null,
          scope: scope || null,
          coveredDeviceIds: coveredDeviceIds || [],
          updatedAt: new Date(),
        },
        include: {
          provider: { select: { id: true, name: true } },
        },
      });

      // Audit log
      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'CREATE',
          entity: 'service_contracts',
          entityId: String(created.id),
          changes: {
            contractNo,
            providerId,
            value,
            coveredDeviceCount: coveredDeviceIds?.length || 0,
          },
        },
      });

      return created;
    });

    res.status(201).json(contract);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Eroare la crearea contractului' });
  }
});

// GET /api/service-contracts/contracts - List contracts with daysUntilExpiry
router.get('/contracts', async (req, res) => {
  try {
    const { page = 1, limit = 50, providerId, status } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: 'Paginare invalidă' });
    }

    const where = {};
    if (providerId) where.providerId = parseInt(providerId);

    const contracts = await prisma.service_contracts.findMany({
      where,
      include: {
        provider: { select: { id: true, name: true, ratingAvg: true } },
      },
      orderBy: { endDate: 'asc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    const total = await prisma.service_contracts.count({ where });

    // Calculate daysUntilExpiry for each contract
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const contractsWithDays = contracts.map((contract) => {
      const endDate = new Date(contract.endDate);
      endDate.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...contract,
        daysUntilExpiry: daysLeft,
        isExpired: daysLeft < 0,
        expiresIn: daysLeft,
      };
    });

    res.json({
      data: contractsWithDays,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error listing contracts:', error);
    res.status(500).json({ error: 'Eroare la preluarea contractelor' });
  }
});

// POST /api/service-contracts/providers/:id/rate - Rate provider
router.post('/providers/:id/rate', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID furnizor invalid' });
    }

    const parseBody = rateProviderSchema.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({
        error: 'Validare eșuată',
        details: parseBody.error.flatten().fieldErrors,
      });
    }

    const providerId = idParse.data;
    const { score, comment } = parseBody.data;

    // Verify provider exists
    const provider = await prisma.service_providers.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Furnizor nu găsit' });
    }

    // Create rating and update provider average in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create rating
      const rating = await tx.provider_ratings.create({
        data: {
          providerId,
          score,
          comment: comment || null,
        },
      });

      // Calculate new average
      const allRatings = await tx.provider_ratings.findMany({
        where: { providerId },
        select: { score: true },
      });

      const avgScore =
        allRatings.length > 0
          ? allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length
          : null;

      // Update provider rating
      const updatedProvider = await tx.service_providers.update({
        where: { id: providerId },
        data: {
          ratingAvg: avgScore ? parseFloat(avgScore.toFixed(2)) : null,
          updatedAt: new Date(),
        },
      });

      // Audit log
      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'CREATE',
          entity: 'provider_ratings',
          entityId: String(rating.id),
          changes: {
            score,
            newAverage: updatedProvider.ratingAvg,
          },
        },
      });

      return { rating, provider: updatedProvider };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error rating provider:', error);
    res.status(500).json({ error: 'Eroare la evaluarea furnizorului' });
  }
});

// GET /api/service-contracts/cost-analysis - Cost comparison (internal vs external)
router.get('/cost-analysis', async (req, res) => {
  try {
    // Get internal repair costs (internal repair tickets)
    const internalRepairs = await prisma.repair_tickets.findMany({
      where: {
        status: { in: ['REZOLVAT', 'TESTAT', 'INCHIS'] },
      },
      select: { totalCost: true },
    });

    const internalStats = {
      totalCost: internalRepairs.reduce(
        (sum, ticket) => sum + (ticket.totalCost ? parseFloat(ticket.totalCost.toString()) : 0),
        0
      ),
      count: internalRepairs.length,
    };

    // Get external contract costs
    const contracts = await prisma.service_contracts.findMany({
      select: { value: true, endDate: true },
    });

    const externalStats = {
      totalValue: contracts.reduce(
        (sum, contract) => sum + (contract.value ? parseFloat(contract.value.toString()) : 0),
        0
      ),
      contractCount: contracts.length,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeContracts = contracts.filter(c => new Date(c.endDate) >= today).length;
    const expiredContracts = contracts.length - activeContracts;

    // Sume per furnizor
    const providers = await prisma.service_providers.findMany({
      include: {
        contracts: { select: { value: true } },
      },
    });

    const byProvider = providers.map(p => ({
      providerId: p.id,
      providerName: p.name,
      totalValue: p.contracts.reduce(
        (sum, c) => sum + (c.value ? parseFloat(c.value.toString()) : 0),
        0
      ),
      contractCount: p.contracts.length,
    }));

    // Calculate comparison
    const analysis = {
      internal: internalStats,
      external: externalStats,
      comparison: {
        internalAvgPerRepair:
          internalStats.count > 0 ? (internalStats.totalCost / internalStats.count).toFixed(2) : '0.00',
        externalAvgPerContract:
          externalStats.contractCount > 0
            ? (externalStats.totalValue / externalStats.contractCount).toFixed(2)
            : '0.00',
        savings:
          (externalStats.totalValue - internalStats.totalCost).toFixed(2),
      },
      byProvider,
      contractStatus: {
        active: activeContracts,
        expired: expiredContracts,
      },
    };

    res.json(analysis);
  } catch (error) {
    console.error('Error generating cost analysis:', error);
    res.status(500).json({ error: 'Eroare la analiza costurilor' });
  }
});

// GET /api/service-contracts/providers - List all providers with ratings
router.get('/providers', async (req, res) => {
  try {
    const providers = await prisma.service_providers.findMany({
      include: {
        _count: {
          select: { contracts: true, ratings: true },
        },
      },
      orderBy: { ratingAvg: { sort: 'desc', nulls: 'last' } },
    });

    res.json(providers);
  } catch (error) {
    console.error('Error listing providers:', error);
    res.status(500).json({ error: 'Eroare la preluarea furnizorilor' });
  }
});

// GET /api/service-contracts/providers/:id - Get provider details
router.get('/providers/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID furnizor invalid' });
    }

    const provider = await prisma.service_providers.findUnique({
      where: { id: idParse.data },
      include: {
        contracts: {
          select: { id: true, contractNo: true, startDate: true, endDate: true, value: true },
        },
        ratings: {
          select: { score: true, comment: true, createdAt: true },
        },
      },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Furnizor nu găsit' });
    }

    res.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ error: 'Eroare la preluarea furnizorului' });
  }
});

// DELETE /api/service-contracts/contracts/:id - Delete contract
router.delete('/contracts/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID contract invalid' });
    }

    const contractId = idParse.data;

    const contract = await prisma.service_contracts.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract nu găsit' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.service_contracts.delete({
        where: { id: contractId },
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'DELETE',
          entity: 'service_contracts',
          entityId: String(contractId),
          changes: { contractNo: contract.contractNo },
        },
      });
    });

    res.json({ message: 'Contract șters cu succes' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ error: 'Eroare la ștergerea contractului' });
  }
});

// DELETE /api/service-contracts/providers/:id - Delete provider
router.delete('/providers/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID furnizor invalid' });
    }

    const providerId = idParse.data;

    const provider = await prisma.service_providers.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Furnizor nu găsit' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.service_providers.delete({
        where: { id: providerId },
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'DELETE',
          entity: 'service_providers',
          entityId: String(providerId),
          changes: { name: provider.name },
        },
      });
    });

    res.json({ message: 'Furnizor șters cu succes' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({ error: 'Eroare la ștergerea furnizorului' });
  }
});

module.exports = router;
