
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkUser() {
  const email = 'biswajit.dash@codemateai.dev';
  console.log(`Checking for user: ${email}...`);
  
  try {
    const user = await prisma.verifier.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (user) {
      console.log('✅ User FOUND:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('❌ User NOT FOUND');
    }

    console.log('\n--- Recent Access Logs (Last 5) ---');
    const logs = await prisma.accessLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    if (logs.length > 0) {
      console.log(JSON.stringify(logs, null, 2));
    } else {
      console.log('No access logs found.');
    }

  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkUser();
