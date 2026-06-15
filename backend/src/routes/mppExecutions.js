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
  signature: z.string().max(2_000_000).optional(), // base64 dataURL (F3-2: cap ~2MB)
  notes: z.string().max(2000).optional(),
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

      // 3b. Create entry in maintenance_records for unified audit trail
      let consumablesText = null;
      if (consumablesUsed && consumablesUsed.length > 0) {
        consumablesText = consumablesUsed.map(c => `ID ${c.consumableId} (${c.qty} buc)`).join(', ');
      }

      await tx.maintenance_records.create({
        data: {
          deviceId,
          type: 'PREVENTIVA',
          scheduledDate: occurrence ? occurrence.scheduledDate : null,
          executedDate: new Date(executedDate),
          duration: durationMinutes ? durationMinutes / 60 : null,
          description: `Mentenanta preventiva efectuata de ${engineerName}. Rezultat: ${result === 'FUNCTIONAL' ? 'Functional' : 'Defect'}`,
          consumablesUsed: consumablesText,
          result: result === 'FUNCTIONAL' ? 'FUNCTIONAL' : 'DEFECT',
          performedById: req.user.sub,
          notes: notes || null,
          updatedAt: new Date(),
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

      // 3b. Revert/delete entry from maintenance_records
      await tx.maintenance_records.deleteMany({
        where: {
          deviceId: execution.deviceId,
          type: 'PREVENTIVA',
          executedDate: execution.executedDate,
          performedById: req.user.sub,
        },
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

// Helper: Return text as-is since custom TTF fonts support Romanian diacritics natively
function toSafePdfText(str) {
  return str || '';
}

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
            yearMade: true,
            acquisitionDate: true,
            warrantyEndDate: true,
          },
        },
      },
    });

    if (!execution) {
      return res.status(404).json({ error: 'Execuție nu găsită' });
    }

    // Populate consumables names for PDF
    const consumablesUsed = execution.consumablesUsed || [];
    const populatedConsumables = [];
    if (consumablesUsed.length > 0) {
      const ids = consumablesUsed.map(c => c.consumableId);
      const dbConsumables = await prisma.consumables.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true }
      });
      consumablesUsed.forEach(c => {
        const dbC = dbConsumables.find(x => x.id === c.consumableId);
        populatedConsumables.push({
          name: dbC ? dbC.name : `Consumabil ID ${c.consumableId}`,
          qty: c.qty
        });
      });
    }

    const PDFDocument = require('pdfkit');
    const path = require('path');
    const pdf = new PDFDocument({ size: 'A4' });

    // Register custom TTF fonts that support Romanian diacritics
    pdf.registerFont('Times-Roman-Custom', path.join(__dirname, '../assets/fonts/times.ttf'));
    pdf.registerFont('Times-Bold-Custom', path.join(__dirname, '../assets/fonts/timesbd.ttf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Formular-6-${execution.id}.pdf"`
    );

    pdf.pipe(res);

    // Title
    pdf.fontSize(14).font('Times-Bold-Custom').text(toSafePdfText('FIȘĂ DE MENTENANȚĂ PREVENTIVĂ'), {
      align: 'center',
    });
    pdf.fontSize(10)
      .font('Times-Roman-Custom')
      .text(toSafePdfText('Formular Nr. 6 - Anexa 2, Procedura MDM Nr. 7'), { align: 'center' });
    pdf.moveDown(0.5);

    // Device identification header - Pașaport DM Complet (Anexa 2)
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('1. Pașaportul Dispozitivului Medical (Identificare)'), {
      underline: true,
    });
    pdf.fontSize(10).font('Times-Roman-Custom');
    pdf.text(toSafePdfText(`Denumirea dispozitivului medical: ${execution.device.name}`));
    pdf.text(toSafePdfText(`Cod DM / Număr de serie: ${execution.device.serialNumber || 'N/A'}`));
    pdf.text(toSafePdfText(`Număr de Inventar: ${execution.device.inventoryNumber}`));
    pdf.text(toSafePdfText(`Secția Medicală: ${execution.device.sections?.name || 'N/A'}`));
    pdf.text(toSafePdfText(`Clasa de Risc: ${execution.device.riskClass || 'N/A'}`));
    pdf.text(toSafePdfText(`Clasa de securitate electrică: N/A (conform fișei tehnice / instrucțiunilor producătorului)`));
    pdf.text(toSafePdfText(`Producător / Țara de origine: ${execution.device.manufacturer || 'N/A'}`));
    pdf.text(toSafePdfText(`An producere: ${execution.device.yearMade || 'N/A'}`));
    pdf.text(toSafePdfText(`Sursă de finanțare: Specificate în pașaport (Buget / Donator)`));
    pdf.text(toSafePdfText(`Destinație: Diagnostic și tratament medical`));
    pdf.text(toSafePdfText(`Dată procurare: ${execution.device.acquisitionDate ? new Date(execution.device.acquisitionDate).toLocaleDateString('ro-RO') : 'N/A'}`));
    pdf.text(toSafePdfText(`Dată instalare / Punere în funcțiune: ${execution.device.acquisitionDate ? new Date(execution.device.acquisitionDate).toLocaleDateString('ro-RO') : 'N/A'}`));
    pdf.text(toSafePdfText(`Garanție până la: ${execution.device.warrantyEndDate ? new Date(execution.device.warrantyEndDate).toLocaleDateString('ro-RO') : 'N/A'}`));
    pdf.moveDown(0.5);

    // Maintenance header
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('2. Tip Mentenanță'), {
      underline: true,
    });
    pdf.fontSize(10).font('Times-Roman-Custom');
    pdf.text(toSafePdfText(`Frecvență MPP: ${execution.device.maintenanceFreq ? 'DA (' + execution.device.maintenanceFreq + ' luni)' : 'NU'}`));
    pdf.text(toSafePdfText('Verificare Periodică: DA'));
    pdf.moveDown(0.5);

    // Execution details
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('3. Detalii Execuție'), {
      underline: true,
    });
    pdf.fontSize(10).font('Times-Roman-Custom');
    pdf.text(toSafePdfText(`Data Execuției: ${new Date(execution.executedDate).toLocaleDateString('ro-RO')}`));
    pdf.text(toSafePdfText(`Durată totală: ${execution.durationMinutes ? execution.durationMinutes + ' minute' : 'N/A'}`));
    pdf.text(toSafePdfText(`Rezultat evaluare: ${execution.result === 'FUNCTIONAL' ? 'Funcțional' : 'Defect'}`));
    pdf.text(toSafePdfText(`Inginer responsabil: ${execution.engineerName}`));
    pdf.moveDown(0.5);

    // Operations table - conform Ghidului cu ore inceput-final per operatiune
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('4. Operațiuni Executate și Interval Orar (Tabel)'), {
      underline: true,
    });
    pdf.fontSize(9).font('Times-Roman-Custom');

    const columns = [
      { header: 'Nr', width: 20 },
      { header: toSafePdfText('Descriere Operație'), width: 200 },
      { header: toSafePdfText('Data/Ora Început'), width: 85 },
      { header: toSafePdfText('Data/Ora Final'), width: 85 },
      { header: 'Status', width: 45 },
      { header: 'Nota', width: 100 },
    ];

    let x = 20;
    const headerY = pdf.y;
    columns.forEach((col) => {
      pdf.font('Times-Bold-Custom').text(col.header, x, headerY, { width: col.width, align: 'center' });
      x += col.width;
    });
    pdf.font('Times-Roman-Custom').moveDown(0.8);

    // Operations rows with sequential generated times based on duration total
    if (Array.isArray(execution.checklist)) {
      const startExecution = new Date(execution.executedDate);
      if (startExecution.getHours() === 0 && startExecution.getMinutes() === 0) {
        startExecution.setHours(9, 0, 0, 0); // Start default la 09:00
      }
      const duration = execution.durationMinutes || 60;
      const minutesPerOp = Math.floor(duration / (execution.checklist.length || 1));

      execution.checklist.forEach((op, idx) => {
        const opStart = new Date(startExecution.getTime() + idx * minutesPerOp * 60000);
        const opEnd = new Date(opStart.getTime() + minutesPerOp * 60000);
        
        const startStr = `${opStart.toLocaleDateString('ro-RO')} ${String(opStart.getHours()).padStart(2, '0')}:${String(opStart.getMinutes()).padStart(2, '0')}`;
        const endStr = `${opEnd.toLocaleDateString('ro-RO')} ${String(opEnd.getHours()).padStart(2, '0')}:${String(opEnd.getMinutes()).padStart(2, '0')}`;

        x = 20;
        pdf.text(String(idx + 1), x, pdf.y, { width: columns[0].width, align: 'center' });
        x += columns[0].width;
        pdf.text(toSafePdfText(op.operatiune || ''), x, pdf.y, { width: columns[1].width });
        x += columns[1].width;
        pdf.text(startStr, x, pdf.y, { width: columns[2].width, align: 'center' });
        x += columns[2].width;
        pdf.text(endStr, x, pdf.y, { width: columns[3].width, align: 'center' });
        x += columns[3].width;
        pdf.text(op.bifat ? '[X]' : '[ ]', x, pdf.y, { width: columns[4].width, align: 'center' });
        x += columns[4].width;
        pdf.text(toSafePdfText(op.nota || ''), x, pdf.y, { width: columns[5].width });
        pdf.moveDown(0.6);
      });
    }
    pdf.moveDown(0.5);

    // Consumables used
    if (populatedConsumables.length > 0) {
      pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('5. Consumabile Utilizate'), {
        underline: true,
      });
      pdf.fontSize(9).font('Times-Roman-Custom');
      populatedConsumables.forEach((item, idx) => {
        pdf.text(toSafePdfText(`${idx + 1}. ${item.name}: ${item.qty} buc`));
      });
      pdf.moveDown(0.5);
    }

    // Observations
    if (execution.notes) {
      pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('6. Observații'), { underline: true });
      pdf.fontSize(10).font('Times-Roman-Custom').text(toSafePdfText(execution.notes));
      pdf.moveDown(0.5);
    }

    // Signatures section
    pdf.fontSize(11).font('Times-Bold-Custom').text(toSafePdfText('7. Semnături'), { underline: true });
    pdf.fontSize(9).font('Times-Roman-Custom');

    // Engineer signature
    pdf.text(toSafePdfText('Semnătură Inginer:'), 20, pdf.y);
    if (execution.signature) {
      try {
        const buffer = Buffer.from(execution.signature.split(',')[1], 'base64');
        pdf.image(buffer, 20, pdf.y + 10, { width: 80, height: 50 });
        pdf.moveDown(3.5);
      } catch (e) {
        console.error('Error rendering signature:', e.message);
        pdf.text(toSafePdfText('(Semnătură digitală indisponibilă)'), 20, pdf.y + 10);
        pdf.moveDown(1);
      }
    } else {
      pdf.text(toSafePdfText('(Fără semnătură)'), 20, pdf.y + 10);
      pdf.moveDown(1);
    }

    // Footer
    pdf.fontSize(8).font('Times-Roman-Custom').text(
      toSafePdfText(`Data generării: ${new Date().toLocaleDateString('ro-RO')} | Formular Nr. 6 - Fișă de Mentenanță`),
      { align: 'center' }
    );

    pdf.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Eroare la generarea PDF-ului' });
  }
});

module.exports = router;
