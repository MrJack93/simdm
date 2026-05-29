import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Populare date inițiale...\n');

  // Sectiile spitalului
  try {
    const sections = await prisma.section.createMany({
      data: [
        { name: 'Bloc Operator', floor: 'Etaj 1' },
        { name: 'Terapie Intensiva (ATI)', floor: 'Etaj 1' },
        { name: 'Laborator', floor: 'Parter' },
        { name: 'Radiologie', floor: 'Parter' },
        { name: 'Cardiologie', floor: 'Etaj 2' },
        { name: 'Chirurgie', floor: 'Etaj 2' },
        { name: 'Medicina Interna', floor: 'Etaj 3' },
        { name: 'Urgente', floor: 'Parter' },
      ],
      skipDuplicates: true,
    });

    console.log(`✅ ${sections.count} secții adăugate`);
  } catch (error) {
    console.error('❌ Eroare la crearea secțiilor:', error);
  }

  // Un dispozitiv de test
  try {
    const device = await prisma.device.upsert({
      where: { inventoryNumber: 'INV-001-TEST' },
      update: {},
      create: {
        inventoryNumber: 'INV-001-TEST',
        name: 'Monitor Semne Vitale',
        model: 'Patient Monitor PM-100',
        manufacturer: 'Philips',
        riskClass: 'IIb',
        status: 'FUNCTIONAL',
        section: { connect: { name: 'Terapie Intensiva (ATI)' } },
      },
    });

    console.log(`✅ Dispozitiv test adăugat: ${device.name}`);
  } catch (error) {
    console.error('❌ Eroare la crearea dispozitivului:', error);
  }

  console.log('\n✅ Seed complet!\n');
}

main()
  .catch((e) => {
    console.error('❌ Eroare în seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
