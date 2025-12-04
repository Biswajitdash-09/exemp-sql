const db = require('../lib/localStorage.service');
const bcrypt = require('bcryptjs');

/**
 * localStorage seeding script
 * Run this script to populate localStorage with initial data
 */

// Helper function to generate ID
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

const employees = [
  {
    id: generateId(),
    employeeId: '6002056',
    name: 'S Sathish',
    email: 'sathish.s@company.com',
    entityName: 'TVSCSHIB',
    dateOfJoining: new Date('2021-02-05'),
    dateOfLeaving: new Date('2024-03-31'),
    designation: 'Executive',
    exitReason: 'Resigned',
    fnfStatus: 'Completed',
    department: 'HRD'
  },
  {
    id: generateId(),
    employeeId: '6002057',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@company.com',
    entityName: 'TVSCSHIB',
    dateOfJoining: new Date('2020-03-15'),
    dateOfLeaving: new Date('2024-01-20'),
    designation: 'Assistant Manager',
    exitReason: 'Resigned',
    fnfStatus: 'Completed',
    department: 'Technology'
  },
  {
    id: generateId(),
    employeeId: '6002058',
    name: 'Priya Sharma',
    email: 'priya.sharma@company.com',
    entityName: 'HIB',
    dateOfJoining: new Date('2019-07-10'),
    dateOfLeaving: new Date('2023-12-15'),
    designation: 'Manager',
    exitReason: 'Resigned',
    fnfStatus: 'Pending',
    department: 'Finance'
  },
  {
    id: generateId(),
    employeeId: '6002059',
    name: 'Amit Patel',
    email: 'amit.patel@company.com',
    entityName: 'TVSCSHIB',
    dateOfJoining: new Date('2021-06-01'),
    dateOfLeaving: new Date('2023-11-30'),
    designation: 'Executive',
    exitReason: 'Terminated',
    fnfStatus: 'Completed',
    department: 'Sales'
  },
  {
    id: generateId(),
    employeeId: '6002060',
    name: 'Neha Gupta',
    email: 'neha.gupta@company.com',
    entityName: 'HIB',
    dateOfJoining: new Date('2018-09-05'),
    dateOfLeaving: new Date('2022-08-25'),
    designation: 'Executive',
    exitReason: 'Terminated',
    fnfStatus: 'Completed',
    department: 'Marketing'
  },
  {
    id: generateId(),
    employeeId: '6002061',
    name: 'Vikram Singh',
    email: 'vikram.singh@company.com',
    entityName: 'TVSCSHIB',
    dateOfJoining: new Date('2020-01-20'),
    dateOfLeaving: new Date('2024-02-29'),
    designation: 'Manager',
    exitReason: 'Contract Completed',
    fnfStatus: 'Completed',
    department: 'Operations'
  },
  {
    id: generateId(),
    employeeId: '6002062',
    name: 'Anjali Reddy',
    email: 'anjali.reddy@company.com',
    entityName: 'HIB',
    dateOfJoining: new Date('2019-04-15'),
    dateOfLeaving: new Date('2023-09-10'),
    designation: 'Assistant Manager',
    exitReason: 'Absconding',
    fnfStatus: 'Pending',
    department: 'HR'
  },
  {
    id: generateId(),
    employeeId: '6002063',
    name: 'Mohammad Ali',
    email: 'mohammad.ali@company.com',
    entityName: 'TVSCSHIB',
    dateOfJoining: new Date('2021-11-10'),
    dateOfLeaving: new Date('2024-04-15'),
    designation: 'Executive',
    exitReason: 'Resigned',
    fnfStatus: 'Completed',
    department: 'Finance'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting localStorage seeding...');
    
    // Initialize localStorage data
    if (typeof db.initializeData === 'function') {
      db.initializeData();
    } else {
      // Initialize manually if method doesn't exist
      const STORAGE_KEYS = {
        EMPLOYEES: 'employees',
        VERIFIERS: 'verifiers',
        ADMINS: 'admins',
        VERIFICATION_RECORDS: 'verification_records',
        APPEALS: 'appeals',
        AUTH_TOKEN: 'auth_token'
      };
      
      const defaults = {
        [STORAGE_KEYS.EMPLOYEES]: [],
        [STORAGE_KEYS.VERIFIERS]: [],
        [STORAGE_KEYS.ADMINS]: [],
        [STORAGE_KEYS.VERIFICATION_RECORDS]: [],
        [STORAGE_KEYS.APPEALS]: []
      };

      Object.keys(defaults).forEach(key => {
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, JSON.stringify(defaults[key]));
        }
      });
    }
    console.log('✅ localStorage initialized successfully');

    // Clear existing data
    if (typeof db.clearAllData === 'function') {
      db.clearAllData();
    } else {
      // Clear manually
      localStorage.removeItem('employees');
      localStorage.removeItem('verifiers');
      localStorage.removeItem('admins');
      localStorage.removeItem('verification_records');
      localStorage.removeItem('appeals');
    }
    console.log('🗑️  Cleared existing localStorage data');

    // Seed employees
    let employeeCount = 0;
    const currentEmployees = db.getData ? db.getData('employees') : [];
    const newEmployees = [];
    
    for (const employeeData of employees) {
      const existingEmployee = currentEmployees.find(emp => emp.employeeId === employeeData.employeeId);
      
      if (!existingEmployee) {
        newEmployees.push({
          ...employeeData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        employeeCount++;
        console.log(`✅ Created employee: ${employeeData.name} (${employeeData.employeeId})`);
      } else {
        console.log(`ℹ️  Employee already exists: ${existingEmployee.name} (${existingEmployee.employeeId})`);
        newEmployees.push(existingEmployee);
      }
    }
    db.setData('employees', newEmployees);

    // Hash passwords and seed admin users
    let adminCount = 0;
    const adminUsers = [
      {
        id: generateId(),
        username: 'admin',
        email: 'admin@company.com',
        password: 'admin123',
        fullName: 'System Administrator',
        role: 'super_admin',
        department: 'IT',
        permissions: ['view_appeals', 'manage_appeals', 'view_employees', 'manage_employees', 'send_emails', 'view_reports', 'manage_admins'],
        isActive: true
      },
      {
        id: generateId(),
        username: 'hr_manager',
        email: 'hr@company.com',
        password: 'hr123',
        fullName: 'HR Manager',
        role: 'hr_manager',
        department: 'Human Resources',
        permissions: ['view_appeals', 'manage_appeals', 'view_employees', 'send_emails', 'view_reports'],
        isActive: true
      }
    ];

    const currentAdmins = db.getData('admins');
    const newAdmins = [];
    
    for (const adminData of adminUsers) {
      const existingAdmin = currentAdmins.find(admin => admin.username === adminData.username);
      
      if (!existingAdmin) {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(adminData.password, salt);
        
        newAdmins.push({
          ...adminData,
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        adminCount++;
        console.log(`✅ Created admin: ${adminData.fullName} (${adminData.username})`);
      } else {
        console.log(`ℹ️  Admin already exists: ${existingAdmin.fullName} (${existingAdmin.username})`);
        newAdmins.push(existingAdmin);
      }
    }
    db.setData('admins', newAdmins);

    // Hash passwords and seed verifier users
    let verifierCount = 0;
    const verifierUsers = [
      {
        id: generateId(),
        companyName: 'codemate.ai',
        email: 'adityamathan@codemateai.dev',
        password: 'Aditya@12345',
        isEmailVerified: true,
        isActive: true,
        verificationRequests: []
      }
    ];

    const currentVerifiers = db.getData('verifiers');
    const newVerifiers = [];
    
    for (const verifierData of verifierUsers) {
      const existingVerifier = currentVerifiers.find(verifier => verifier.email === verifierData.email);
      
      if (!existingVerifier) {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(verifierData.password, salt);
        
        newVerifiers.push({
          ...verifierData,
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        verifierCount++;
        console.log(`✅ Created verifier: ${verifierData.companyName} (${verifierData.email})`);
      } else {
        console.log(`ℹ️  Verifier already exists: ${existingVerifier.companyName} (${existingVerifier.email})`);
        newVerifiers.push(existingVerifier);
      }
    }
    db.setData('verifiers', newVerifiers);

    // Initialize empty collections
    db.setData('verification_records', []);
    db.setData('appeals', []);

    console.log('\n🎉 localStorage seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Employees: ${employeeCount} new records`);
    console.log(`   - Admins: ${adminCount} new records`);
    console.log(`   - Verifiers: ${verifierCount} new records`);
    console.log(`   - Total Employees: ${db.getData('employees').length}`);
    console.log(`   - Total Admins: ${db.getData('admins').length}`);
    console.log(`   - Total Verifiers: ${db.getData('verifiers').length}`);

    // Display login credentials
    console.log('\n🔐 Default Login Credentials:');
    console.log('   Admin (Super Admin):');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ');
    console.log('   HR Manager:');
    console.log('   Username: hr_manager');
    console.log('   Password: hr123');
    console.log('   ');
    console.log('   Verifier (Company):');
    console.log('   Email: adityamathan@codemateai.dev');
    console.log('   Password: Aditya@12345');

  } catch (error) {
    console.error('❌ localStorage seeding failed:', error);
    process.exit(1);
  }
}

// Verify we're running in Node.js environment
if (typeof window === 'undefined') {
  // For Node.js environment, simulate localStorage
  if (typeof global !== 'undefined' && !global.localStorage) {
    global.localStorage = {
      data: {},
      getItem: function(key) {
        return this.data[key] || null;
      },
      setItem: function(key, value) {
        this.data[key] = value;
      },
      removeItem: function(key) {
        delete this.data[key];
      },
      clear: function() {
        this.data = {};
      }
    };
    
    // Also set on window for uniformity
    global.window = global;
  }
  
  seedDatabase();
} else {
  console.error('❌ This script must be run in a Node.js environment');
}

module.exports = seedDatabase;