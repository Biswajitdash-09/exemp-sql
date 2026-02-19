require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'biswajit.dash@codemateai.dev';
  const password = 'biswajit.dash@codemateai.dev';
  
  console.log(`🔐 Setting password for: ${email}`);
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const verifier = await prisma.verifier.upsert({
    where: { email: email.toLowerCase() },
    update: { 
      password: hashedPassword,
      isActive: true,
      isEmailVerified: true
    },
    create: {
      email: email.toLowerCase(),
      password: hashedPassword,
      companyName: 'codemateai.dev',
      isActive: true,
      isEmailVerified: true
    }
  });
  
  console.log('✅ Password set successfully for verifier:', verifier.email);
}

main()
  .catch(e => console.error('Error:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
