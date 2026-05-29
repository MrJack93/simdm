require('dotenv').config();
const prisma = require('../src/db');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Populare date inițiale...\n');

  // 1. Admin user
  const passwordHash = await bcrypt.hash('admin', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'bioinginer@spital.md' },
    update: {},
    create: {
      email: 'bioinginer@spital.md',
      username: process.env.ADMIN_USERNAME || 'inginer',
      passwordHash,
      fullName: 'Bioinginer Medical',
      role: 'BIOINGINER',
      isActive: true,
    },
  });
  console.log(`✅ User admin: ${admin.username}`);

  // 2. Secții spitalului
  const sections = [
    { name: 'Terapie Intensiva', code: 'ATI', floor: 'Etaj 1' },
    { name: 'Bloc Operator', code: 'BLOC_OP', floor: 'Etaj 1' },
    { name: 'Cardiologie', code: 'CARDIO', floor: 'Etaj 2' },
    { name: 'Chirurgie Generala', code: 'CHIR', floor: 'Etaj 2' },
    { name: 'Medicina Interna', code: 'MED_INT', floor: 'Etaj 3' },
    { name: 'Laborator', code: 'LAB', floor: 'Parter' },
    { name: 'Radiologie', code: 'RX', floor: 'Parter' },
    { name: 'Urgente', code: 'URG', floor: 'Parter' },
  ];

  for (const s of sections) {
    await prisma.section.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }
  console.log(`✅ ${sections.length} secții adăugate`);

  // 3. Dispozitiv test — cu câmpuri medicale complete
  const device = await prisma.device.upsert({
    where: { inventoryNumber: 'INV-001-TEST' },
    update: {},
    create: {
      inventoryNumber: 'INV-001-TEST',
      serialNumber: 'PM-100-2024-001',
      name: 'Monitor Semne Vitale',
      model: 'Patient Monitor PM-100',
      manufacturer: 'Philips',
      countryOfOrigin: 'Nederland',
      yearMade: 2024,
      riskClass: 'IIb',
      ceMarking: 'CE 0123',
      status: 'FUNCTIONAL',
      acquisitionDate: new Date('2024-01-15'),
      warrantyEndDate: new Date('2026-01-15'),
      acquisitionValue: 5000.00,
      maintenanceFreq: 12,
      nextMaintenanceAt: new Date('2025-06-01'),
      section: { connect: { code: 'ATI' } },
      createdBy: { connect: { id: admin.id } },
    },
  });
  console.log(`✅ Dispozitiv test: ${device.name}`);

  // 4. Consumable test
  const consumable = await prisma.consumable.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Cablu ECG 3 derivații',
      manufacturer: 'Philips',
      unitOfMeasure: 'buc',
      quantity: 5,
      minQuantity: 2,
    },
  });
  console.log(`✅ Consumabil test: ${consumable.name}`);

  // 5. Relație Device ↔ Consumable
  await prisma.deviceConsumable.upsert({
    where: { deviceId_consumableId: { deviceId: device.id, consumableId: consumable.id } },
    update: {},
    create: { deviceId: device.id, consumableId: consumable.id },
  });
  console.log(`✅ Relație Device ↔ Consumable creată`);

  // 6. Document test
  await prisma.document.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Ghidul Bioinginerului - Ordinul MS 889/2024',
      category: 'LEGISLATIE',
      fileUrl: '/documents/ghid-ms-889-2024.pdf',
      version: '2.0',
      isCurrent: true,
      tags: ['ghid', 'ministerul-sanatatii', '2024'],
    },
  });
  console.log(`✅ Document test adăugat`);

  // 7. AuditLog test
  await prisma.auditLog.create({
    data: {
      user: { connect: { id: admin.id } },
      action: 'SEED_DATA',
      entity: 'System',
      entityId: '1',
      changes: { message: 'Initial seed data populated' },
    },
  });
  console.log(`✅ Audit log inițial creat`);

  console.log('\n🎉 Seed complet — Schema upgrade la 100%!\n');
}

main()
  .catch((e) => {
    console.error('❌ Eroare în seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
