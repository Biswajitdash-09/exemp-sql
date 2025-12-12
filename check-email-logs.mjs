/**
 * Check email logs for a specific user
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkEmailLogs(email) {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!\n');

        // Check email logs
        const emailLogs = await mongoose.connection.collection('email_logs')
            .find({ to: email.toLowerCase() })
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        console.log(`📧 Email logs for ${email}:`);
        if (emailLogs.length === 0) {
            console.log('   No email logs found for this user.');
        } else {
            emailLogs.forEach((log, i) => {
                console.log(`\n   ${i + 1}. Subject: ${log.subject}`);
                console.log(`      Provider: ${log.provider}`);
                console.log(`      Status: ${log.status}`);
                console.log(`      Date: ${log.createdAt}`);
                if (log.error) console.log(`      Error: ${log.error}`);
            });
        }

        // Check OTP records
        const otpRecords = await mongoose.connection.collection('otps')
            .find({ email: email.toLowerCase() })
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();

        console.log(`\n🔑 OTP records for ${email}:`);
        if (otpRecords.length === 0) {
            console.log('   No OTP records found.');
        } else {
            otpRecords.forEach((otp, i) => {
                console.log(`\n   ${i + 1}. OTP: ${otp.otp}`);
                console.log(`      Created: ${otp.createdAt}`);
                console.log(`      Expires: ${otp.expiresAt}`);
                console.log(`      Verified: ${otp.verified || false}`);
            });
        }

        // Check verifier record
        const verifier = await mongoose.connection.collection('verifiers')
            .findOne({ email: email.toLowerCase() });

        console.log(`\n👤 Verifier record for ${email}:`);
        if (!verifier) {
            console.log('   No verifier account found - user needs to register first.');
        } else {
            console.log(`   ID: ${verifier._id}`);
            console.log(`   Company: ${verifier.companyName}`);
            console.log(`   Registered: ${verifier.createdAt}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkEmailLogs('aditya.mathan@codemateai.dev');
