const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Doar fișiere Excel sunt acceptate'), false);
    }
  },
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Helper: Log audit trail
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

// GET /api/annual-inventory/years — lista ani disponibili
router.get('/years', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const years = [];

    // Generate last 5 years + current
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }

    res.json(years);
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ error: 'Eroare la preluarea anilor' });
  }
});

// GET /api/annual-inventory/:year/status — status per secție
router.get('/:year/status', async (req, res) => {
  try {
    const { year } = req.params;
    const yearNum = parseInt(year);

    if (!yearNum || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ error: 'An invalid' });
    }

    // Get all sections
    const sections = await prisma.sections.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // For each section, get the annual inventory status
    const statusData = await Promise.all(
      sections.map(async (section) => {
        const inventory = await prisma.annual_inventories.findFirst({
          where: { year: yearNum, sectionId: section.id },
          include: { items: true },
        });

        if (!inventory) {
          // Not started
          const totalDevices = await prisma.devices.count({
            where: { sectionId: section.id, status: { not: 'CASAT' } },
          });

          return {
            sectionId: section.id,
            sectionName: section.name,
            status: 'NOT_STARTED',
            foundCount: 0,
            totalCount: totalDevices,
            percentage: 0,
            completedAt: null,
          };
        }

        const foundCount = inventory.items.filter(item => item.found).length;
        const totalCount = inventory.items.length;
        const percentage = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0;

        return {
          sectionId: section.id,
          sectionName: section.name,
          status: inventory.status,
          foundCount,
          totalCount,
          percentage,
          completedAt: inventory.completedAt,
        };
      })
    );

    res.json(statusData);
  } catch (error) {
    console.error('Error fetching annual inventory status:', error);
    res.status(500).json({ error: 'Eroare la preluarea status inventariere' });
  }
});

