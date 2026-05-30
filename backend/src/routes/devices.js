const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');
const { antivirusMiddleware } = require('../middleware/antivirus');

// Rate limiter for exports
const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.EXPORT_RATE_LIMIT_MAX || 10),
  message: { error: 'Prea multe exporturi. Încearcă peste 15 minute.' },
  standardHeaders: true,
  skip: (req) => process.env.NODE_ENV === 'development' && req.query.skip_ratelimit === 'true',
});

// Validation schemas
const VALID_STATUSES = ['FUNCTIONAL', 'IN_REPARATIE', 'DEFECT', 'CASAT', 'IMPRUMUTAT', 'REZERVA'];
const VALID_CLASSES = ['I', 'IIa', 'IIb', 'III'];
const VALID_CURRENCIES = ['MDL', 'USD', 'EUR', 'RON'];

const deviceCreateSchema = z.object({
  inventoryNumber: z.string().regex(/^[A-Z0-9\-]+$/, 'Doar litere majuscule, cifre și liniuțe'),
  name: z.string().min(3, 'Minim 3 caractere'),
  riskClass: z.enum(VALID_CLASSES),
  sectionId: z.coerce.number().int().min(1),
  status: z.enum(VALID_STATUSES).default('FUNCTIONAL'),
  serialNumber: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  countryOfOrigin: z.string().optional().nullable(),
  yearMade: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  ceMarking: z.string().optional().nullable(),
  cndCode: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  acquisitionDate: z.coerce.date().optional().nullable(),
  warrantyEndDate: z.coerce.date().optional().nullable(),
  acquisitionValue: z.coerce.number().min(0).optional().nullable(),
  residualValue: z.coerce.number().min(0).optional().nullable(),
  currency: z.enum(VALID_CURRENCIES).default('MDL'),
  voltage: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  power: z.string().optional().nullable(),
  accessories: z.string().optional().nullable(),
  maintenanceFreq: z.coerce.number().int().min(1).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const deviceUpdateSchema = deviceCreateSchema.partial().omit({ inventoryNumber: true });

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Setup Multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads/devices');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    cb(null, `${timestamp}-${random}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tip fișier neacceptat'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ENDPOINT 1: GET /dropdown/sections — pentru form dropdown
router.get('/dropdown/sections', async (req, res) => {
  try {
    const sections = await prisma.sections.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Eroare la preluarea secțiilor' });
  }
});

// ENDPOINT 2: GET /export/xlsx — export Excel (cu filtre)
router.get('/export/xlsx', exportLimiter, async (req, res) => {
  try {
    const { search, status, riskClass, sectionId } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { inventoryNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (riskClass) where.riskClass = riskClass;
    if (sectionId) where.sectionId = parseInt(sectionId);

    const devices = await prisma.devices.findMany({
      where,
      include: { sections: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const data = devices.map(d => ({
      'Inv. Nr.': d.inventoryNumber,
      'Denumire': d.name,
      'Model': d.model || '',
      'Producător': d.manufacturer || '',
      'Clasa Risc': d.riskClass || '',
      'Status': d.status,
      'Secție': d.sections?.name || '',
      'Data Achiziție': d.acquisitionDate ? d.acquisitionDate.toISOString().split('T')[0] : '',
      'Valoare': d.acquisitionValue || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventar DM');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Dispozitive_DM.xlsx"');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting XLSX:', error);
    res.status(500).json({ error: 'Eroare la export Excel' });
  }
});

// ENDPOINT 3: GET /export/csv — export CSV (cu filtre)
router.get('/export/csv', exportLimiter, async (req, res) => {
  try {
    const { search, status, riskClass, sectionId } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { inventoryNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (riskClass) where.riskClass = riskClass;
    if (sectionId) where.sectionId = parseInt(sectionId);

    const devices = await prisma.devices.findMany({
      where,
      include: { sections: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Dispozitive_DM.csv"');

    // BOM UTF-8 pentru diacritice în Excel
    res.write('﻿');
    res.write('Inv. Nr.,Denumire,Model,Producător,Clasa Risc,Status,Secție,Data Achiziție,Valoare\n');

    devices.forEach(d => {
      res.write(`"${d.inventoryNumber}","${d.name}","${d.model || ''}","${d.manufacturer || ''}","${d.riskClass || ''}","${d.status}","${d.sections?.name || ''}","${d.acquisitionDate ? d.acquisitionDate.toISOString().split('T')[0] : ''}","${d.acquisitionValue || ''}"\n`);
    });

    res.end();
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Eroare la export CSV' });
  }
});

// ENDPOINT 4: GET / — lista cu filtre + paginare
router.get('/', async (req, res) => {
  try {
    const rawPage = Math.max(parseInt(req.query.page) || 1, 1);
    const rawLimit = Math.min(parseInt(req.query.limit) || 50, 1000);
    const skip = (rawPage - 1) * rawLimit;

    const { search, status, riskClass, sectionId, includeCasat } = req.query;
    const where = {};

    // Default: exclude CASAT devices unless explicitly requested
    if (includeCasat !== 'true') {
      where.status = { not: 'CASAT' };
    }

    // Apply filters (explicit status overrides the default filter)
    if (search) {
      where.OR = [
        { inventoryNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (riskClass) where.riskClass = riskClass;
    if (sectionId) where.sectionId = parseInt(sectionId);

    const [devices, total] = await Promise.all([
      prisma.devices.findMany({
        where,
        include: { sections: { select: { name: true } } },
        skip,
        take: rawLimit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.devices.count({ where }),
    ]);

    const pages = Math.ceil(total / rawLimit);
    res.json({
      devices,
      pagination: {
        page: rawPage,
        limit: rawLimit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Eroare la preluarea dispozitivelor' });
  }
});

// ENDPOINT 5: POST / — criere DM
router.post('/', async (req, res) => {
  try {
    const parsed = deviceCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Date invalide',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    // Check for duplicate inventory number
    const existing = await prisma.devices.findUnique({ where: { inventoryNumber: data.inventoryNumber } });
    if (existing) {
      return res.status(409).json({ error: 'Numărul inventarului există deja' });
    }

    const device = await prisma.devices.create({
      data: {
        ...data,
        createdById: req.user.sub,
        updatedAt: new Date(),
      },
      include: { sections: { select: { name: true } } },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        userId: req.user.sub,
        action: 'CREATE',
        entity: 'Device',
        entityId: String(device.id),
        changes: { created: device },
      },
    });

    res.status(201).json(device);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ error: 'Eroare la crearea dispozitivului' });
  }
});

// ENDPOINT 6: GET /:id — detalii DM
router.get('/:id', async (req, res) => {
  try {
    const device = await prisma.devices.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        sections: { select: { id: true, name: true } },
        maintenanceRecords: { take: 5, orderBy: { executedDate: 'desc' } },
        incidents: { take: 5, orderBy: { occurredAt: 'desc' } },
      },
    });

    if (!device) {
      return res.status(404).json({ error: 'Dispozitiv nu găsit' });
    }

    res.json(device);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Eroare la preluarea dispozitivului' });
  }
});

// ENDPOINT 7: PUT /:id — actualizare DM
router.put('/:id', async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);

    const parsed = deviceUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Date invalide',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const updateData = parsed.data;

    // Get old device for audit log
    const oldDevice = await prisma.devices.findUnique({ where: { id: deviceId } });
    if (!oldDevice) {
      return res.status(404).json({ error: 'Dispozitiv nu găsit' });
    }

    const device = await prisma.devices.update({
      where: { id: deviceId },
      data: updateData,
      include: { sections: { select: { name: true } } },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        userId: req.user.sub,
        action: 'UPDATE',
        entity: 'Device',
        entityId: String(device.id),
        changes: {
          before: oldDevice,
          after: device,
        },
      },
    });

    res.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: 'Eroare la actualizarea dispozitivului' });
  }
});

// ENDPOINT 8: DELETE /:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);

    const device = await prisma.devices.update({
      where: { id: deviceId },
      data: {
        status: 'CASAT',
        decommissionDate: new Date(),
      },
      include: { sections: { select: { name: true } } },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        userId: req.user.sub,
        action: 'DELETE',
        entity: 'Device',
        entityId: String(device.id),
        changes: { status: 'CASAT' },
      },
    });

    res.json({ message: 'Dispozitiv casat cu succes', device });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Eroare la casat dispozitiv' });
  }
});

// ENDPOINT 9: POST /:id/upload — upload fișier (cu antivirus scan)
router.post('/:id/upload', upload.single('file'), antivirusMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nu s-a găsit fișier' });
    }

    const deviceId = parseInt(req.params.id);
    const fileUrl = `/uploads/devices/${req.file.filename}`;

    const device = await prisma.devices.update({
      where: { id: deviceId },
      data: { manualUrl: fileUrl },
    });

    // Audit log for file upload with scan result
    const scanInfo = req.fileScanResult ? ` [Scanned: ${req.fileScanResult.mimeType}]` : '';
    await prisma.audit_logs.create({
      data: {
        userId: req.user.sub,
        action: 'FILE_UPLOAD',
        entity: 'Device',
        entityId: String(device.id),
        changes: {
          filename: req.file.originalname,
          size: req.file.size,
          mimeType: req.fileScanResult?.mimeType || req.file.mimetype,
          clamavScanned: req.fileScanResult?.clamavScanned || false,
          timestamp: req.fileScanResult?.timestamp,
        },
      },
    });

    res.json({
      message: `Fișier încărcat cu succes${scanInfo}`,
      device,
      fileUrl,
      scan: req.fileScanResult,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Eroare la încărcarea fișierului' });
  }
});

// ENDPOINT 10: GET /:id/fisa-pdf — generare PDF
router.get('/:id/fisa-pdf', exportLimiter, async (req, res) => {
  try {
    const device = await prisma.devices.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { sections: { select: { name: true } } },
    });

    if (!device) {
      return res.status(404).json({ error: 'Dispozitiv nu găsit' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Fisa_DM_${device.inventoryNumber}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('FIȘĂ DISPOZITIV MEDICAL', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Formular Nr. 8 – Anexa 3, Ordinul MS nr. 889/2024', { align: 'center' });
    doc.moveDown();

    // Section 1: Identification
    doc.fontSize(12).font('Helvetica-Bold').text('1. IDENTIFICARE');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Numărul Inventarului: ${device.inventoryNumber}`);
    doc.text(`Denumire: ${device.name}`);
    doc.text(`Seria: ${device.serialNumber || '—'}`);
    doc.text(`Model: ${device.model || '—'}`);
    doc.text(`Producător: ${device.manufacturer || '—'}`);
    doc.text(`Țara de origine: ${device.countryOfOrigin || '—'}`);
    doc.moveDown();

    // Section 2: Classification
    doc.fontSize(12).font('Helvetica-Bold').text('2. CLASIFICARE');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Clasa de risc: ${device.riskClass || '—'}`);
    doc.text(`Marcaj CE: ${device.ceMarking || '—'}`);
    doc.text(`Cod CND: ${device.cndCode || '—'}`);
    doc.moveDown();

    // Section 3: Status & Operation
    doc.fontSize(12).font('Helvetica-Bold').text('3. STATUS & EXPLOATARE');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Status: ${device.status}`);
    doc.text(`Secție: ${device.sections?.name || '—'}`);
    doc.text(`Cameră/Locație: ${device.room || '—'}`);
    doc.text(`Frecvență mentenanță: ${device.maintenanceFreq ? device.maintenanceFreq + ' zile' : '—'}`);
    doc.moveDown();

    // Section 4: Financial Data
    doc.fontSize(12).font('Helvetica-Bold').text('4. DATE FINANCIARE');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Data achiziției: ${device.acquisitionDate ? device.acquisitionDate.toLocaleDateString('ro-RO') : '—'}`);
    doc.text(`Valoare achiziție: ${device.acquisitionValue ? device.acquisitionValue + ' ' + device.currency : '—'}`);
    doc.text(`Valoare reziduală: ${device.residualValue || '—'}`);
    doc.text(`Garanție până la: ${device.warrantyEndDate ? device.warrantyEndDate.toLocaleDateString('ro-RO') : '—'}`);
    doc.moveDown();

    // Section 5: Technical Data
    doc.fontSize(12).font('Helvetica-Bold').text('5. DATE TEHNICE');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Tensiune: ${device.voltage || '—'}`);
    doc.text(`Frecvență: ${device.frequency || '—'}`);
    doc.text(`Putere: ${device.power || '—'}`);
    doc.text(`Accesorii: ${device.accessories || '—'}`);
    doc.moveDown();

    // Section 6: Notes
    if (device.notes) {
      doc.fontSize(12).font('Helvetica-Bold').text('6. OBSERVAȚII');
      doc.fontSize(10).font('Helvetica').text(device.notes);
      doc.moveDown();
    }

    // Footer
    doc.fontSize(8).text(`Generat: ${new Date().toLocaleString('ro-RO')} | Utilizator: ${req.user.username}`, {
      align: 'center',
    });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea PDF' });
  }
});

module.exports = router;
