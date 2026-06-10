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
  operations: z.array(z.object({
    date: z.string().datetime().or(z.date()),
    timeStart: z.string().regex(/^\d{2}:\d{2}$/),
    timeEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    operation: z.string().min(1).max(500),
    engineer: z.string().min(1).max(255),
    signature: z.string().optional(),
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

    let ticket;
    let attempts = 0;
    
    while (attempts < 5) {
      try {
        // Generate ticket number and create ticket in transaction
        ticket = await prisma.$transaction(async (tx) => {
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
        
        break; // Success, break the retry loop
      } catch (err) {
        if (err.code === 'P2002') {
          attempts++;
          if (attempts >= 5) throw err;
          continue;
        }
        throw err;
      }
    }

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
      operations,
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
          operations: operations || null,
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

      // 2.5. Create entry in maintenance_records for unified audit trail
      if (newStatus === 'REZOLVAT') {
        let consumablesText = null;
        if (partsUsed && partsUsed.length > 0) {
          consumablesText = partsUsed.map(p => `${p.description} (${p.qty} buc)`).join(', ');
        }

        await tx.maintenance_records.create({
          data: {
            deviceId: ticket.deviceId,
            type: 'CORECTIVA',
            executedDate: new Date(),
            duration: durationHours ? parseFloat(durationHours) : null,
            description: `Reparatie efectuata de ${engineerName}. Raport: ${repairReport}`,
            partsReplaced: partsUsed ? JSON.stringify(partsUsed) : null,
            consumablesUsed: consumablesText,
            result: functionalTest === 'FUNCTIONAL' ? 'FUNCTIONAL' : 'DEFECT',
            cost: totalCost > 0 ? totalCost : null,
            performedById: req.user.sub,
            notes: actionsTaken || null,
            updatedAt: new Date(),
          },
        });
      }

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

// GET /api/repair-tickets/formular7-pdf - PDF Jurnal chemări (Formular Nr. 7, Anexa 23)
router.get('/formular7-pdf', async (req, res) => {
  try {
    const { from, to } = req.query;

    const where = {};
    if (from || to) {
      where.reportedAt = {};
      if (from) where.reportedAt.gte = new Date(from);
      if (to) where.reportedAt.lte = new Date(to);
    }

    const tickets = await prisma.repair_tickets.findMany({
      where,
      orderBy: { reportedAt: 'asc' },
      include: {
        device: {
          select: {
            name: true,
            inventoryNumber: true,
            sections: { select: { name: true } }
          }
        },
      },
    });

    const PDFDocument = require('pdfkit');
    const path = require('path');
    const pdf = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });

    // Inregistrare fonturi custom pentru suport diacritice românesti
    pdf.registerFont('Times-Roman-Custom', path.join(__dirname, '../assets/fonts/DejaVuSans.ttf'));
    pdf.registerFont('Times-Bold-Custom', path.join(__dirname, '../assets/fonts/DejaVuSans-Bold.ttf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Formular7-JurnalChemari.pdf"');
    pdf.pipe(res);

    // Titlu
    pdf.fontSize(13).font('Times-Bold-Custom')
      .text(toSafePdfText('JURNAL DE CHEMARI PENTRU REPARATII'), { align: 'center' });
    pdf.fontSize(9).font('Times-Roman-Custom')
      .text(toSafePdfText('Formular Nr. 7 - Anexa 23, Ghidul Bioinginerului (Ordinul MS nr. 889/2024)'), { align: 'center' });

    if (from || to) {
      const period = `Perioada: ${from ? new Date(from).toLocaleDateString('ro-RO') : '-'} - ${to ? new Date(to).toLocaleDateString('ro-RO') : '-'}`;
      pdf.fontSize(9).font('Times-Roman-Custom').text(toSafePdfText(period), { align: 'center' });
    }
    pdf.moveDown(0.5);

    // Dimensiuni coloane (landscape A4 = 841.89pt, margin 30 each side = 781.89 usable)
    const colWidths = [20, 60, 110, 110, 110, 50, 60, 110, 110, 30];
    const headers = [
      toSafePdfText('Nr.'),
      toSafePdfText('Data/ora'),
      toSafePdfText('Denumire DM / Cod'),
      toSafePdfText('Secție / Solicitant'),
      toSafePdfText('Defecțiune reclamată'),
      toSafePdfText('Prioritate'),
      toSafePdfText('Data rezolvare'),
      toSafePdfText('Măsuri întreprinse'),
      toSafePdfText('Inginer responsabil'),
      toSafePdfText('Stare')
    ];
    const startX = 30;
    let y = pdf.y;
    const rowH = 18;

    // Header tabel
    pdf.fontSize(7).font('Times-Bold-Custom');
    let x = startX;
    colWidths.forEach((w, i) => {
      pdf.rect(x, y, w, rowH).stroke();
      pdf.text(headers[i], x + 2, y + 4, { width: w - 4, lineBreak: false });
      x += w;
    });
    y += rowH;

    // Rânduri
    pdf.fontSize(7).font('Times-Roman-Custom');
    tickets.forEach((ticket, idx) => {
      x = startX;
      const stare = ['INCHIS', 'REZOLVAT', 'TESTAT'].includes(ticket.status) ? 'F' : 'N';
      
      const sectieNume = ticket.device?.sections?.name || '—';
      const solicitant = ticket.reportedBy || '—';
      const sectieSolicitant = `${sectieNume}\n/ ${solicitant}`;

      const row = [
        String(idx + 1),
        new Date(ticket.reportedAt).toLocaleDateString('ro-RO'),
        toSafePdfText(`${ticket.device?.name || ''}\n${ticket.device?.inventoryNumber || ''}`),
        toSafePdfText(sectieSolicitant),
        toSafePdfText(ticket.faultDescription.substring(0, 50)),
        toSafePdfText(ticket.priority),
        ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString('ro-RO') : '—',
        toSafePdfText(ticket.actionsTaken ? ticket.actionsTaken.substring(0, 50) : '—'),
        toSafePdfText(ticket.engineerName || '—'),
        toSafePdfText(stare),
      ];

      colWidths.forEach((w, i) => {
        pdf.rect(x, y, w, rowH).stroke();
        pdf.text(row[i], x + 2, y + 4, { width: w - 4, lineBreak: false, ellipsis: true });
        x += w;
      });
      y += rowH;

      // Pagină nouă dacă e nevoie
      if (y > 540) {
        pdf.addPage({ size: 'A4', layout: 'landscape' });
        y = 30;
      }
    });

    if (tickets.length === 0) {
      pdf.fontSize(10).font('Times-Roman-Custom').text(toSafePdfText('Nu exista chemari in perioada selectata.'), startX, y + 10);
    }

    // Footer
    pdf.fontSize(7).font('Times-Roman-Custom').text(
      toSafePdfText(`Total: ${tickets.length} chemari | Generat: ${new Date().toLocaleDateString('ro-RO')} | SIMDM`),
      { align: 'center' }
    );

    pdf.end();
  } catch (error) {
    console.error('Error generating Formular 7 PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea jurnalului PDF' });
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
            model: true,
            yearMade: true,
            countryOfOrigin: true,
            acquisitionDate: true,
            installationDate: true,
            warrantyEndDate: true,
            financingSource: true,
            destination: true,
            electricalSafetyClass: true,
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
    const path = require('path');
    const pdf = new PDFDocument({ size: 'A4' });

    pdf.registerFont('Times-Roman-Custom', path.join(__dirname, '../assets/fonts/DejaVuSans.ttf'));
    pdf.registerFont('Times-Bold-Custom', path.join(__dirname, '../assets/fonts/DejaVuSans-Bold.ttf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Formular-8-${ticket.ticketNumber}.pdf"`
    );

    pdf.pipe(res);

    // Title
    pdf.fontSize(14).font('Times-Bold-Custom').text(toSafePdfText('FIȘĂ DE DESERVIRE'), {
      align: 'center',
    });
    pdf.fontSize(10)
      .font('Times-Roman-Custom')
      .text(toSafePdfText('Formular Nr. 8 - Anexa 3, Procedura MDM Nr. 8'), { align: 'center' });
    pdf.moveDown(0.5);

    // Ticket header
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('1. Identificare Tichet'), {
      underline: true,
    });
    pdf.fontSize(10).font('Times-Roman-Custom');
    pdf.text(toSafePdfText(`Număr Tichet: ${ticket.ticketNumber}`));
    pdf.text(toSafePdfText(`Dată Raportare: ${new Date(ticket.reportedAt).toLocaleDateString('ro-RO')}`));
    pdf.text(toSafePdfText(`Prioritate: ${ticket.priority}`));
    pdf.text(toSafePdfText(`Status: ${ticket.status}`));
    pdf.moveDown(0.5);

    // Device info — expanded with passport fields per Anexa 2
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('2. Dispozitiv Medical — Pașaport'), {
      underline: true,
    });
    pdf.fontSize(10).font('Times-Roman-Custom');
    pdf.text(toSafePdfText(`Denumire: ${ticket.device.name}`));
    pdf.text(toSafePdfText(`Producător: ${ticket.device.manufacturer || 'N/A'}`));
    pdf.text(toSafePdfText(`Model: ${ticket.device.model || 'N/A'}`));
    pdf.text(toSafePdfText(`Anul de fabricație: ${ticket.device.yearMade || 'N/A'}`));
    pdf.text(toSafePdfText(`Nr. Serie: ${ticket.device.serialNumber || 'N/A'}`));
    pdf.text(toSafePdfText(`Nr. Inventar: ${ticket.device.inventoryNumber}`));
    pdf.text(toSafePdfText(`Clasa de risc: ${ticket.device.riskClass || 'N/A'}`));
    pdf.text(toSafePdfText(`Secția: ${ticket.device.sections?.name || 'N/A'}`));
    pdf.text(toSafePdfText(`Destinație: ${ticket.device.destination || 'N/A'}`));
    pdf.text(toSafePdfText(`Țara de origine: ${ticket.device.countryOfOrigin || 'N/A'}`));
    pdf.text(toSafePdfText(`Data achiziției: ${ticket.device.acquisitionDate ? new Date(ticket.device.acquisitionDate).toLocaleDateString('ro-RO') : 'N/A'}`));
    pdf.text(toSafePdfText(`Data instalării: ${ticket.device.installationDate ? new Date(ticket.device.installationDate).toLocaleDateString('ro-RO') : 'N/A'}`));
    pdf.text(toSafePdfText(`Garanție expirare: ${ticket.device.warrantyEndDate ? new Date(ticket.device.warrantyEndDate).toLocaleDateString('ro-RO') : 'N/A'}`));
    pdf.text(toSafePdfText(`Sursă finanțare: ${ticket.device.financingSource || 'N/A'}`));
    pdf.text(toSafePdfText(`Clasa IEC 60601: ${ticket.device.electricalSafetyClass || 'N/A'}`));
    pdf.moveDown(0.5);

    // Defect description
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('3. Descriere Defect'), {
      underline: true,
    });
    pdf.fontSize(10).font('Times-Roman-Custom').text(toSafePdfText(ticket.faultDescription));
    pdf.moveDown(0.5);

    // Defect cause
    if (ticket.faultCause) {
      pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('4. Cauza Defectului'), {
        underline: true,
      });
      pdf.fontSize(10).font('Times-Roman-Custom').text(toSafePdfText(ticket.faultCause));
      pdf.moveDown(0.5);
    }

    // Repair details
    if (ticket.actionsTaken) {
      pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('5. Măsuri Întreprinse'), {
        underline: true,
      });
      pdf.fontSize(10).font('Times-Roman-Custom').text(toSafePdfText(ticket.actionsTaken));
      pdf.moveDown(0.5);
    }

    // Operations table — detailed work log
    if (ticket.operations && Array.isArray(ticket.operations) && ticket.operations.length > 0) {
      pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('5a. Tabel Operații'), {
        underline: true,
      });
      pdf.fontSize(8).font('Times-Roman-Custom');

      const operColumns = [
        { header: 'Data', width: 60 },
        { header: 'Ora Început', width: 50 },
        { header: 'Ora Final', width: 50 },
        { header: 'Operație', width: 180 },
        { header: 'Responsabil', width: 80 },
      ];

      let opX = 30;
      const opHeaderY = pdf.y;
      const opRowH = 12;

      operColumns.forEach((col) => {
        pdf.rect(opX, opHeaderY, col.width, opRowH).stroke();
        pdf.text(col.header, opX + 2, opHeaderY + 3, { width: col.width - 4, fontSize: 7 });
        opX += col.width;
      });
      pdf.moveDown(1);

      ticket.operations.forEach((op) => {
        opX = 30;
        const opRowY = pdf.y;
        const opDate = typeof op.date === 'string' ? new Date(op.date) : op.date;
        const opDateStr = opDate.toLocaleDateString('ro-RO');
        const cells = [opDateStr, op.timeStart || '', op.timeEnd || '', op.operation || '', op.engineer || ''];

        operColumns.forEach((col, idx) => {
          pdf.rect(opX, opRowY, col.width, opRowH).stroke();
          pdf.text(cells[idx] || '', opX + 2, opRowY + 3, { width: col.width - 4, fontSize: 7, ellipsis: true });
          opX += col.width;
        });
        pdf.moveDown(0.8);
      });
      pdf.moveDown(0.3);
    }

    // Parts used
    if (ticket.partsUsed && Array.isArray(ticket.partsUsed)) {
      pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('6. Materiale Utilizate'), {
        underline: true,
      });
      pdf.fontSize(9).font('Times-Roman-Custom');
      ticket.partsUsed.forEach((part, idx) => {
        pdf.text(
          toSafePdfText(`${idx + 1}. ${part.description} - ${part.qty} x ${part.costUnit} MDL = ${part.qty * part.costUnit} MDL`)
        );
      });
      if (ticket.totalCost) {
        pdf.fontSize(10).font('Times-Bold-Custom').text(toSafePdfText(`Cost Total: ${ticket.totalCost} MDL`));
      }
      pdf.moveDown(0.5);
    }

    // Functional test
    if (ticket.functionalTest) {
      pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('7. Test Funcțional'), {
        underline: true,
      });
      pdf.fontSize(10).font('Times-Roman-Custom');
      const testResult = ticket.functionalTest === 'FUNCTIONAL'
        ? '[F] Dispozitiv Funcțional'
        : '[N] Dispozitiv Nefuncțional';
      pdf.text(toSafePdfText(testResult));
      pdf.moveDown(0.5);
    }

    // Observations/Notes
    if (ticket.repairReport) {
      pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('8. Raport Reparație'), {
        underline: true,
      });
      pdf.fontSize(10).font('Times-Roman-Custom').text(toSafePdfText(ticket.repairReport));
      pdf.moveDown(0.5);
    }

    // Signatures section
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('9. Semnături'), {
      underline: true,
    });
    pdf.fontSize(10).font('Times-Roman-Custom').text(toSafePdfText('Inginer Responsabil: _________________'));
    pdf.text(toSafePdfText(`(${ticket.engineerName || 'Nespecificat'})`));
    pdf.moveDown(0.5);

    if (ticket.managerSignature) {
      pdf.text(toSafePdfText('Manager/Supraveghetor: _________________'));
    }

    // Footer
    pdf.fontSize(8).font('Times-Roman-Custom').text(
      toSafePdfText(`Dată generare: ${new Date().toLocaleDateString('ro-RO')} | Formular Nr. 8 - Fișă de Deservire`),
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

    // Determinam contractul activ asociat dispozitivului pentru a prelua datele reale
    const activeContracts = await prisma.service_contracts.findMany({
      where: {
        endDate: { gte: new Date() }
      },
      include: {
        provider: true
      }
    });
    const activeContract = activeContracts.find(c => c.coveredDeviceIds.includes(ticket.deviceId));
    const providerName = activeContract?.provider?.name || 'Service Provider Extern';
    const contractNoStr = activeContract 
      ? `Contract nr. ${activeContract.contractNo} din ${new Date(activeContract.startDate).toLocaleDateString('ro-RO')}` 
      : 'Nespecificat';

    const PDFDocument = require('pdfkit');
    const path = require('path');
    const pdf = new PDFDocument({ size: 'A4' });

    pdf.registerFont('Times-Roman-Custom', path.join(__dirname, '../assets/fonts/DejaVuSans.ttf'));
    pdf.registerFont('Times-Bold-Custom', path.join(__dirname, '../assets/fonts/DejaVuSans-Bold.ttf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Formular9-${ticket.ticketNumber}.pdf"`
    );

    pdf.pipe(res);

    // Title
    pdf.fontSize(14).font('Times-Bold-Custom').text(toSafePdfText('ACT DE PREDARE-PRIMIRE'), {
      align: 'center',
    });
    pdf.fontSize(10)
      .font('Times-Roman-Custom')
      .text(toSafePdfText('Formular Nr. 9 – Anexa 21, Procedura MDM Nr. 4'), { align: 'center' });
    pdf.moveDown(0.5);

    // Header info
    pdf.fontSize(10).font('Times-Roman-Custom');
    pdf.text(
      toSafePdfText(`Nr. Act: ${ticket.ticketNumber} | Data: ${new Date(ticket.reportedAt).toLocaleDateString('ro-RO')}`)
    );
    pdf.moveDown(0.5);

    // Parties
    const hospitalName = process.env.HOSPITAL_NAME || 'Institutul de Sănătate';
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('Părți'), { underline: true });
    pdf.fontSize(10).font('Times-Roman-Custom');
    pdf.text(toSafePdfText(`Beneficiar (Instituție medicală): ${hospitalName}`), { indent: 20 });
    pdf.text(toSafePdfText(`Prestator de servicii: ${providerName}`), { indent: 20 });
    pdf.text(toSafePdfText(`Contract de service: ${contractNoStr}`), { indent: 20 });
    pdf.moveDown(0.5);

    // Ticket info
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('Informații Tichet'), { underline: true });
    pdf.fontSize(10).font('Times-Roman-Custom');
    pdf.text(toSafePdfText(`Nr. Tichet: ${ticket.ticketNumber}`));
    pdf.text(toSafePdfText(`Defecțiune raportată: ${ticket.faultDescription}`));
    if (ticket.faultCause) {
      pdf.text(toSafePdfText(`Cauza identificată: ${ticket.faultCause}`));
    }
    pdf.moveDown(0.5);

    // Device info
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('Dispozitiv Medical'), { underline: true });
    pdf.fontSize(10).font('Times-Roman-Custom');
    pdf.text(toSafePdfText(`Denumire: ${ticket.device.name}`));
    pdf.text(toSafePdfText(`Producător: ${ticket.device.manufacturer || 'N/A'}`));
    pdf.text(toSafePdfText(`Nr. Serie: ${ticket.device.serialNumber || 'N/A'}`));
    pdf.text(toSafePdfText(`Nr. Inventar: ${ticket.device.inventoryNumber}`));
    pdf.moveDown(0.5);

    // Physical condition
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('Starea Fizică la Predare'), { underline: true });
    pdf.fontSize(10).font('Times-Roman-Custom');
    pdf.text(toSafePdfText('(Descriere calitativă a stării dispozitivului):'), { indent: 20 });
    const stareaFizica = ticket.repairReport 
      ? `Conform raportului: ${ticket.repairReport}` 
      : 'Dispozitivul prezintă defectul semnalat; fără alte deteriorări mecanice vizibile extern.';
    pdf.text(toSafePdfText(stareaFizica), { indent: 20 });
    pdf.moveDown(0.5);

    // Included items
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('Piese și Consumabile Utilizate'), { underline: true });
    pdf.fontSize(10).font('Times-Roman-Custom');
    if (ticket.partsUsed && Array.isArray(ticket.partsUsed) && ticket.partsUsed.length > 0) {
      ticket.partsUsed.forEach((part, idx) => {
        pdf.text(
          toSafePdfText(`${idx + 1}. ${part.description} - ${part.qty} buc (Cost: ${part.costUnit} MDL/buc)`),
          { indent: 20 }
        );
      });
    } else {
      pdf.text(toSafePdfText('Nu s-au înregistrat piese/consumabile suplimentare din stoc.'), { indent: 20 });
    }
    pdf.moveDown(1);

    // Signatures
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('Semnături Predare / Recepție'), { underline: true });
    pdf.moveDown(0.3);

    // Faza I: Predare spre service
    pdf.fontSize(10).font('Times-Bold-Custom').text(toSafePdfText('Faza I: Predarea dispozitivului pentru reparație'));
    pdf.fontSize(9).font('Times-Roman-Custom');
    pdf.text(toSafePdfText('Predat de (Beneficiar - Bioinginer):'), { indent: 10 });
    pdf.text(toSafePdfText('Semnătura: _________________________ Nume: _________________ Data: __________'), {
      indent: 20,
    });
    pdf.moveDown(0.2);
    pdf.text(toSafePdfText('Primit de (Prestator - Reprezentant):'), { indent: 10 });
    pdf.text(toSafePdfText('Semnătura: _________________________ Nume: _________________ Data: __________'), {
      indent: 20,
    });
    pdf.moveDown(0.5);

    // Faza II: Recepție din service (după reparație)
    pdf.fontSize(10).font('Times-Bold-Custom').text(toSafePdfText('Faza II: Recepția dispozitivului reparat și testat'));
    pdf.fontSize(9).font('Times-Roman-Custom');
    pdf.text(toSafePdfText('Returnat de (Prestator - Reprezentant):'), { indent: 10 });
    pdf.text(toSafePdfText('Semnătura: _________________________ Nume: _________________ Data: __________'), {
      indent: 20,
    });
    pdf.moveDown(0.2);
    pdf.text(toSafePdfText('Primit și verificat de (Beneficiar - Bioinginer):'), { indent: 10 });
    pdf.text(toSafePdfText(`Semnătura: _________________________ Nume: ${ticket.engineerName || '_________________'} Data: __________`), {
      indent: 20,
    });
    pdf.moveDown(0.8);

    // Footer
    pdf.fontSize(8).font('Times-Roman-Custom').text(
      toSafePdfText(`Data generării: ${new Date().toLocaleDateString('ro-RO')} | Formular Nr. 9 – Act de predare-primire`),
      { align: 'center' }
    );

    pdf.end();
  } catch (error) {
    console.error('Error generating handover PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea PDF-ului' });
  }
});

// Helper: Return text as-is since custom TTF fonts support Romanian diacritics natively
function toSafePdfText(str) {
  return str || '';
}

module.exports = router;
