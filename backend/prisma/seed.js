require('dotenv').config();
const prisma = require('../src/db');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Populare date inițiale...\n');

  // 1. Admin user
  const passwordHash = await bcrypt.hash('admin', 12);
  const admin = await prisma.users.upsert({
    where: { email: 'bioinginer@spital.md' },
    update: {},
    create: {
      email: 'bioinginer@spital.md',
      username: process.env.ADMIN_USERNAME || 'inginer',
      passwordHash,
      fullName: 'Bioinginer Medical',
      role: 'BIOINGINER',
      isActive: true,
      updatedAt: new Date(),
    },
  });
  console.log(`✅ User: ${admin.username}`);

  // 2. Secții spitalului
  const sections = [
    { name: 'Terapie Intensiva', code: 'ATI', floor: 'Etaj 1', isActive: true, updatedAt: new Date() },
    { name: 'Bloc Operator', code: 'BLOC_OP', floor: 'Etaj 1', isActive: true, updatedAt: new Date() },
    { name: 'Cardiologie', code: 'CARDIO', floor: 'Etaj 2', isActive: true, updatedAt: new Date() },
    { name: 'Chirurgie Generala', code: 'CHIR', floor: 'Etaj 2', isActive: true, updatedAt: new Date() },
    { name: 'Medicina Interna', code: 'MED_INT', floor: 'Etaj 3', isActive: true, updatedAt: new Date() },
    { name: 'Laborator', code: 'LAB', floor: 'Parter', isActive: true, updatedAt: new Date() },
    { name: 'Radiologie', code: 'RX', floor: 'Parter', isActive: true, updatedAt: new Date() },
    { name: 'Urgente', code: 'URG', floor: 'Parter', isActive: true, updatedAt: new Date() },
  ];

  let sectionCount = 0;
  for (const s of sections) {
    try {
      await prisma.sections.upsert({
        where: { code: s.code },
        update: {},
        create: s,
      });
      sectionCount++;
    } catch (e) {
      // Sector deja exista
    }
  }
  console.log(`✅ Secții: ${sectionCount}/8`);

  // 3. Test device
  try {
    const device = await prisma.devices.upsert({
      where: { inventoryNumber: 'INV-001-TEST' },
      update: {},
      create: {
        inventoryNumber: 'INV-001-TEST',
        serialNumber: 'PM-100-2024-001',
        name: 'Monitor Semne Vitale',
        model: 'Patient Monitor',
        manufacturer: 'Philips',
        riskClass: 'IIb',
        status: 'FUNCTIONAL',
        acquisitionDate: new Date('2024-01-15'),
        maintenanceFreq: 12,
        createdById: admin.id,
        updatedAt: new Date(),
      },
    });
    console.log(`✅ Device: ${device.name}`);
  } catch (e) {
    console.log(`⚠️ Device error: ${e.message.split('\n')[0]}`);
  }

  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Eroare în seed:', e.message);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
