const express = require('express');
const { z } = require('zod');
const prisma = require('../db');

const router = express.Router();

// Zod schemas
const idSchema = z.coerce.number().int().positive();
const createExecutionSchema = z.object({
  deviceId: z.coerce.number().int().positive(),
  occurrenceId: z.coerce.number().int().positive().optional(),
  executedDate: z.coerce.date(),
  durationMinutes: z.coerce.number().int().positive().optional(),
  checklist: z.array(z.object({
    operatiune: z.string().min(1),
    bifat: z.boolean(),
    nota: z.string().optional(),
  })),
  consumablesUsed: z.array(z.object({
    consumableId: z.coerce.number().int().positive(),
    qty: z.coerce.number().int().positive(),
  })).optional(),
  result: z.enum(['FUNCTIONAL', 'DEFECT']),
  engineerName: z.string().min(1).max(255),
  signature: z.string().optional(), // base64 dataURL
  notes: z.string().optional(),
});

// Standard checklist template (6 operații)
const STANDARD_CHECKLIST = [
  { operatiune: 'Inspecție vizuală și curățare', bifat: false, nota: '' },
  { operatiune: 'Testare funcționalități principale', bifat: false, nota: '' },
  { operatiune: 'Verificare legări electrice și securitate', bifat: false, nota: '' },
  { operatiune: 'Control calibrare și preciziune (dacă aplicabil)', bifat: false, nota: '' },
  { operatiune: 'Actualizare documentație și evidență', bifat: false, nota: '' },
  { operatiune: 'Testare finală și semnare', bifat: false, nota: '' },
];

// GET /api/mpp-executions/checklist-template/:deviceId
router.get('/checklist-template/:deviceId', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.deviceId);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID dispozitiv invalid' });
    }

    const deviceId = idParse.data;
    const device = await prisma.devices.findUnique({
      where: { id: deviceId },
      select: { id: true, name: true, model: true },
    });

    if (!device) {
      return res.status(404).json({ error: 'Dispozitivul nu există' });
    }

    // Return standard template (în viitor, poate lookup pe model)
    res.json({
      deviceId,
      deviceName: device.name,
      model: device.model,
      checklist: STANDARD_CHECKLIST,
      note: 'Template generic - poate fi personalizat pentru model specific',
    });
  } catch (error) {
    console.error('Error fetching checklist template:', error);
    res.status(500).json({ error: 'Eroare la preluarea template-ului' });
  }
});

