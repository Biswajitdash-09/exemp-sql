require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'biswajit.dash@codemateai.dev';
  console.log(`🔍 Checking database for verifier: ${email}`);
  
  const verifier = await prisma.verifier.findUnique({
    where: { email: email.toLowerCase() }
  });
  
  if (verifier) {
    console.log('✅ Verifier FOUND:');
    console.log(JSON.stringify(verifier, null, 2));
  } else {
    console.log('❌ Verifier NOT FOUND.');
  }
}

main()
  .catch(e => console.error('Error:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
