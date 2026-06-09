/**
 * Seed data for verifications — Anexa 24 nomenclator
 *
 * Equipment types requiring metrological verification (24-month period)
 * According to Ordin MS 889/2024 — Ghidul Bioinginerului
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const VERIFICATION_CATEGORIES = [
  {
    namePattern: 'Monitor',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
  {
    namePattern: 'Ventilator',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
  {
    namePattern: 'Defibrilator',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
  {
    namePattern: 'Defibrillator',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
  {
    namePattern: 'Pompa infuzie',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
  {
    namePattern: 'Pompa',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
  {
    namePattern: 'Aparat Anestesie',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
  {
    namePattern: 'Capnograf',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
  {
    namePattern: 'Pulsoximetru',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
  {
    namePattern: 'Glucometru',
    verificationType: 'LABORATOR',
    verificationFreqMonths: 12,
  },
  {
    namePattern: 'Electrocardio',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
  {
    namePattern: 'Echograf',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
  {
    namePattern: 'Radiolog',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
  {
    namePattern: 'Incubator',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
  {
    namePattern: 'Fotometru',
    verificationType: 'LABORATOR',
    verificationFreqMonths: 12,
  },
  {
    namePattern: 'Analizor Gaze',
    verificationType: 'LABORATOR',
    verificationFreqMonths: 12,
  },
  {
    namePattern: 'Termometru clinic',
    verificationType: 'METROLOGIC',
    verificationFreqMonths: 24,
  },
];

async function seedVerifications() {
  console.log('🔍 Starting verifications seeding...');

  try {
    // Get all devices
    const devices = await prisma.devices.findMany();
    console.log(`Found ${devices.length} devices`);

    let updatedCount = 0;

    for (const device of devices) {
      const deviceName = device.name.toLowerCase();

      // Find matching category
      const matchingCategory = VERIFICATION_CATEGORIES.find((cat) =>
        deviceName.includes(cat.namePattern.toLowerCase())
      );

      if (matchingCategory) {
        await prisma.devices.update({
          where: { id: device.id },
          data: {
            requiresVerification: true,
            verificationType: matchingCategory.verificationType,
            verificationFreqMonths: matchingCategory.verificationFreqMonths,
          },
        });

        updatedCount++;
        console.log(
          `  ✅ ${device.name} → ${matchingCategory.verificationType} (${matchingCategory.verificationFreqMonths}mo)`
        );
      }
    }

    console.log(`\n📊 Summary: Updated ${updatedCount} devices for verification requirements`);
  } catch (error) {
    console.error('❌ Error seeding verifications:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedVerifications();
