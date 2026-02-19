
import prisma from './lib/prisma.js';

async function diagnose() {
  const email = 'biswajit.dash@codemateai.dev';
  console.log(`--- Diagnosing login for ${email} ---`);

  try {
    // Check Verifier
    const verifier = await prisma.verifier.findUnique({
      where: { email }
    });

    if (verifier) {
      console.log('✅ Verifier record found:');
      console.log(`   - ID: ${verifier.id}`);
      console.log(`   - Is Active: ${verifier.isActive}`);
      console.log(`   - Is Email Verified: ${verifier.isEmailVerified}`);
      console.log(`   - Password Hash Start: ${verifier.password.substring(0, 10)}...`);
      console.log(`   - Created At: ${verifier.createdAt}`);
    } else {
      console.log('❌ Verifier record NOT FOUND.');
    }

    // Check Access Logs
    console.log('\n--- Recent Access Logs ---');
    const logs = await prisma.accessLog.findMany({
      where: { email },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    if (logs.length > 0) {
      logs.forEach(log => {
        console.log(`[${log.timestamp.toISOString()}] ${log.action} - ${log.status} - ${log.failureReason || 'No reason provided'}`);
      });
    } else {
      console.log('No access logs found for this email.');
    }

    // Check all verifiers just in case
    const allVerifiers = await prisma.verifier.findMany({ select: { email: true } });
    console.log('\n--- All Registered Verifiers ---');
    allVerifiers.forEach(v => console.log(` - ${v.email}`));

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
