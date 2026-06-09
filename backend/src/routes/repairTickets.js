const express = require('express');
const { z } = require('zod');
const prisma = require('../db');

const router = express.Router();

// Zod schemas
const idSchema = z.coerce.number().int().positive();
const createTicketSchema = z.object({
  deviceId: z.coerce.number().int().positive(),
  sectionId: z.coerce.number().int().positive().optional(),
  reportedBy: z.string().min(1).max(255),
  faultDescription: z.string().min(1).max(2000),
  priority: z.enum(['SCAZUT', 'NORMAL', 'RIDICAT', 'URGENT']).default('NORMAL'),
});

const triageSchema = z.object({
  repairType: z.enum(['INTERN', 'EXTERN']),
  defectCause: z.string().min(1).max(500),
  externalProviderId: z.coerce.number().int().positive().optional(),
});

const repairSchema = z.object({
  repairReport: z.string().min(1).max(2000),
  actionsTaken: z.string().min(1).max(2000),
  durationHours: z.coerce.number().positive(),
  partsUsed: z.array(z.object({
    description: z.string().min(1),
    qty: z.coerce.number().int().positive(),
    costUnit: z.coerce.number().positive(),
  })).optional(),
  functionalTest: z.enum(['FUNCTIONAL', 'NEFUNCTIONAL']),
  engineerName: z.string().min(1).max(255),
  engineerSignature: z.string().optional(), // Base64
  managerSignature: z.string().optional(), // Base64
  beforePhoto: z.string().optional(), // Base64
  afterPhoto: z.string().optional(), // Base64
});

const statusTransitionSchema = z.object({
  newStatus: z.enum(['DESCHIS', 'IN_LUCRU', 'REZOLVAT', 'TESTAT', 'INCHIS', 'ESCALADAT']),
});

// State machine: valid transitions
const STATUS_FLOW = {
  'DESCHIS': ['IN_LUCRU', 'ESCALADAT'],
  'IN_LUCRU': ['REZOLVAT', 'DESCHIS', 'ESCALADAT'],
  'REZOLVAT': ['TESTAT', 'IN_LUCRU', 'ESCALADAT'],
  'TESTAT': ['INCHIS', 'IN_LUCRU', 'ESCALADAT'],
  'INCHIS': ['ESCALADAT'],
  'ESCALADAT': ['IN_LUCRU', 'DESCHIS'],
};

// Generate unique ticket number (TKT-YYYY-NNNN)
async function generateTicketNumber() {
  const year = new Date().getFullYear();
  const latestTicket = await prisma.repair_tickets.findFirst({
    where: {
      ticketNumber: {
        startsWith: `TKT-${year}-`,
      },
    },
    orderBy: { id: 'desc' },
  });

  let sequence = 1;
  if (latestTicket) {
    const match = latestTicket.ticketNumber.match(/TKT-\d+-(\d+)/);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }

  return `TKT-${year}-${String(sequence).padStart(4, '0')}`;
}

// POST /api/repair-tickets - Create ticket (raportare defecțiune)
router.post('/', async (req, res) => {
  try {
    const parseBody = createTicketSchema.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({
        error: 'Validare eșuată',
        details: parseBody.error.flatten().fieldErrors,
      });
    }

    const { deviceId, sectionId, reportedBy, faultDescription, priority } = parseBody.data;

    // Verify device exists
    const device = await prisma.devices.findUnique({ where: { id: deviceId } });
    if (!device) {
      return res.status(404).json({ error: 'Dispozitivul nu există' });
    }

    // Generate ticket number and create ticket in transaction
    const ticket = await prisma.$transaction(async (tx) => {
      const ticketNumber = await generateTicketNumber();

      const created = await tx.repair_tickets.create({
        data: {
          ticketNumber,
          deviceId,
          sectionId: sectionId || null,
          reportedBy,
          faultDescription,
          priority,
          status: 'DESCHIS',
          createdById: req.user.sub,
          updatedAt: new Date(),
        },
      });

      // Update device status to DEFECT
      await tx.devices.update({
        where: { id: deviceId },
        data: { status: 'DEFECT' },
      });

      // Create audit log
      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'CREATE',
          entity: 'repair_tickets',
          entityId: String(created.id),
          changes: {
            ticketNumber,
            deviceId,
            priority,
            faultDescription: faultDescription.substring(0, 100),
          },
        },
      });

      return created;
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating repair ticket:', error);
    res.status(500).json({ error: 'Eroare la crearea tichetului' });
  }
});

