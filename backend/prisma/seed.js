require('dotenv').config();
const prisma = require('../src/db');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 SIMDM — Populare date inițiale de test...\n');

  // ============================================
  // 1. ADMIN USER
  // ============================================
  const passwordHash = await bcrypt.hash('admin', 12);
  const admin = await prisma.users.upsert({
    where: { email: 'bioinginer@spital.md' },
    update: { username: 'admin', passwordHash },
    create: {
      email: 'bioinginer@spital.md',
      username: 'admin',
      passwordHash,
      fullName: 'Dr. Bioinginer Medical',
      role: 'BIOINGINER',
      isActive: true,
      updatedAt: new Date(),
    },
  });
  console.log(`✅ Utilizator: ${admin.username} (ID: ${admin.id})`);

  // Test user for E2E tests
  const testUserPassword = await bcrypt.hash('Test123!', 12);
  const testUser = await prisma.users.upsert({
    where: { username: 'testuser' },
    update: { passwordHash: testUserPassword },
    create: {
      email: 'testuser@spital.md',
      username: 'testuser',
      passwordHash: testUserPassword,
      fullName: 'Test User',
      role: 'BIOINGINER',
      isActive: true,
      updatedAt: new Date(),
    },
  });
  console.log(`✅ Test User: ${testUser.username} (ID: ${testUser.id})`);

  // ============================================
  // 2. SECȚII SPITALULUI (8 secții)
  // ============================================
  const sections = [
    { name: 'Terapie Intensivă', code: 'ATI', floor: 'Etaj 1', isActive: true, updatedAt: new Date() },
    { name: 'Bloc Operator', code: 'BLOC_OP', floor: 'Etaj 1', isActive: true, updatedAt: new Date() },
    { name: 'Cardiologie', code: 'CARDIO', floor: 'Etaj 2', isActive: true, updatedAt: new Date() },
    { name: 'Chirurgie Generală', code: 'CHIR', floor: 'Etaj 2', isActive: true, updatedAt: new Date() },
    { name: 'Medicină Internă', code: 'MED_INT', floor: 'Etaj 3', isActive: true, updatedAt: new Date() },
    { name: 'Laborator Clinic', code: 'LAB', floor: 'Parter', isActive: true, updatedAt: new Date() },
    { name: 'Radiologie', code: 'RX', floor: 'Parter', isActive: true, updatedAt: new Date() },
    { name: 'Urgențe', code: 'URG', floor: 'Parter', isActive: true, updatedAt: new Date() },
  ];

  const createdSections = {};
  for (const s of sections) {
    try {
      const section = await prisma.sections.upsert({
        where: { code: s.code },
        update: {},
        create: s,
      });
      createdSections[s.code] = section;
    } catch (e) {
      console.log(`⚠️ Secție existentă: ${s.code}`);
    }
  }
  console.log(`✅ Secții: ${Object.keys(createdSections).length}/8`);

  // ============================================
  // 3. DISPOZITIVE MEDICALE (10+ teste)
  // ============================================
  const devicesToCreate = [
    {
      inventoryNumber: 'DM-ATI-001',
      serialNumber: 'PM-100-2024-001',
      name: 'Monitor Semne Vitale',
      model: 'Philips IntelliVue MP70',
      manufacturer: 'Philips Medical',
      riskClass: 'IIb',
      status: 'FUNCTIONAL',
      sectionId: createdSections['ATI']?.id,
      acquisitionDate: new Date('2023-06-15'),
      warrantyEndDate: new Date('2025-06-15'),
      acquisitionValue: 45000,
      maintenanceFreq: 12,
      room: 'ATI-01',
      updatedAt: new Date(),
      createdById: admin.id,
    },
    {
      inventoryNumber: 'DM-BLOC-001',
      serialNumber: 'DEFI-200-2023-015',
      name: 'Defibrilator',
      model: 'Zoll M Series',
      manufacturer: 'Zoll Medical',
      riskClass: 'III',
      status: 'FUNCTIONAL',
      sectionId: createdSections['BLOC_OP']?.id,
      acquisitionDate: new Date('2023-03-01'),
      warrantyEndDate: new Date('2026-03-01'),
      acquisitionValue: 35000,
      maintenanceFreq: 6,
      room: 'BLOC-01',
      updatedAt: new Date(),
      createdById: admin.id,
    },
    {
      inventoryNumber: 'DM-CARDIO-001',
      serialNumber: 'ECG-300-2024-001',
      name: 'Electrocardiograf',
      model: 'GE MAC 1200ST',
      manufacturer: 'General Electric',
      riskClass: 'IIa',
      status: 'FUNCTIONAL',
      sectionId: createdSections['CARDIO']?.id,
      acquisitionDate: new Date('2024-01-10'),
      maintenanceFreq: 24,
      room: 'CARDIO-02',
      updatedAt: new Date(),
      createdById: admin.id,
    },
    {
      inventoryNumber: 'DM-LAB-001',
      serialNumber: 'ANALYZER-500-2023-045',
      name: 'Analizor Hematologic',
      model: 'Siemens ADVIA 2120',
      manufacturer: 'Siemens Healthineers',
      riskClass: 'IIb',
      status: 'FUNCTIONAL',
      sectionId: createdSections['LAB']?.id,
      acquisitionDate: new Date('2023-09-20'),
      warrantyEndDate: new Date('2025-09-20'),
      acquisitionValue: 120000,
      maintenanceFreq: 12,
      room: 'LAB-03',
      updatedAt: new Date(),
      createdById: admin.id,
    },
    {
      inventoryNumber: 'DM-RX-001',
      serialNumber: 'XRAY-1000-2022-012',
      name: 'Difuzor Radiologic',
      model: 'Siemens AXIOM',
      manufacturer: 'Siemens',
      riskClass: 'III',
      status: 'FUNCTIONAL',
      sectionId: createdSections['RX']?.id,
      acquisitionDate: new Date('2022-11-05'),
      maintenanceFreq: 6,
      room: 'RX-01',
      updatedAt: new Date(),
      createdById: admin.id,
    },
    {
      inventoryNumber: 'DM-URG-002',
      serialNumber: 'PUMP-600-2024-002',
      name: 'Pompă Infuzii',
      model: 'Infusomat Space',
      manufacturer: 'Fresenius',
      riskClass: 'IIa',
      status: 'IN_REPARATIE',
      sectionId: createdSections['URG']?.id,
      acquisitionDate: new Date('2023-05-12'),
      maintenanceFreq: 12,
      room: 'URG-04',
      notes: 'În reparație — conectori deteriorați',
      updatedAt: new Date(),
      createdById: admin.id,
    },
    {
      inventoryNumber: 'DM-CHIR-001',
      serialNumber: 'SCOPE-800-2023-020',
      name: 'Videoendoscop',
      model: 'Karl Storz ENDOSCOPY',
      manufacturer: 'Karl Storz',
      riskClass: 'IIb',
      status: 'FUNCTIONAL',
      sectionId: createdSections['CHIR']?.id,
      acquisitionDate: new Date('2023-08-18'),
      maintenanceFreq: 24,
      room: 'BLOC-02',
      updatedAt: new Date(),
      createdById: admin.id,
    },
    {
      inventoryNumber: 'DM-MED-001',
      serialNumber: 'VENT-700-2024-001',
      name: 'Ventilator Mecanic',
      model: 'Dräger Evita V500',
      manufacturer: 'Dräger Medical',
      riskClass: 'III',
      status: 'DEFECT',
      sectionId: createdSections['MED_INT']?.id,
      acquisitionDate: new Date('2022-02-28'),
      maintenanceFreq: 3,
      room: 'MED-05',
      notes: 'Defectă — baterie backup nu funcționează',
      updatedAt: new Date(),
      createdById: admin.id,
    },
  ];

  let deviceCount = 0;
  const createdDevices = [];
  for (const d of devicesToCreate) {
    try {
      const device = await prisma.devices.upsert({
        where: { inventoryNumber: d.inventoryNumber },
        update: {},
        create: d,
      });
      createdDevices.push(device);
      deviceCount++;
    } catch (e) {
      console.log(`⚠️ Device existent: ${d.inventoryNumber}`);
    }
  }
  console.log(`✅ Dispozitive: ${deviceCount}/8`);

  // ============================================
  // 4. CONSUMABILE (4 consumabile)
  // ============================================
  const consumablesToCreate = [
    {
      name: 'Electrozi defibrillare Zoll OneStep',
      model: 'Zoll OneStep',
      manufacturer: 'Zoll',
      unitOfMeasure: 'pereche',
      quantity: 15,
      minQuantity: 5,
      expiryDate: new Date('2026-12-31'),
      location: 'Depozit Medical 1',
      updatedAt: new Date(),
    },
    {
      name: 'Căi vasculare periferice BD 20G',
      model: 'IV Catheter 20G',
      manufacturer: 'BD Medical',
      unitOfMeasure: 'buc',
      quantity: 200,
      minQuantity: 50,
      expiryDate: new Date('2025-06-30'),
      location: 'Depozit Medical 1',
      updatedAt: new Date(),
    },
    {
      name: 'Filtre hemostaturi ECG GE',
      model: 'GE Marquette',
      manufacturer: 'GE Medical',
      unitOfMeasure: 'buc',
      quantity: 25,
      minQuantity: 10,
      location: 'Laborator',
      updatedAt: new Date(),
    },
    {
      name: 'Baterie backup ventilator Dräger',
      model: 'Dräger MS21',
      manufacturer: 'Dräger',
      unitOfMeasure: 'buc',
      quantity: 3,
      minQuantity: 2,
      expiryDate: new Date('2027-01-15'),
      location: 'Medicină Internă',
      updatedAt: new Date(),
    },
  ];

  let consumableCount = 0;
  const createdConsumables = [];
  for (const c of consumablesToCreate) {
    try {
      const consumable = await prisma.consumables.create({
        data: c,
      });
      createdConsumables.push(consumable);
      consumableCount++;
    } catch (e) {
      console.log(`⚠️ Consumabil error: ${e.message.split('\n')[0]}`);
    }
  }
  console.log(`✅ Consumabile: ${consumableCount}/4`);

  // ============================================
  // 5. ÎNREGISTRĂRI MENTENANȚĂ (3 teste)
  // ============================================
  if (createdDevices.length > 0) {
    const maintenanceToCreate = [
      {
        deviceId: createdDevices[0].id,
        type: 'MP',
        scheduledDate: new Date('2026-04-15'),
        executedDate: new Date('2026-04-15'),
        description: 'Verificare anuală monitor — test sensor și display',
        serviceProvider: 'Philips Service Partner',
        cost: 500,
        result: 'OK - dispozitiv funcțional',
        updatedAt: new Date(),
      },
      {
        deviceId: createdDevices[1].id,
        type: 'MC',
        scheduledDate: new Date('2026-05-01'),
        executedDate: new Date('2026-05-01'),
        description: 'Reparație baterie backup, înlocuire acumulatori',
        serviceProvider: 'Zoll Service Center',
        cost: 2000,
        externalService: true,
        partsReplaced: 'Battery pack model 89000-001',
        result: 'OK - reparație completă',
        updatedAt: new Date(),
      },
    ];

    let maintenanceCount = 0;
    for (const m of maintenanceToCreate) {
      try {
        await prisma.maintenance_records.create({
          data: {
            ...m,
            cost: m.cost ? BigInt(m.cost * 100) / BigInt(100) : null,
          }
        });
        maintenanceCount++;
      } catch (e) {
        console.log(`⚠️ Mentenanță error (${m.type}): ${e.message.substring(0, 100)}`);
      }
    }
    console.log(`✅ Înregistrări mentenanță: ${maintenanceCount}/2`);
  }

  // ============================================
  // 6. INCIDENTE DE TEST (2 incidente)
  // ============================================
  if (createdDevices.length > 1) {
    const incidentsToCreate = [
      {
        deviceId: createdDevices[5].id,
        occurredAt: new Date('2026-05-20'),
        severity: 'MODERAT',
        description: 'Pompă de infuzii — conectori deteriorați, nu fixează sonda cu fermitate',
        reportedById: admin.id,
        status: 'DESCHIS',
        sectionId: createdSections['URG']?.id,
        patientAffected: false,
        rootCause: 'Uzură normală a conectării după 2 ani de utilizare',
        updatedAt: new Date(),
      },
      {
        deviceId: createdDevices[7].id,
        occurredAt: new Date('2026-05-18'),
        severity: 'GRAV',
        description: 'Ventilator — baterie backup defectă, alarme false la schimb baterie',
        reportedById: admin.id,
        status: 'DESCHIS',
        sectionId: createdSections['MED_INT']?.id,
        patientAffected: false,
        rootCause: 'Defect din fabricație — baterie nu se încarcă complet',
        preventiveAction: 'Înlocuire unitate baterie înaintea următorului serviciu',
        updatedAt: new Date(),
      },
    ];

    let incidentCount = 0;
    for (const inc of incidentsToCreate) {
      try {
        await prisma.incidents.create({ data: inc });
        incidentCount++;
      } catch (e) {
        console.log(`⚠️ Incident: ${e.message.split('\n')[0]}`);
      }
    }
    console.log(`✅ Incidente: ${incidentCount}/2`);
  }

  console.log('\n🎉 Seed complet! Baza de date e gata pentru testare.\n');
  console.log('📝 Sigurul test dispozitiv:');
  createdDevices.forEach((d, i) => {
    console.log(`   ${i + 1}. ${d.inventoryNumber} — ${d.name} (${d.status})`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Eroare în seed:', e.message);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