// POST /api/mpp-executions
router.post('/', async (req, res) => {
  try {
    const parseBody = createExecutionSchema.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({
        error: 'Validare eșuată',
        details: parseBody.error.flatten().fieldErrors,
      });
    }

    const {
      deviceId,
      occurrenceId,
      executedDate,
      durationMinutes,
      checklist,
      consumablesUsed,
      result,
      engineerName,
      signature,
      notes,
    } = parseBody.data;

    // Verify device exists
    const device = await prisma.devices.findUnique({ where: { id: deviceId } });
    if (!device) {
      return res.status(404).json({ error: 'Dispozitivul nu există' });
    }

    // If occurrenceId provided, verify it exists and belongs to this device
    let occurrence = null;
    if (occurrenceId) {
      occurrence = await prisma.mpp_occurrences.findUnique({
        where: { id: occurrenceId },
      });
      if (!occurrence || occurrence.deviceId !== deviceId) {
        return res.status(404).json({ error: 'Ocurența nu aparține acestui dispozitiv' });
      }
    }

    // ATOMIC TRANSACTION
    const execution = await prisma.$transaction(async (tx) => {
      // 1. Create execution
      const created = await tx.mpp_executions.create({
        data: {
          deviceId,
          occurrenceId: occurrenceId || null,
          executedDate: new Date(executedDate),
          durationMinutes: durationMinutes || null,
          checklist,
          consumablesUsed: consumablesUsed || null,
          result,
          engineerName,
          signature: signature || null,
          notes: notes || null,
          createdById: req.user.sub,
        },
      });

      // 2. Update occurrence status if provided
      if (occurrence) {
        await tx.mpp_occurrences.update({
          where: { id: occurrenceId },
          data: {
            status: 'EFECTUAT',
            executionId: created.id,
          },
        });
      }

      // 3. Update device: lastMaintenanceAt and recalculate nextMaintenanceAt
      const nextDate = new Date(executedDate);
      if (device.maintenanceFreq) {
        nextDate.setMonth(nextDate.getMonth() + device.maintenanceFreq);
      }

      await tx.devices.update({
        where: { id: deviceId },
        data: {
          lastMaintenanceAt: new Date(executedDate),
          nextMaintenanceAt: device.maintenanceFreq ? nextDate : null,
        },
      });

      // 4. Decrement consumables from stock
      if (consumablesUsed && consumablesUsed.length > 0) {
        for (const consumable of consumablesUsed) {
          const stock = await tx.consumables.findUnique({
            where: { id: consumable.consumableId },
          });

          if (!stock) {
            throw new Error(`Consumabil ID ${consumable.consumableId} nu există`);
          }

          if (stock.quantity < consumable.qty) {
            throw new Error(
              `Stoc insuficient pentru ${stock.name}: disponibil ${stock.quantity}, cerut ${consumable.qty}`
            );
          }

          await tx.consumables.update({
            where: { id: consumable.consumableId },
            data: {
              quantity: { decrement: consumable.qty },
              updatedAt: new Date(),
            },
          });
        }
      }

      // 5. Create audit log
      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'CREATE',
          entity: 'mpp_executions',
          entityId: String(created.id),
          changes: {
            deviceId,
            executedDate: executedDate.toISOString(),
            result,
            consumablesUsed: consumablesUsed?.length || 0,
          },
        },
      });

      return created;
    });

    // Return execution with status indicator
    res.status(201).json({
      ...execution,
      defectDetected: result === 'DEFECT',
      message:
        result === 'DEFECT'
          ? 'Defect detectat - recomandare: deschideți tichet corectiv'
          : 'Mentenanță preventivă completată cu succes',
    });
  } catch (error) {
    console.error('Error creating MPP execution:', error);

    // Check for specific error messages from transaction
    if (error.message.includes('Consumabil')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Stoc insuficient')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Eroare la crearea execuției' });
  }
});

// GET /api/mpp-executions/:id
router.get('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID execuție invalid' });
    }

    const execution = await prisma.mpp_executions.findUnique({
      where: { id: idParse.data },
      include: {
        device: { select: { id: true, name: true, inventoryNumber: true } },
      },
    });

    if (!execution) {
      return res.status(404).json({ error: 'Execuție nu găsită' });
    }

    res.json(execution);
  } catch (error) {
    console.error('Error fetching execution:', error);
    res.status(500).json({ error: 'Eroare la preluarea execuției' });
  }
});

// GET /api/mpp-executions (list with filters)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, deviceId, result } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (deviceId) where.deviceId = parseInt(deviceId);
    if (result && ['FUNCTIONAL', 'DEFECT'].includes(result)) where.result = result;

    const [executions, total] = await Promise.all([
      prisma.mpp_executions.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { executedDate: 'desc' },
        include: {
          device: { select: { id: true, name: true, inventoryNumber: true } },
        },
      }),
      prisma.mpp_executions.count({ where }),
    ]);

    res.json({
      data: executions,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error fetching executions:', error);
    res.status(500).json({ error: 'Eroare la preluarea execuțiilor' });
  }
});

