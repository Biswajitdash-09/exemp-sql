/**
 * Server-side database seeding script
 * Run with: node scripts/seed-database.js
 */

const { readStorage, writeStorage } = require('../lib/fileStorage.service.js');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    console.log('🌱 Seeding database with test data...');

    // Hash passwords
    const hashPassword = async (password) => {
        return await bcrypt.hash(password, 10);
    };

    // Employee data
    const employees = [
        {
            id: '_emp1',
            employeeId: '6002056',
            name: 'S Sathish',
            email: 'sathish.s@company.com',
            entityName: 'TVSCSHIB',
            dateOfJoining: '2021-02-05',
            dateOfLeaving: '2024-03-31',
            designation: 'Executive',
            exitReason: 'Resigned',
            fnfStatus: 'Completed',
            department: 'HRD',
            createdAt: new Date().toISOString()
        },
        {
            id: '_emp2',
            employeeId: '6002057',
            name: 'Rajesh Kumar',
            email: 'rajesh.kumar@company.com',
            entityName: 'TVSCSHIB',
            dateOfJoining: '2020-03-15',
            dateOfLeaving: '2024-01-20',
            designation: 'Assistant Manager',
            exitReason: 'Resigned',
            fnfStatus: 'Completed',
            department: 'Technology',
            createdAt: new Date().toISOString()
        },
        {
            id: '_emp3',
            employeeId: '6002058',
            name: 'Priya Sharma',
            email: 'priya.sharma@company.com',
            entityName: 'HIB',
            dateOfJoining: '2019-07-10',
            dateOfLeaving: '2023-12-15',
            designation: 'Manager',
            exitReason: 'Resigned',
            fnfStatus: 'Pending',
            department: 'Finance',
            createdAt: new Date().toISOString()
        }
    ];

    // Admin users (with hashed passwords)
    const admins = [
        {
            id: '_admin1',
            username: 'admin',
            email: 'admin@company.com',
            password: await hashPassword('admin123'),
            fullName: 'System Administrator',
            role: 'super_admin',
            department: 'IT',
            permissions: ['view_appeals', 'manage_appeals', 'view_employees', 'manage_employees', 'send_emails', 'view_reports', 'manage_admins'],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: '_admin2',
            username: 'hr_manager',
            email: 'hr@company.com',
            password: await hashPassword('hr123'),
            fullName: 'HR Manager',
            role: 'hr_manager',
            department: 'Human Resources',
            permissions: ['view_appeals', 'manage_appeals', 'view_employees', 'send_emails', 'view_reports'],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    // Get current storage
    const storage = readStorage();

    // Update with seed data
    storage.employees = employees;
    storage.admins = admins;
    storage.verifiers = storage.verifiers || []; // Keep existing verifiers
    storage.verification_records = storage.verification_records || [];
    storage.appeals = storage.appeals || [];
    storage.dashboard_stats = null;

    // Write back to storage
    writeStorage(storage);

    console.log('✅ Database seeded successfully!');
    console.log('📊 Data Summary:');
    console.log('   - Employees:', employees.length);
    console.log('   - Admins:', admins.length);
    console.log('   - Verifiers:', storage.verifiers.length);
    console.log('');
    console.log('🔐 Admin Login Credentials:');
    console.log('   Admin - Username: admin, Password: admin123');
    console.log('   HR Manager - Username: hr_manager, Password: hr123');
    console.log('');
    console.log('🧪 Sample Employee IDs for testing:');
    employees.forEach(emp => {
        console.log(`   - ${emp.employeeId}: ${emp.name} (${emp.designation}, ${emp.entityName})`);
    });
}

// Run seeding
seedDatabase()
    .then(() => {
        console.log('\n✅ Seeding complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });
