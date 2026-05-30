const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');

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

// ENDPOINT 2: GET /export/xlsx — export Excel
router.get('/export/xlsx', async (req, res) => {
  try {
    const devices = await prisma.devices.findMany({
      include: { sections: { select: { name: true } } },
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
    XLSX.utils.book_append_sheet(wb, ws, 'Dispozitive');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Dispozitive_DM.xlsx"');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting XLSX:', error);
    res.status(500).json({ error: 'Eroare la export Excel' });
  }
});

// ENDPOINT 3: GET /export/csv — export CSV
router.get('/export/csv', async (req, res) => {
  try {
    const devices = await prisma.devices.findMany({
      include: { sections: { select: { name: true } } },
    });

    let csv = 'Inv. Nr.,Denumire,Model,Producător,Clasa Risc,Status,Secție,Data Achiziție,Valoare\n';
    devices.forEach(d => {
      csv += `"${d.inventoryNumber}","${d.name}","${d.model || ''}","${d.manufacturer || ''}","${d.riskClass || ''}","${d.status}","${d.sections?.name || ''}","${d.acquisitionDate ? d.acquisitionDate.toISOString().split('T')[0] : ''}","${d.acquisitionValue || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Dispozitive_DM.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Eroare la export CSV' });
  }
});

// ENDPOINT 4: GET / — lista cu filtre + paginare
router.get('/', async (req, res) => {
  try {
    const { search, status, riskClass, sectionId, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

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

    const [devices, total] = await Promise.all([
      prisma.devices.findMany({
        where,
        include: { sections: { select: { name: true } } },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.devices.count({ where }),
    ]);

    const pages = Math.ceil(total / parseInt(limit));
    res.json({
      devices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages,
      },
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Eroare la preluarea dispozitivelor' });
  }
});

// ENDPOINT 5: POST / — creare DM
router.post('/', async (req, res) => {
  try {
    const { inventoryNumber, name, riskClass, sectionId, status = 'FUNCTIONAL', ...rest } = req.body;

    // Validate required fields
    if (!inventoryNumber || !name || !riskClass || !sectionId) {
      return res.status(400).json({ error: 'Câmpuri obligatorii lipsă' });
    }

    // Check for duplicate inventory number
    const existing = await prisma.devices.findUnique({ where: { inventoryNumber } });
    if (existing) {
      return res.status(409).json({ error: 'Numărul inventarului există deja' });
    }

    const device = await prisma.devices.create({
      data: {
        inventoryNumber,
        name,
        riskClass,
        sectionId: parseInt(sectionId),
        status,
        createdById: req.user.sub,
        ...rest,
      },
      include: { sections: { select: { name: true } } },
    });

    // Audit log
    await prisma.auditLog.create({
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
    const { inventoryNumber, ...updateData } = req.body;

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
    await prisma.auditLog.create({
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
    await prisma.auditLog.create({
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

// ENDPOINT 9: POST /:id/upload — upload fișier
router.post('/:id/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nu s-a găsit fișier' });
    }

    const deviceId = parseInt(req.params.id);
    const fileUrl = `/uploads/devices/${req.file.filename}`;

    const device = await prisma.devices.update({
      where: { id: deviceId },
      data: { manualUrl: fileUrl }, // or another URL field based on file type
    });

    res.json({ message: 'Fișier încărcat cu succes', device, fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Eroare la încărcarea fișierului' });
  }
});

// ENDPOINT 10: GET /:id/fisa-pdf — generare PDF
router.get('/:id/fisa-pdf', async (req, res) => {
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