// DELETE /api/mpp-executions/:id (soft - mark as cancelled, revert stock)
router.delete('/:id', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID execuție invalid' });
    }

    const executionId = idParse.data;
    const execution = await prisma.mpp_executions.findUnique({
      where: { id: executionId },
    });

    if (!execution) {
      return res.status(404).json({ error: 'Execuție nu găsită' });
    }

    // ATOMIC TRANSACTION: revert stock + delete execution + revert occurrence
    await prisma.$transaction(async (tx) => {
      // 1. Revert consumables stock
      if (execution.consumablesUsed && execution.consumablesUsed.length > 0) {
        for (const consumable of execution.consumablesUsed) {
          await tx.consumables.update({
            where: { id: consumable.consumableId },
            data: {
              quantity: { increment: consumable.qty },
              updatedAt: new Date(),
            },
          });
        }
      }

      // 2. Revert occurrence status if linked
      if (execution.occurrenceId) {
        await tx.mpp_occurrences.update({
          where: { id: execution.occurrenceId },
          data: {
            status: 'PROGRAMAT',
            executionId: null,
          },
        });
      }

      // 3. Delete execution
      await tx.mpp_executions.delete({
        where: { id: executionId },
      });

      // 4. Create audit log for deletion
      await tx.audit_logs.create({
        data: {
          userId: req.user.sub,
          action: 'DELETE',
          entity: 'mpp_executions',
          entityId: String(executionId),
          changes: { reason: 'Execuție anulată - stoc restituit' },
        },
      });
    });

    res.json({ message: 'Execuție anulată și stoc restituit' });
  } catch (error) {
    console.error('Error deleting execution:', error);
    res.status(500).json({ error: 'Eroare la anularea execuției' });
  }
});

