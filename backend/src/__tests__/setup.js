const prisma = require('../db');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  // Create test user
  const passwordHash = await bcrypt.hash(process.env.TEST_PASSWORD || 'Test123!', 12);
  await prisma.users.upsert({
    where: { email: 'test@simdm.local' },
    update: {},
    create: {
      email: 'test@simdm.local',
      username: 'testuser',
      passwordHash,
      fullName: 'Test User',
      role: 'BIOINGINER',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  // Create test section
  await prisma.sections.upsert({
    where: { code: 'TEST' },
    update: {},
    create: {
      name: 'Secție Test',
      code: 'TEST',
      floor: 'P',
      updatedAt: new Date(),
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
