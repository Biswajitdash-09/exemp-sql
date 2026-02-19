
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcryptjs');

async function testRegistration() {
  const companyName = "TEST COMPANY";
  const email = "test.verifier@example.com";
  const password = "password123";
  const isBgvAgency = true;

  console.log(`🚀 Testing registration for: ${email}`);

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Check if exists
    const existing = await prisma.verifier.findUnique({ where: { email } });
    if (existing) {
      console.log('⚠️ Test user already exists, deleting first...');
      await prisma.verifier.delete({ where: { email } });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('✅ Password hashed');

    // 3. Create verifier
    const newVerifier = await prisma.verifier.create({
      data: {
        companyName,
        email: email.toLowerCase(),
        password: hashedPassword,
        isEmailVerified: true,
        isActive: true,
        isBgvAgency: isBgvAgency
      }
    });

    console.log('✅ Verifier created:', newVerifier.id);

    // 4. Verify fields
    console.log('Verify fields:');
    console.log(' - ID:', newVerifier.id);
    console.log(' - Company Name:', newVerifier.companyName);
    console.log(' - Email:', newVerifier.email);
    console.log(' - Created At:', newVerifier.createdAt);

    // Cleanup
    await prisma.verifier.delete({ where: { id: newVerifier.id } });
    console.log('✅ Test cleanup successful');

  } catch (error) {
    console.error('❌ Registration test failed:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testRegistration();
