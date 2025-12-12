/**
 * Get test credentials from database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function getCredentials() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!\n');

        // Get admins
        const admins = await mongoose.connection.collection('admins')
            .find({})
            .project({ username: 1, email: 1, role: 1, isActive: 1 })
            .limit(5)
            .toArray();

        console.log('📋 ADMIN ACCOUNTS:');
        if (admins.length === 0) {
            console.log('   No admin accounts found!');
        } else {
            admins.forEach((admin, i) => {
                console.log(`\n   ${i + 1}. Username: ${admin.username}`);
                console.log(`      Email: ${admin.email}`);
                console.log(`      Role: ${admin.role}`);
                console.log(`      Active: ${admin.isActive}`);
            });
        }

        // Get verifiers
        const verifiers = await mongoose.connection.collection('verifiers')
            .find({})
            .project({ email: 1, companyName: 1, isActive: 1 })
            .limit(5)
            .toArray();

        console.log('\n\n📋 VERIFIER ACCOUNTS:');
        if (verifiers.length === 0) {
            console.log('   No verifier accounts found!');
        } else {
            verifiers.forEach((v, i) => {
                console.log(`\n   ${i + 1}. Email: ${v.email}`);
                console.log(`      Company: ${v.companyName}`);
                console.log(`      Active: ${v.isActive}`);
            });
        }

        console.log('\n\n💡 NOTE: Passwords are hashed and cannot be retrieved.');
        console.log('   For verifiers: Use OTP login (no password needed)');
        console.log('   For admins: Contact system administrator for password reset');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

getCredentials();