// GET /api/mpp-executions/:id/formular6-pdf - Formular Nr. 6 (Fișă Mentenanță)
router.get('/:id/formular6-pdf', async (req, res) => {
  try {
    const idParse = idSchema.safeParse(req.params.id);
    if (!idParse.success) {
      return res.status(400).json({ error: 'ID execuție invalid' });
    }

    const execution = await prisma.mpp_executions.findUnique({
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
            maintenanceFreq: true,
            sectionId: true,
            sections: { select: { name: true } },
          },
        },
      },
    });

    if (!execution) {
      return res.status(404).json({ error: 'Execuție nu găsită' });
    }

    const PDFDocument = require('pdfkit');
    const pdf = new PDFDocument({ size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Formular-6-${execution.id}.pdf"`
    );

    pdf.pipe(res);

    // Title
    pdf.fontSize(14).font('Helvetica-Bold').text('FIȘĂ DE MENTENANȚĂ PREVENTIVĂ', {
      align: 'center',
    });
    pdf.fontSize(10)
      .font('Helvetica')
      .text('Formular Nr. 6 – Anexa 2, Procedura MDM Nr. 7', { align: 'center' });
    pdf.moveDown(0.5);

    // Device identification header
    pdf.fontSize(11).font('Helvetica-Bold').text('1. Identificare Dispozitiv Medical', {
      underline: true,
    });
    pdf.fontSize(10).font('Helvetica');
    pdf.text(`Denumire: ${execution.device.name}`);
    pdf.text(`Cod/Nr. Serie: ${execution.device.serialNumber || 'N/A'}`);
    pdf.text(`Nr. Inventar: ${execution.device.inventoryNumber}`);
    pdf.text(`Secția Medicală: ${execution.device.sections?.name || 'N/A'}`);
    pdf.text(`Clasă de Risc: ${execution.device.riskClass || 'N/A'}`);
    pdf.text(`Producător: ${execution.device.manufacturer || 'N/A'}`);
    pdf.moveDown(0.5);

    // Maintenance header
    pdf.fontSize(11).font('Helvetica-Bold').text('2. Tip Mentenanță', {
      underline: true,
    });
    pdf.fontSize(10).font('Helvetica');
    pdf.text(`Frecvență MPP: ${execution.device.maintenanceFreq ? 'DA (' + execution.device.maintenanceFreq + ' luni)' : 'NU'}`);
    pdf.text('Verificare Periodică: DA');
    pdf.moveDown(0.5);

    // Execution details
    pdf.fontSize(11).font('Helvetica-Bold').text('3. Detalii Execuție', {
      underline: true,
    });
    pdf.fontSize(10).font('Helvetica');
    pdf.text(`Data Execuției: ${new Date(execution.executedDate).toLocaleDateString('ro-RO')}`);
    pdf.text(`Durată: ${execution.durationMinutes ? execution.durationMinutes + ' minute' : 'N/A'}`);
    pdf.text(`Rezultat: ${execution.result === 'FUNCTIONAL' ? '✅ Funcțional' : '❌ Defect'}`);
    pdf.text(`Inginer: ${execution.engineerName}`);
    pdf.moveDown(0.5);

    // Operations table
    pdf.fontSize(11).font('Helvetica-Bold').text('4. Operațiuni Executate', {
      underline: true,
    });
    pdf.fontSize(9).font('Helvetica');

    const columns = [
      { header: 'Nr', width: 25 },
      { header: 'Descriere Operație', width: 250 },
      { header: 'Status', width: 50 },
      { header: 'Notă', width: 120 },
    ];

    let x = 20;
    const headerY = pdf.y;
    columns.forEach((col) => {
      pdf.text(col.header, x, headerY, { width: col.width, align: 'center' });
      x += col.width;
    });
    pdf.moveDown(0.8);

    // Operations rows
    if (Array.isArray(execution.checklist)) {
      execution.checklist.forEach((op, idx) => {
        x = 20;
        pdf.text(String(idx + 1), x, pdf.y, { width: columns[0].width, align: 'center' });
        x += columns[0].width;
        pdf.text(op.operatiune || '', x, pdf.y, { width: columns[1].width });
        x += columns[1].width;
        pdf.text(op.bifat ? '✓' : '✗', x, pdf.y, { width: columns[2].width, align: 'center' });
        x += columns[2].width;
        pdf.text(op.nota || '', x, pdf.y, { width: columns[3].width });
        pdf.moveDown(0.6);
      });
    }
    pdf.moveDown(0.5);

    // Consumables used
    if (execution.consumablesUsed && Array.isArray(execution.consumablesUsed) && execution.consumablesUsed.length > 0) {
      pdf.fontSize(11).font('Helvetica-Bold').text('5. Consumabile Utilizate', {
        underline: true,
      });
      pdf.fontSize(9).font('Helvetica');
      execution.consumablesUsed.forEach((item, idx) => {
        pdf.text(`${idx + 1}. ID ${item.consumableId}: ${item.qty} buc`);
      });
      pdf.moveDown(0.5);
    }

    // Observations
    if (execution.notes) {
      pdf.fontSize(11).font('Helvetica-Bold').text('6. Observații', { underline: true });
      pdf.fontSize(10).font('Helvetica').text(execution.notes);
      pdf.moveDown(0.5);
    }

    // Signatures section
    pdf.fontSize(11).font('Helvetica-Bold').text('7. Semnături', { underline: true });
    pdf.fontSize(9).font('Helvetica');

    // Engineer signature
    pdf.text('Semnătură Inginer:', 20, pdf.y);
    if (execution.signature) {
      try {
        const buffer = Buffer.from(execution.signature.split(',')[1], 'base64');
        pdf.image(buffer, 20, pdf.y + 10, { width: 80, height: 50 });
        pdf.moveDown(3.5);
      } catch (e) {
        console.error('Error rendering signature:', e.message);
        pdf.text('(Semnătură digitală indisponibilă)', 20, pdf.y + 10);
        pdf.moveDown(1);
      }
    } else {
      pdf.text('(Fără semnătură)', 20, pdf.y + 10);
      pdf.moveDown(1);
    }

    // Footer
    pdf.fontSize(8).text(
      `Data generării: ${new Date().toLocaleDateString('ro-RO')} | Formular Nr. 6 – Fișă de Mentenanță`,
      { align: 'center' }
    );

    pdf.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea PDF-ului' });
  }
});

module.exports = router;