// PATCH /api/repair-tickets/:id/status - State machine
router.patch('/:id/status', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID tichet invalid' });
    }

    const parseBody = statusTransitionSchema.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({
        error: 'Status invalid',
        details: parseBody.error.flatten().fieldErrors,
      });
    }

    const ticketId = idParse.data;
    const { newStatus } = parseBody.data;

    const ticket = await prisma.repair_tickets.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Tichet nu găsit' });
    }

    // Validate state machine transition
    const validTransitions = STATUS_FLOW[ticket.status] || [];
    if (!validTransitions.includes(newStatus)) {
      return res.status(400).json({
        error: `Tranziție invalidă: ${ticket.status} → ${newStatus}`,
        validTransitions,
      });
    }

    // Update ticket in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
      };

      // Mark resolved time when status = REZOLVAT
      if (newStatus === 'REZOLVAT') {
        updateData.resolvedAt = new Date();
      }

      // Update device back to FUNCTIONAL when status = INCHIS
      if (newStatus === 'INCHIS') {
        await tx.devices.update({
          where: { id: ticket.deviceId },
          data: { status: 'FUNCTIONAL' },
        });
      }

      const upd = await tx.repair_tickets.update({
        where: { id: ticketId },
        data: updateData,
      });

      // Create audit log
      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'UPDATE',
          entity: 'repair_tickets',
          entityId: String(ticketId),
          changes: {
            statusFrom: ticket.status,
            statusTo: newStatus,
          },
        },
      });

      return upd;
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Eroare la actualizarea statusului' });
  }
});

// PATCH /api/repair-tickets/:id/triage - Triage (defect cause + repair type)
router.patch('/:id/triage', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID tichet invalid' });
    }

    const parseBody = triageSchema.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({
        error: 'Validare eșuată',
        details: parseBody.error.flatten().fieldErrors,
      });
    }

    const ticketId = idParse.data;
    const { repairType, defectCause, externalProviderId } = parseBody.data;

    const ticket = await prisma.repair_tickets.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Tichet nu găsit' });
    }

    // If external repair, verify provider exists
    if (repairType === 'EXTERN' && externalProviderId) {
      const provider = await prisma.service_providers.findUnique({
        where: { id: externalProviderId },
      });
      if (!provider) {
        return res.status(404).json({ error: 'Furnizor nu găsit' });
      }
    }

    // Update ticket with triage info and move to IN_LUCRU
    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.repair_tickets.update({
        where: { id: ticketId },
        data: {
          faultCause: defectCause,
          externalized: repairType === 'EXTERN',
          status: 'IN_LUCRU',
          updatedAt: new Date(),
        },
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'UPDATE',
          entity: 'repair_tickets',
          entityId: String(ticketId),
          changes: {
            repairType,
            faultCause: defectCause,
            status: 'IN_LUCRU',
          },
        },
      });

      return upd;
    });

    res.json(updated);
  } catch (error) {
    console.error('Error triaging ticket:', error);
    res.status(500).json({ error: 'Eroare la triaj' });
  }
});

