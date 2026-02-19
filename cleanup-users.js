
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function main() {
  const emails = ['biswajit.dash@codemateai.dev', 'adityamathan@codemateai.dev'];
  console.log('🧹 Starting cleanup for:', emails.join(', '));

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    for (const email of emails) {
      console.log(`\n🔍 Processing: ${email}`);
      const normalizedEmail = email.toLowerCase().trim();

      // Find verifier
      const verifier = await prisma.verifier.findUnique({
        where: { email: normalizedEmail }
      });

      if (verifier) {
        console.log(`   - Found verifier ID: ${verifier.id}`);

        // Delete related data
        const deletedAttempts = await prisma.verificationAttempt.deleteMany({
          where: { verifierId: verifier.id }
        });
        console.log(`   - Deleted ${deletedAttempts.count} verification attempts`);

        const deletedLogs = await prisma.accessLog.deleteMany({
          where: { email: normalizedEmail }
        });
        console.log(`   - Deleted ${deletedLogs.count} access logs`);

        // Delete verifier
        await prisma.verifier.delete({
          where: { id: verifier.id }
        });
        console.log(`   ✅ Verifier ${normalizedEmail} deleted.`);
      } else {
        console.log(`   ℹ️ Verifier ${normalizedEmail} not found.`);
      }

      // Cleanup OTPs regardless of verifier existence
      const deletedOtps = await prisma.otp.deleteMany({
        where: { email: normalizedEmail }
      });
      if (deletedOtps.count > 0) {
        console.log(`   - Deleted ${deletedOtps.count} OTP records`);
      }
    }
    console.log('\n✨ Cleanup complete.');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
