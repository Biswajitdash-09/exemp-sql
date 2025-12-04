/**
 * Check all verifiers in server-side storage
 * Run with: node scripts/check-verifiers.js
 */

const { readStorage } = require('../lib/fileStorage.service.js');

function checkVerifiers() {
    console.log('📋 Checking verifiers in server storage...\n');

    try {
        // Get current storage
        const storage = readStorage();
        const verifiers = storage.verifiers || [];

        console.log(`Found ${verifiers.length} verifier(s):\n`);

        verifiers.forEach((verifier, index) => {
            console.log(`Verifier #${index + 1}:`);
            console.log(`   ID: ${verifier.id}`);
            console.log(`   Company: ${verifier.companyName}`);
            console.log(`   Email: ${verifier.email}`);
            console.log(`   Active: ${verifier.isActive}`);
            console.log(`   Email Verified: ${verifier.isEmailVerified}`);
            console.log(`   Password Type: ${verifier.password?.startsWith('$2') ? 'Hashed (bcrypt)' : 'Plain text'}`);
            console.log(`   Created: ${verifier.createdAt}`);
            console.log('');
        });

        // Look specifically for the target verifier
        const targetVerifier = verifiers.find(
            v => v.email.toLowerCase() === 'adityamathan@codemateai.dev'
        );

        if (targetVerifier) {
            console.log('✅ Target verifier found!');
            console.log('🔐 Login credentials:');
            console.log('   Email: adityamathan@codemateai.dev');
            console.log('   Password: Aditya@12345');
            console.log('   Status: Should be able to login now');
        } else {
            console.log('❌ Target verifier NOT found');
            console.log('   Looking for: adityamathan@codemateai.dev');
        }

    } catch (error) {
        console.error('❌ Error reading storage:', error);
    }
}

checkVerifiers();