// PUT /api/repair-tickets/:id/repair - Internal repair (Formular Nr. 8)
router.put('/:id/repair', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID tichet invalid' });
    }

    const parseBody = repairSchema.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({
        error: 'Validare eșuată',
        details: parseBody.error.flatten().fieldErrors,
      });
    }

    const ticketId = idParse.data;
    const {
      repairReport,
      actionsTaken,
      durationHours,
      partsUsed,
      functionalTest,
      engineerName,
      engineerSignature,
      managerSignature,
      beforePhoto,
      afterPhoto,
    } = parseBody.data;

    const ticket = await prisma.repair_tickets.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Tichet nu găsit' });
    }

    // Calculate total cost from parts
    let totalCost = 0;
    if (partsUsed && Array.isArray(partsUsed)) {
      totalCost = partsUsed.reduce((sum, part) => sum + part.qty * part.costUnit, 0);
    }

    // Update ticket with repair info in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Decrement consumables from stock
      if (partsUsed && partsUsed.length > 0) {
        for (const part of partsUsed) {
          const consumable = await tx.consumables.findFirst({
            where: {
              name: { contains: part.description, mode: 'insensitive' },
            },
          });

          if (consumable && consumable.quantity >= part.qty) {
            await tx.consumables.update({
              where: { id: consumable.id },
              data: {
                quantity: { decrement: part.qty },
                updatedAt: new Date(),
              },
            });
          }
        }
      }

      // 2. Update ticket with repair details
      const newStatus = functionalTest === 'FUNCTIONAL' ? 'REZOLVAT' : 'IN_LUCRU';
      const upd = await tx.repair_tickets.update({
        where: { id: ticketId },
        data: {
          repairReport,
          actionsTaken,
          durationHours: durationHours ? parseFloat(durationHours) : null,
          partsUsed: partsUsed || null,
          totalCost: totalCost > 0 ? totalCost : null,
          functionalTest,
          beforePhoto: beforePhoto || null,
          afterPhoto: afterPhoto || null,
          engineerName,
          engineerSignature: engineerSignature || null,
          managerSignature: managerSignature || null,
          status: newStatus,
          resolvedAt: newStatus === 'REZOLVAT' ? new Date() : null,
          updatedAt: new Date(),
        },
      });

      // 3. Create audit log
      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'UPDATE',
          entity: 'repair_tickets',
          entityId: String(ticketId),
          changes: {
            durationHours,
            partsCount: partsUsed?.length || 0,
            totalCost,
            functionalTest,
            status: newStatus,
          },
        },
      });

      return upd;
    });

    res.json(updated);
  } catch (error) {
    console.error('Error repairing ticket:', error);
    res.status(500).json({ error: 'Eroare la înregistrarea reparației' });
  }
});

// GET /api/repair-tickets - List with filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, priority, deviceId } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status && STATUS_FLOW[status]) where.status = status;
    if (priority && ['SCAZUT', 'NORMAL', 'RIDICAT', 'URGENT'].includes(priority)) {
      where.priority = priority;
    }
    if (deviceId) where.deviceId = parseInt(deviceId);

    const [tickets, total] = await Promise.all([
      prisma.repair_tickets.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { reportedAt: 'desc' },
        include: {
          device: { select: { id: true, name: true, inventoryNumber: true } },
        },
      }),
      prisma.repair_tickets.count({ where }),
    ]);

    res.json({
      data: tickets,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Eroare la preluarea tichetelor' });
  }
});

// GET /api/repair-tickets/:id - Get details
router.get('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID tichet invalid' });
    }

    const ticket = await prisma.repair_tickets.findUnique({
      where: { id: idParse.data },
      include: {
        device: { select: { id: true, name: true, inventoryNumber: true, riskClass: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Tichet nu găsit' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Eroare la preluarea tichetului' });
  }
});

