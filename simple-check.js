
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkUser() {
  const email = 'biswajit.dash@codemateai.dev';
  
  try {
    const user = await prisma.verifier.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (user) {
      console.log('USER_FOUND');
    } else {
      console.log('USER_NOT_FOUND');
    }

    const logs = await prisma.accessLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 3
    });
    
    console.log('---LOGS_START---');
    console.log(JSON.stringify(logs));
    console.log('---LOGS_END---');

  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkUser();
