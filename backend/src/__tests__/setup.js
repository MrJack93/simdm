require('dotenv').config();
const prisma = require('../db');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  // Create test user
  const passwordHash = await bcrypt.hash(process.env.TEST_PASSWORD || 'Test123!', 12);
  try {
    await prisma.users.upsert({
      where: { username: 'testuser' },
      update: { failedLoginAttempts: 0, lockedUntil: null, isActive: true },
      create: {
        email: 'test@simdm.local',
        username: 'testuser',
        passwordHash,
        fullName: 'Test User',
        role: 'BIOINGINER',
        isActive: true,
        failedLoginAttempts: 0,
        updatedAt: new Date(),
      },
    });
  } catch (e) {
    // P2002: alt worker a creat userul simultan (race condition în teste paralele)
    if (e.code !== 'P2002') throw e;
  }

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
