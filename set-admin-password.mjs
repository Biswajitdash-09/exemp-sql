/**
 * Set admin password
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function setAdminPassword() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!\n');

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Update admin password
        const result = await mongoose.connection.collection('admins').updateOne(
            { username: 'admin' },
            { $set: { password: hashedPassword } }
        );

        if (result.modifiedCount > 0) {
            console.log('✅ Admin password updated successfully!');
            console.log('\n📋 ADMIN CREDENTIALS:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
            console.log('   Login URL: /admin/login');
        } else {
            console.log('❌ Admin user not found or password unchanged');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

setAdminPassword();