// GET /api/repair-tickets/:id/formular8-pdf - PDF Formular Nr. 8
router.get('/:id/formular8-pdf', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID tichet invalid' });
    }

    const ticket = await prisma.repair_tickets.findUnique({
      where: { id: idParse.data },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            inventoryNumber: true,
            riskClass: true,
            manufacturer: true,
            sectionId: true,
            sections: { select: { name: true } },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Tichet nu găsit' });
    }

    const PDFDocument = require('pdfkit');
    const pdf = new PDFDocument({ size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Formular-8-${ticket.ticketNumber}.pdf"`
    );

    pdf.pipe(res);

    // Title
    pdf.fontSize(14).font('Helvetica-Bold').text('FIȘĂ DE DESERVIRE', {
      align: 'center',
    });
    pdf.fontSize(10)
      .font('Helvetica')
      .text('Formular Nr. 8 – Anexa 3, Procedura MDM Nr. 8', { align: 'center' });
    pdf.moveDown(0.5);

    // Ticket header
    pdf.fontSize(11).font('Helvetica-Bold').text('1. Identificare Tichet', {
      underline: true,
    });
    pdf.fontSize(10).font('Helvetica');
    pdf.text(`Număr Tichet: ${ticket.ticketNumber}`);
    pdf.text(`Data Raportării: ${new Date(ticket.reportedAt).toLocaleDateString('ro-RO')}`);
    pdf.text(`Prioritate: ${ticket.priority}`);
    pdf.text(`Status: ${ticket.status}`);
    pdf.moveDown(0.5);

    // Device info
    pdf.fontSize(11).font('Helvetica-Bold').text('2. Dispozitiv Medical', {
      underline: true,
    });
    pdf.fontSize(10).font('Helvetica');
    pdf.text(`Denumire: ${ticket.device.name}`);
    pdf.text(`Nr. Serie: ${ticket.device.serialNumber || 'N/A'}`);
    pdf.text(`Nr. Inventar: ${ticket.device.inventoryNumber}`);
    pdf.text(`Secția: ${ticket.device.sections?.name || 'N/A'}`);
    pdf.moveDown(0.5);

    // Defect description
    pdf.fontSize(11).font('Helvetica-Bold').text('3. Descriere Defect', {
      underline: true,
    });
    pdf.fontSize(10).font('Helvetica').text(ticket.faultDescription);
    pdf.moveDown(0.5);

    // Defect cause
    if (ticket.faultCause) {
      pdf.fontSize(11).font('Helvetica-Bold').text('4. Cauza Defectului', {
        underline: true,
      });
      pdf.fontSize(10).font('Helvetica').text(ticket.faultCause);
      pdf.moveDown(0.5);
    }

    // Repair details
    if (ticket.actionsTaken) {
      pdf.fontSize(11).font('Helvetica-Bold').text('5. Măsuri Întreprinse', {
        underline: true,
      });
      pdf.fontSize(10).font('Helvetica').text(ticket.actionsTaken);
      pdf.moveDown(0.5);
    }

    // Parts used
    if (ticket.partsUsed && Array.isArray(ticket.partsUsed)) {
      pdf.fontSize(11).font('Helvetica-Bold').text('6. Materiale Utilizate', {
        underline: true,
      });
      pdf.fontSize(9).font('Helvetica');
      ticket.partsUsed.forEach((part, idx) => {
        pdf.text(
          `${idx + 1}. ${part.description} - ${part.qty} × ${part.costUnit} MDL = ${part.qty * part.costUnit} MDL`
        );
      });
      if (ticket.totalCost) {
        pdf.fontSize(10).font('Helvetica-Bold').text(`Cost Total: ${ticket.totalCost} MDL`);
      }
      pdf.moveDown(0.5);
    }

    // Functional test
    if (ticket.functionalTest) {
      pdf.fontSize(11).font('Helvetica-Bold').text('7. Test Funcțional', {
        underline: true,
      });
      pdf.fontSize(10).font('Helvetica');
      const testResult = ticket.functionalTest === 'FUNCTIONAL'
        ? '✓ Dispozitiv Funcțional'
        : '✗ Dispozitiv Nefuncțional';
      pdf.text(testResult);
      pdf.moveDown(0.5);
    }

    // Observations/Notes
    if (ticket.repairReport) {
      pdf.fontSize(11).font('Helvetica-Bold').text('8. Raport Reparație', {
        underline: true,
      });
      pdf.fontSize(10).font('Helvetica').text(ticket.repairReport);
      pdf.moveDown(0.5);
    }

    // Signatures section
    pdf.fontSize(11).font('Helvetica-Bold').text('9. Semnări', {
      underline: true,
    });
    pdf.fontSize(10).font('Helvetica').text('Inginer Responsabil: _________________');
    pdf.text(`(${ticket.engineerName || 'Nespecificat'})`);
    pdf.moveDown(0.5);

    if (ticket.managerSignature) {
      pdf.text('Manager/Supraveghetor: _________________');
    }

    // Footer
    pdf.fontSize(8).text(
      `Data generării: ${new Date().toLocaleDateString('ro-RO')} | Formular Nr. 8 – Fișă de Deservire`,
      { align: 'center' }
    );

    pdf.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea PDF-ului' });
  }
});

