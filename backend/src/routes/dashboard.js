const express = require('express');
const { z } = require('zod');
const prisma = require('../db');

const router = express.Router();

// GET /api/dashboard/summary — agregat complet KPI
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      devicesByStatus,
      devicesByRisk,
      mppDue,
      mppOverdue,
      verificationsExpiring,
      verificationsExpired,
      incidentsOpen,
      incidentsAmdm,
      ticketsOpen,
      ticketsInProgress,
      documentsExpiring,
      contractsExpiring,
      consumablesLow,
    ] = await Promise.all([
      prisma.devices.groupBy({ by: ['status'], _count: { id: true }, where: { status: { not: 'CASAT' } } }),
      prisma.devices.groupBy({ by: ['riskClass'], _count: { id: true }, where: { status: { not: 'CASAT' }, riskClass: { not: null } } }),
      prisma.mpp_occurrences.count({ where: { status: 'PROGRAMAT', scheduledDate: { gte: now, lte: in7Days } } }),
      prisma.mpp_occurrences.count({ where: { status: 'PROGRAMAT', scheduledDate: { lt: now } } }),
      prisma.verifications.count({ where: { validUntil: { gte: now, lte: in30Days } } }),
      prisma.verifications.count({ where: { validUntil: { lt: now } } }),
      prisma.incidents.count({ where: { status: 'DESCHIS' } }),
      prisma.incidents.count({ where: { reportedToAmdm: false, status: { not: 'INCHIS' } } }),
      prisma.repair_tickets.count({ where: { status: 'DESCHIS' } }),
      prisma.repair_tickets.count({ where: { status: 'IN_LUCRU' } }),
      prisma.documents.count({ where: { isDeleted: false, isCurrent: true, validUntil: { not: null, gte: now, lte: in30Days } } }),
      prisma.service_contracts.count({ where: { endDate: { gte: now, lte: in30Days } } }),
      prisma.consumables.count({ where: { isDeleted: false, quantity: { lt: prisma.consumables.fields.minQuantity } } }).catch(() => 0),
    ]);

    const devicesStatusMap = {};
    devicesByStatus.forEach((r) => { devicesStatusMap[r.status] = r._count.id; });
    const devicesRiskMap = {};
    devicesByRisk.forEach((r) => { devicesRiskMap[r.riskClass || 'NESPECIFICAT'] = r._count.id; });

    const totalActiveDevices = Object.values(devicesStatusMap).reduce((a, b) => a + b, 0);

    const summary = {
      devices: {
        total: totalActiveDevices,
        byStatus: {
          FUNCTIONAL: devicesStatusMap.FUNCTIONAL || 0,
          IN_REPARATIE: devicesStatusMap.IN_REPARATIE || 0,
          DEFECT: devicesStatusMap.DEFECT || 0,
          CONSERVAT: devicesStatusMap.CONSERVAT || 0,
          IMPRUMUTAT: devicesStatusMap.IMPRUMUTAT || 0,
          REZERVA: devicesStatusMap.REZERVA || 0,
        },
        byRisk: devicesRiskMap,
      },
      maintenance: {
        dueSoon: mppDue,
        overdue: mppOverdue,
      },
      verifications: {
        expiringIn30Days: verificationsExpiring,
        expired: verificationsExpired,
      },
      incidents: {
        open: incidentsOpen,
        pendingAmdm: incidentsAmdm,
      },
      tickets: {
        open: ticketsOpen,
        inProgress: ticketsInProgress,
      },
      documents: {
        expiringIn30Days: documentsExpiring,
      },
      contracts: {
        expiringIn30Days: contractsExpiring,
      },
      consumables: {
        lowStock: consumablesLow,
      },
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Eroare la preluarea datelor dashboard' });
  }
});

// GET /api/dashboard/cost-summary — cost intern vs extern
router.get('/cost-summary', async (req, res) => {
  try {
    const yearParam = parseInt(req.query.year);
    const year = (!isNaN(yearParam) && yearParam >= 2020 && yearParam <= 2099) ? yearParam : new Date().getFullYear();

    const fromDate = new Date(year, 0, 1);
    const toDate = new Date(year, 11, 31, 23, 59, 59);

    const [internalResult, externalResult] = await Promise.all([
      prisma.repair_tickets.aggregate({
        where: { reportedAt: { gte: fromDate, lte: toDate }, status: 'INCHIS' },
        _sum: { totalCost: true },
        _count: { id: true },
      }),
      prisma.service_contracts.aggregate({
        where: { startDate: { lte: toDate }, endDate: { gte: fromDate } },
        _sum: { value: true },
        _count: { id: true },
      }),
    ]);

    res.json({
      year,
      internal: {
        totalCost: Number(internalResult._sum.totalCost) || 0,
        count: internalResult._count.id,
      },
      external: {
        totalCost: Number(externalResult._sum.value) || 0,
        count: externalResult._count.id,
      },
    });
  } catch (error) {
    console.error('Error fetching cost summary:', error);
    res.status(500).json({ error: 'Eroare la calculul costurilor' });
  }
});

module.exports = router;
