/**
 * Cron jobs for system notifications
 * - Verification expiry alerts (60/30/7 days before expiration)
 * - Maintenance due alerts
 * - Device compliance reports
 */

const cron = require('node-cron');
const prisma = require('../db');
const { log } = require('../utils/logger');

/**
 * Check for service contracts expiring in 30 days
 * Alert when contracts are about to expire
 */
async function checkContractExpiry() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate 30 days from today
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    // Find contracts expiring in next 30 days
    const expiringContracts = await prisma.service_contracts.findMany({
      where: {
        endDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        provider: { select: { name: true } },
      },
    });

    if (expiringContracts.length > 0) {
      log(
        `[Cron] ⚠️  ${expiringContracts.length} contracte expiră în următoarele 30 zile`
      );

      expiringContracts.forEach((contract) => {
        const daysLeft = Math.ceil(
          (new Date(contract.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        log(
          `  └─ ${contract.contractNo} (${contract.provider.name}) - ${daysLeft} zile rămase`
        );
      });
    }
  } catch (error) {
    log(`[Cron] ❌ Error in checkContractExpiry: ${error.message}`);
  }
}

/**
 * Check for verifications expiring in 60, 30, and 7 days
 * Create notifications and log alerts
 */
async function checkVerificationExpiry() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alertThresholds = [
      { days: 60, label: '60 zile' },
      { days: 30, label: '30 zile' },
      { days: 7, label: '7 zile' },
    ];

    for (const threshold of alertThresholds) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + threshold.days);
      targetDate.setHours(23, 59, 59, 999);

      const expiringVerifications = await prisma.verifications.findMany({
        where: {
          validUntil: {
            gte: new Date(targetDate.getTime() - 24 * 60 * 60 * 1000),
            lte: targetDate,
          },
        },
        include: {
          device: { select: { id: true, name: true } },
        },
      });

      if (expiringVerifications.length > 0) {
        log(
          `[Cron] ⚠️  ${expiringVerifications.length} verificări expiră în ${threshold.label}`
        );

        // Create in-app notifications
        for (const verification of expiringVerifications) {
          try {
            // TODO: Create notification record in database
            // For now, just log
            log(
              `  └─ ${verification.device.name} (Valabil până: ${verification.validUntil.toLocaleDateString('ro-RO')})`
            );
          } catch (err) {
            log(`  ❌ Error creating notification: ${err.message}`);
          }
        }
      }
    }

    // Check for never-verified devices
    const neverVerified = await prisma.devices.findMany({
      where: {
        requiresVerification: true,
        status: { not: 'CASAT' },
        verifications: {
          none: {},
        },
      },
      select: { id: true, name: true, verificationType: true },
    });

    if (neverVerified.length > 0) {
      log(`[Cron] ⚠️  ${neverVerified.length} dispozitive nu au fost niciodată verificate`);
      neverVerified.forEach((device) => {
        log(`  └─ ${device.name} (Tip: ${device.verificationType})`);
      });
    }
  } catch (error) {
    log(`[Cron] ❌ Error in checkVerificationExpiry: ${error.message}`);
  }
}

/**
 * Check for maintenance plans that are due (checkMppDue)
 * Status SCADENT/DEPASIT is calculated dynamically (never stored in DB).
 * We query by scheduledDate or rescheduledTo: occurrences with status='PROGRAMAT' due within 7 days or overdue.
 */
async function checkMppDue() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const dueOccurrences = await prisma.mpp_occurrences.findMany({
      where: {
        status: 'PROGRAMAT',
        OR: [
          {
            rescheduledTo: null,
            scheduledDate: { lte: sevenDaysFromNow },
          },
          {
            rescheduledTo: { lte: sevenDaysFromNow },
          },
        ],
      },
      include: {
        plan: {
          include: {
            device: { select: { name: true } },
          },
        },
      },
      take: 100,
    });

    if (dueOccurrences.length > 0) {
      const overdue = dueOccurrences.filter((o) => {
        const actualDate = o.rescheduledTo ?? o.scheduledDate;
        return new Date(actualDate) < today;
      }).length;
      const dueSoon = dueOccurrences.length - overdue;
      log(`[Cron] 🔧 ${dueOccurrences.length} mentenanțe scadente (${overdue} depășite, ${dueSoon} în 7 zile)`);
      dueOccurrences.slice(0, 5).forEach((occ) => {
        const actualDate = occ.rescheduledTo ?? occ.scheduledDate;
        const dynamicStatus = new Date(actualDate) < today ? 'DEPASIT' : 'SCADENT';
        log(`  └─ ${occ.plan.device.name} (${dynamicStatus}, ${new Date(actualDate).toLocaleDateString('ro-RO')})`);
      });
    }
  } catch (error) {
    log(`[Cron] ❌ Error in checkMppDue: ${error.message}`);
  }
}

/**
 * Check for repair tickets in critical status
 */
