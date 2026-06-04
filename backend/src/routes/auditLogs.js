const express = require('express');
const prisma = require('../db');

const router = express.Router();

// GET /api/audit-logs — lista paginata cu filtre
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, entity, action, dateFrom, dateTo } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (entity) where.entity = entity;
    if (action) where.action = action;

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { timestamp: 'desc' },
        include: {
          users: { select: { id: true, username: true, fullName: true } },
        },
      }),
      prisma.audit_logs.count({ where }),
    ]);

    res.json({
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Eroare la preluarea jurnalului de audit' });
  }
});

// GET /api/audit-logs/export/csv — descarca CSV
router.get('/export/csv', async (req, res) => {
  try {
    const { entity, action, dateFrom, dateTo } = req.query;

    const where = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    const logs = await prisma.audit_logs.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10000,
      include: {
        users: { select: { username: true, fullName: true } },
      },
    });

    const header = ['ID', 'Data/Ora', 'Utilizator', 'Actiune', 'Entitate', 'ID Entitate', 'Adresa IP', 'Modificari'];
    const rows = logs.map((log) => {
      const user = log.users ? `${log.users.username}${log.users.fullName ? ' (' + log.users.fullName + ')' : ''}` : 'sistem';
      const changes = log.changes ? JSON.stringify(log.changes).replace(/"/g, '""') : '';
      return [
        log.id,
        new Date(log.timestamp).toLocaleString('ro-RO'),
        user,
        log.action,
        log.entity,
        log.entityId || '',
        log.ipAddress || '',
        `"${changes}"`,
      ].join(',');
    });

    const csv = [header.join(','), ...rows].join('\n');
    const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('﻿' + csv); // BOM pentru Excel
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Eroare la exportul jurnalului de audit' });
  }
});

module.exports = router;
