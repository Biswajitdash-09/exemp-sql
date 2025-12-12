/**
 * Check ALL email logs to debug delivery issues
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkAllEmailLogs() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!\n');

        // Check ALL recent email logs
        const allEmailLogs = await mongoose.connection.collection('email_logs')
            .find({})
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();

        console.log(`📧 ALL Recent Email Logs (last 20):`);
        if (allEmailLogs.length === 0) {
            console.log('   ❌ No email logs found at all! Email logging may be broken.');
        } else {
            allEmailLogs.forEach((log, i) => {
                console.log(`\n   ${i + 1}. To: ${log.recipient || log.to}`);
                console.log(`      Subject: ${log.subject}`);
                console.log(`      Provider: ${log.provider}`);
                console.log(`      Status: ${log.status}`);
                console.log(`      Date: ${log.createdAt}`);
                if (log.error) console.log(`      Error: ${log.error}`);
                if (log.messageId) console.log(`      MessageId: ${log.messageId}`);
            });
        }

        // Check ALL recent OTPs
        const allOtps = await mongoose.connection.collection('otps')
            .find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        console.log(`\n\n🔑 ALL Recent OTPs (last 10):`);
        allOtps.forEach((otp, i) => {
            console.log(`\n   ${i + 1}. Email: ${otp.email}`);
            console.log(`      OTP: ${otp.otp}`);
            console.log(`      Created: ${otp.createdAt}`);
            console.log(`      Expires: ${otp.expiresAt}`);
            console.log(`      Verified: ${otp.verified || false}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAllEmailLogs();