// POST /api/annual-inventory/:year/section/:sectionId — update checklist items
router.post('/:year/section/:sectionId', async (req, res) => {
  try {
    const { year, sectionId } = req.params;
    const { items } = req.body; // Array of { deviceId, found, locationFound }

    const yearNum = parseInt(year);
    const sectionIdNum = parseInt(sectionId);

    if (!yearNum || !sectionIdNum) {
      return res.status(400).json({ error: 'Parametri invalizi' });
    }

    // Get or create annual inventory
    let inventory = await prisma.annual_inventories.findFirst({
      where: { year: yearNum, sectionId: sectionIdNum },
      include: { items: true },
    });

    if (!inventory) {
      // Create new inventory with items for all devices in section
      const devices = await prisma.devices.findMany({
        where: { sectionId: sectionIdNum, status: { not: 'CASAT' } },
      });

      inventory = await prisma.annual_inventories.create({
        data: {
          year: yearNum,
          sectionId: sectionIdNum,
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
          items: {
            create: devices.map(device => ({
              deviceId: device.id,
              found: false,
            })),
          },
        },
        include: { items: true },
      });
    }

    // Update items based on request
    if (items && Array.isArray(items)) {
      for (const itemUpdate of items) {
        await prisma.inventory_check_items.updateMany({
          where: {
            inventoryId: inventory.id,
            deviceId: itemUpdate.deviceId,
          },
          data: {
            found: itemUpdate.found,
            locationFound: itemUpdate.locationFound || null,
          },
        });
      }
    }

    // Check if all items are found, if so mark as completed
    const updatedInventory = await prisma.annual_inventories.findUnique({
      where: { id: inventory.id },
      include: { items: true },
    });

    const allFound = updatedInventory.items.every(item => item.found);
    if (allFound && updatedInventory.status !== 'COMPLETED') {
      await prisma.annual_inventories.update({
        where: { id: inventory.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    await logAudit(req.user.id, 'UPDATE', 'annual_inventories', inventory.id, {
      year: yearNum,
      sectionId: sectionIdNum,
    });

    res.json(updatedInventory);
  } catch (error) {
    console.error('Error updating annual inventory:', error);
    res.status(500).json({ error: 'Eroare la actualizare inventariere' });
  }
});

// GET /api/annual-inventory/:year/discrepancies — lista discrepanțe
router.get('/:year/discrepancies', async (req, res) => {
  try {
    const { year } = req.params;
    const yearNum = parseInt(year);

    if (!yearNum) {
      return res.status(400).json({ error: 'An invalid' });
    }

    // Get all items not found for this year
    const discrepancies = await prisma.inventory_check_items.findMany({
      where: {
        found: false,
        inventory: { year: yearNum },
      },
      include: {
        inventory: {
          include: { section: true },
        },
        device: true,
      },
      orderBy: [{ inventory: { sectionId: 'asc' } }, { device: { name: 'asc' } }],
    });

    res.json(discrepancies);
  } catch (error) {
    console.error('Error fetching discrepancies:', error);
    res.status(500).json({ error: 'Eroare la preluarea discrepanțelor' });
  }
});

// POST /api/annual-inventory/:year/discrepancies/:id/verify — marchez pentru verificare
router.post('/:year/discrepancies/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id);

    if (!itemId) {
      return res.status(400).json({ error: 'ID invalid' });
    }

    const updated = await prisma.inventory_check_items.update({
      where: { id: itemId },
      data: { status: 'VERIFIED' },
      include: {
        inventory: {
          include: { section: true },
        },
        device: true,
      },
    });

    await logAudit(req.user.id, 'UPDATE', 'inventory_check_items', itemId, {
      status: 'VERIFIED',
    });

    res.json(updated);
  } catch (error) {
    console.error('Error verifying discrepancy:', error);
    res.status(500).json({ error: 'Eroare la marcarea discrepanței' });
  }
});

// GET /api/annual-inventory/:year/report-pdf — generate PDF report
router.get('/:year/report-pdf', async (req, res) => {
  try {
    const { year } = req.params;
    const yearNum = parseInt(year);

    if (!yearNum || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ error: 'An invalid' });
    }

    // Query discrepancies
    const discrepancies = await prisma.inventory_check_items.findMany({
      where: {
        found: false,
        inventory: { year: yearNum },
      },
      include: {
        device: { select: { inventoryNumber: true, name: true, status: true } },
        inventory: { select: { section: { select: { name: true } } } },
      },
      orderBy: [{ inventory: { sectionId: 'asc' } }, { device: { name: 'asc' } }],
    });

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Raport_Inventariere_${yearNum}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('RAPORT INVENTARIERE ANUALĂ', { align: 'center' });
    doc.fontSize(12).text(`An: ${yearNum}`, { align: 'center' });
    doc.text(`Data: ${new Date().toLocaleDateString('ro-RO')}`, { align: 'center' });
    doc.fontSize(9).font('Helvetica').text(
      'Conform Ordinului MS nr. 763/2023 și Procedurii MDM Nr. 1 (Ordinul MS nr. 889/2024)',
      { align: 'center' }
    );
    doc.moveDown(1);

    // Summary
    doc.fontSize(14).font('Helvetica-Bold').text('REZUMAT');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total discrepanțe: ${discrepancies.length}`, { indent: 20 });
    doc.moveDown(0.5);

    // Discrepancies section
    doc.fontSize(14).font('Helvetica-Bold').text('DISCREPANȚE IDENTIFICATE:');
    doc.fontSize(10).font('Helvetica');

    if (discrepancies.length === 0) {
      doc.text('✓ Nicio discrepanță găsită', { color: '#4ade80', indent: 20 });
    } else {
      discrepancies.forEach((item, idx) => {
        doc.text(`${idx + 1}. ${item.device.inventoryNumber} - ${item.device.name}`, {
          underline: true,
          indent: 20,
        });
        doc.text(`   Status: ${item.device.status}`, { indent: 40 });
        doc.text(`   Secție: ${item.inventory?.section?.name || 'N/A'}`, { indent: 40 });
        doc.text(`   Localizare găsită: ${item.locationFound || 'NEGĂSIT'}`, {
          indent: 40,
          color: '#f87171',
        });
        doc.moveDown(0.3);
      });
    }

    // Footer
    doc.moveDown(1);
    doc.fontSize(10).text('─'.repeat(80), { align: 'center' });
    doc.text(`Raport generat: ${new Date().toLocaleString('ro-RO')}`, {
      align: 'center',
      color: '#6b7280',
    });
    doc.text(`Utilizator: ${req.user.username}`, {
      align: 'center',
      color: '#6b7280',
    });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ error: 'Eroare la generarea raportului' });
  }
});

// POST /api/annual-inventory/import-fixed-assets — import Excel din contabilitate
router.post('/import-fixed-assets', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Niciun fișier încărcat' });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ error: 'Fișierul Excel este gol' });
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'Niciun rând în fișier' });
    }

    // Map columns: Cod → cndCode, Denumire → name, Valoare → acquisitionValue, DataInchidere → acquisitionDate
    let createdCount = 0;
    let updatedCount = 0;

    for (const row of data) {
      const cndCode = row['Cod'] || row['cod']?.toString();
      const name = row['Denumire'] || row['denumire'];
      const acquisitionValue = row['Valoare'] ? parseFloat(row['Valoare']) : null;
      const acquisitionDate = row['DataInchidere'] ? new Date(row['DataInchidere']) : null;

      if (!name || !cndCode) {
        // Skip rows without required fields
        continue;
      }

      // Check if device with this CND code exists
      const existing = await prisma.devices.findFirst({
        where: { cndCode: cndCode.toString() },
      });

      if (existing) {
        await prisma.devices.update({
          where: { id: existing.id },
          data: {
            acquisitionValue,
            acquisitionDate,
          },
        });
        updatedCount++;
      } else {
        // Create new device with a default section and status
        const defaultSection = await prisma.sections.findFirst({
          where: { isActive: true },
        });

        const inventoryNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        await prisma.devices.create({
          data: {
            inventoryNumber,
            cndCode: cndCode.toString(),
            name,
            acquisitionValue,
            acquisitionDate,
            status: 'FUNCTIONAL',
            sectionId: defaultSection?.id || null,
            updatedAt: new Date(),
          },
        });
        createdCount++;
      }
    }

    await logAudit(req.user.id, 'CREATE', 'devices_import', null, {
      createdCount,
      updatedCount,
      totalRows: data.length,
    });

    res.json({
      message: `Import completat: ${createdCount} adăugate, ${updatedCount} actualizate`,
      createdCount,
      updatedCount,
    });
  } catch (error) {
    console.error('Error importing fixed assets:', error);
    res.status(500).json({ error: 'Eroare la import fișier Excel' });
  }
});

module.exports = router;