// GET /api/repair-tickets/:id/handover-pdf - PDF Formular Nr. 9 (Act predare-primire)
router.get('/:id/handover-pdf', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID tichet invalid' });
    }

    const ticket = await prisma.repair_tickets.findUnique({
      where: { id: idParse.data },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            inventoryNumber: true,
            manufacturer: true,
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Tichet nu găsit' });
    }

    if (!ticket.externalized) {
      return res.status(400).json({ error: 'Tichetul nu este o reparație externă' });
    }

    const PDFDocument = require('pdfkit');
    const pdf = new PDFDocument({ size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Formular9-${ticket.ticketNumber}.pdf"`
    );

    pdf.pipe(res);

    // Title
    pdf.fontSize(14).font('Helvetica-Bold').text('ACT DE PREDARE-PRIMIRE', {
      align: 'center',
    });
    pdf.fontSize(10)
      .font('Helvetica')
      .text('Formular Nr. 9 – Anexa 21, Procedura MDM Nr. 9', { align: 'center' });
    pdf.moveDown(0.5);

    // Header info
    pdf.fontSize(10).font('Helvetica');
    pdf.text(
      `Nr. Act: ${ticket.ticketNumber} | Data: ${new Date(ticket.reportedAt).toLocaleDateString('ro-RO')}`
    );
    pdf.moveDown(0.5);

    // Parties
    pdf.fontSize(11).font('Helvetica-Bold').text('Părți', { underline: true });
    pdf.fontSize(10).font('Helvetica');
    pdf.text('Beneficiar (Instituție medicală): Institutul de sănătate', { indent: 20 });
    pdf.text('Prestator de servicii: Service Provider', { indent: 20 });
    pdf.moveDown(0.5);

    // Ticket info
    pdf.fontSize(11).font('Helvetica-Bold').text('Informații Tichet', { underline: true });
    pdf.fontSize(10).font('Helvetica');
    pdf.text(`Nr. Tichet: ${ticket.ticketNumber}`);
    pdf.text(`Defecțiune raportată: ${ticket.faultDescription}`);
    if (ticket.faultCause) {
      pdf.text(`Cauza identificată: ${ticket.faultCause}`);
    }
    pdf.moveDown(0.5);

    // Device info
    pdf.fontSize(11).font('Helvetica-Bold').text('Dispozitiv Medical', { underline: true });
    pdf.fontSize(10).font('Helvetica');
    pdf.text(`Denumire: ${ticket.device.name}`);
    pdf.text(`Producător: ${ticket.device.manufacturer || 'N/A'}`);
    pdf.text(`Nr. Serie: ${ticket.device.serialNumber || 'N/A'}`);
    pdf.text(`Nr. Inventar: ${ticket.device.inventoryNumber}`);
    pdf.moveDown(0.5);

    // Physical condition
    pdf.fontSize(11).font('Helvetica-Bold').text('Starea Fizică la Predare', { underline: true });
    pdf.fontSize(10).font('Helvetica');
    pdf.text('(Descriere calitatoare a stării dispozitivului):', { indent: 20 });
    pdf.text('_______________________________________________________________________________');
    pdf.text('_______________________________________________________________________________');
    pdf.moveDown(0.5);

    // Included items
    pdf.fontSize(11).font('Helvetica-Bold').text('Materiale/Consumabile Incluse', { underline: true });
    pdf.fontSize(10).font('Helvetica');
    pdf.text(
      '(Lista completă a articolelor incluse în pachetul de reparație)',
      { indent: 20 }
    );
    pdf.text('_______________________________________________________________________________');
    pdf.text('_______________________________________________________________________________');
    pdf.moveDown(1);

    // Signatures
    pdf.fontSize(11).font('Helvetica-Bold').text('Semnări', { underline: true });
    pdf.moveDown(0.3);

    // Handed over by
    pdf.fontSize(9).font('Helvetica').text('Predat de (Bioingineri):', { indent: 20 });
    pdf.text('Semnătură: _________________________ Nume: _________________ Data: __________', {
      indent: 30,
    });
    pdf.moveDown(0.5);

    // Received by
    pdf.fontSize(9).font('Helvetica').text('Primit de (Furnizor):', { indent: 20 });
    pdf.text('Semnătură: _________________________ Nume: _________________ Data: __________', {
      indent: 30,
    });
    pdf.moveDown(1);

    // Footer
    pdf.fontSize(8).text(
      `Data generării: ${new Date().toLocaleDateString('ro-RO')} | Formular Nr. 9 – Act de predare-primire`,
      { align: 'center' }
    );

    pdf.end();
  } catch (error) {
    console.error('Error generating handover PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea PDF-ului' });
  }
});

module.exports = router;