async function checkRepairTickets() {
  try {
    // Find URGENT or HIGH priority tickets in DESCHIS/IN_LUCRU for > 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const criticalTickets = await prisma.repair_tickets.findMany({
      where: {
        priority: { in: ['URGENT', 'RIDICAT'] },
        status: { in: ['DESCHIS', 'IN_LUCRU'] },
        reportedAt: { lte: sevenDaysAgo },
      },
      include: {
        device: { select: { name: true } },
      },
      take: 50,
    });

    if (criticalTickets.length > 0) {
      log(`[Cron] 🚨 ${criticalTickets.length} bilete critice nerezolvate (>7 zile)`);
      criticalTickets.slice(0, 3).forEach((ticket) => {
        log(`  └─ ${ticket.ticketNumber} - ${ticket.device.name} (Prioritate: ${ticket.priority})`);
      });
    }
  } catch (error) {
    log(`[Cron] ❌ Error in checkRepairTickets: ${error.message}`);
  }
}

/**
 * Check for documents expiring in 60, 30, and 7 days
 */
async function checkDocumentExpiry() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alertThresholds = [
      { days: 60, label: '60 zile' },
      { days: 30, label: '30 zile' },
      { days: 7, label: '7 zile' },
    ];

    for (const threshold of alertThresholds) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + threshold.days);
      targetDate.setHours(23, 59, 59, 999);

      const expiringDocs = await prisma.documents.findMany({
        where: {
          isDeleted: false,
          isCurrent: true,
          validUntil: {
            gte: new Date(targetDate.getTime() - 24 * 60 * 60 * 1000),
            lte: targetDate,
          },
        },
        select: { id: true, title: true, category: true, validUntil: true },
      });

      if (expiringDocs.length > 0) {
        log(`[Cron] ⚠️  ${expiringDocs.length} documente expiră în ${threshold.label}`);
        expiringDocs.slice(0, 5).forEach((doc) => {
          log(`  └─ ${doc.title} (${doc.category}, expiră: ${doc.validUntil.toLocaleDateString('ro-RO')})`);
        });
      }
    }

    const alreadyExpired = await prisma.documents.count({
      where: {
        isDeleted: false,
        isCurrent: true,
        validUntil: { lt: today },
      },
    });

    if (alreadyExpired > 0) {
      log(`[Cron] 🔴 ${alreadyExpired} documente deja expirate`);
    }
  } catch (error) {
    log(`[Cron] ❌ Error in checkDocumentExpiry: ${error.message}`);
  }
}

/**
 * Daily compliance summary
 */
async function generateComplianceSummary() {
  try {
    // Get compliance stats
    const devices = await prisma.devices.findMany({
      where: {
        requiresVerification: true,
        status: { not: 'CASAT' },
      },
      include: {
        verifications: {
          orderBy: { performedAt: 'desc' },
          take: 1,
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let conform = 0;
    let expirat = 0;
    let neverificat = 0;

    devices.forEach((device) => {
      if (!device.verifications.length) {
        neverificat++;
      } else {
        const validUntil = new Date(device.verifications[0].validUntil);
        validUntil.setHours(0, 0, 0, 0);
        if (validUntil < today) {
          expirat++;
        } else {
          conform++;
        }
      }
    });

    log(`[Cron] 📊 Raport zilnic conformitate:`);
    log(`  • Total dispozitive: ${devices.length}`);
    log(`  • CONFORM: ${conform}`);
    log(`  • EXPIRAT: ${expirat}`);
    log(`  • NEVERIFICAT: ${neverificat}`);
  } catch (error) {
    log(`[Cron] ❌ Error in generateComplianceSummary: ${error.message}`);
  }
}

/**
 * Start all cron jobs
 */
function startCronJobs() {
  try {
    // Daily at 08:00 Europe/Chisinau time
    // Cron format: minute hour day month dayOfWeek
    // 0 8 * * * = 08:00 every day (UTC+2/+3)
    const verificationTask = cron.schedule(
      '0 8 * * *',
      async () => {
        log('[Cron] ⏰ Starting daily system checks...');
        await checkVerificationExpiry();
        await checkContractExpiry();
        await checkDocumentExpiry();
        await checkMppDue();
        await checkRepairTickets();
        await generateComplianceSummary();
        log('[Cron] ✅ All daily checks completed');
      },
      {
        timezone: 'Europe/Chisinau',
      }
    );

    log('✅ Cron jobs started (08:00 Europe/Chisinau timezone)');

    return {
      verificationTask,
      stop: () => {
        verificationTask.stop();
        log('Cron jobs stopped');
      },
    };
  } catch (error) {
    log(`❌ Error starting cron jobs: ${error.message}`);
    throw error;
  }
}

module.exports = {
  startCronJobs,
  checkVerificationExpiry,
  checkContractExpiry,
  checkDocumentExpiry,
  checkMppDue,
  checkRepairTickets,
  generateComplianceSummary,
};
