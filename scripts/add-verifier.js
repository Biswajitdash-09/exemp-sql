/**
 * Add the verifier user to server-side storage
 * Run with: node scripts/add-verifier.js
 */

const { readStorage, writeStorage } = require('../lib/fileStorage.service.js');

async function addVerifier() {
    console.log('🔐 Adding verifier to server storage...');

    try {
        // Get current storage
        const storage = readStorage();
        console.log('📊 Current storage state:', {
            employees: storage.employees?.length || 0,
            verifiers: storage.verifiers?.length || 0,
            admins: storage.admins?.length || 0
        });

        // Check if verifier already exists
        const existingVerifier = storage.verifiers?.find(
            v => v.email.toLowerCase() === 'adityamathan@codemateai.dev'
        );

        if (existingVerifier) {
            console.log('ℹ️  Verifier already exists:');
            console.log(`   ID: ${existingVerifier.id}`);
            console.log(`   Company: ${existingVerifier.companyName}`);
            console.log(`   Email: ${existingVerifier.email}`);
            console.log(`   Active: ${existingVerifier.isActive}`);
            console.log(`   Email Verified: ${existingVerifier.isEmailVerified}`);
            return;
        }

        // Initialize verifiers array if it doesn't exist
        if (!storage.verifiers) {
            storage.verifiers = [];
        }

        // Create new verifier with plain text password (as per seed-data.js)
        const newVerifier = {
            id: '_ver1',
            companyName: 'codemate.ai',
            email: 'adityamathan@codemateai.dev',
            password: 'Aditya@12345', // Plain text password for demo
            isEmailVerified: true,
            isActive: true,
            verificationRequests: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add verifier to storage
        storage.verifiers.push(newVerifier);

        // Write back to storage
        const success = writeStorage(storage);

        if (success) {
            console.log('✅ Verifier added successfully!');
            console.log('');
            console.log('🔐 Login Credentials:');
            console.log('   Email: adityamathan@codemateai.dev');
            console.log('   Password: Aditya@12345');
            console.log('   Company: codemate.ai');
            console.log('');
            console.log('📊 Updated storage state:', {
                employees: storage.employees?.length || 0,
                verifiers: storage.verifiers?.length || 0,
                admins: storage.admins?.length || 0
            });
        } else {
            console.error('❌ Failed to write to storage');
        }
    } catch (error) {
        console.error('❌ Error adding verifier:', error);
        throw error;
    }
}

// Run the script
addVerifier()
    .then(() => {
        console.log('\n✅ Operation complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Operation failed:', error);
        process.exit(1);
    });
