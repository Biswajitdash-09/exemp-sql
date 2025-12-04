/**
 * Create Test Credentials Script
 * Creates special test credentials that bypass all authentication checkpoints
 * for testing all functionalities of the employee verification portal
 */

const bcrypt = require('bcryptjs');

// Test credentials configuration
const TEST_CONFIG = {
  // Special test mode activator - use this to enable test bypass
  TEST_MODE_TOKEN: 'TEST_BYPASS_2024!',
  
  // Test admin credentials
  ADMIN: {
    username: 'testadmin',
    password: 'TestAdmin@2024!',
    email: 'testadmin@verification.portal',
    fullName: 'Test Administrator',
    role: 'super_admin',
    bypassToken: 'ADMIN_TEST_BYPASS'
  },
  
  // Test verifier credentials
  VERIFIER: {
    companyName: 'Test Company Inc',
    email: 'testverifier@company.test',
    password: 'TestVerifier@2024!',
    bypassToken: 'VERIFIER_TEST_BYPASS'
  }
};

async function initializeLocalStorage() {
  if (typeof global !== 'undefined' && !global.localStorage) {
    global.localStorage = {
      data: {},
      getItem: function(key) { return this.data[key] || null; },
      setItem: function(key, value) { this.data[key] = value; },
      removeItem: function(key) { delete this.data[key]; },
      clear: function() { this.data = {}; }
    };
  }
  
  const { LocalStorageDB } = require('../lib/localStorage.service');
  return new LocalStorageDB();
}

async function createTestAdmin(db) {
  try {
    console.log('🔐 Creating test admin credentials...');
    
    // Check if test admin already exists
    const existingAdmin = db.findAdminByUsername(TEST_CONFIG.ADMIN.username);
    if (existingAdmin) {
      console.log('⚠️  Test admin already exists, updating...');
      // Update with fresh bypass token
      db.updateAdmin(existingAdmin.id, {
        password: existingAdmin.password, // Keep existing password
        bypassToken: TEST_CONFIG.ADMIN.bypassToken,
        isActive: true,
        testMode: true
      });
      console.log('✅ Test admin updated successfully');
      return existingAdmin;
    }

    // Create hashed password for test admin
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(TEST_CONFIG.ADMIN.password, salt);

    // Create test admin with bypass capabilities
    const testAdmin = db.createAdmin({
      username: TEST_CONFIG.ADMIN.username,
      email: TEST_CONFIG.ADMIN.email,
      password: hashedPassword,
      fullName: TEST_CONFIG.ADMIN.fullName,
      role: TEST_CONFIG.ADMIN.role,
      department: 'Testing',
      permissions: [
        'view_appeals', 
        'manage_appeals', 
        'view_employees', 
        'manage_employees', 
        'send_emails', 
        'view_reports', 
        'manage_admins'
      ],
      bypassToken: TEST_CONFIG.ADMIN.bypassToken,
      testMode: true,
      isActive: true
    });

    console.log('✅ Test admin created successfully!');
    return testAdmin;
  } catch (error) {
    console.error('❌ Error creating test admin:', error.message);
    throw error;
  }
}

async function createTestVerifier(db) {
  try {
    console.log('🔐 Creating test verifier credentials...');
    
    // Check if test verifier already exists
    const existingVerifier = db.findVerifierByEmail(TEST_CONFIG.VERIFIER.email);
    if (existingVerifier) {
      console.log('⚠️  Test verifier already exists, updating...');
      // Update with fresh bypass token
      db.updateVerifier(existingVerifier.id, {
        password: existingVerifier.password, // Keep existing password
        bypassToken: TEST_CONFIG.VERIFIER.bypassToken,
        isActive: true,
        isEmailVerified: true,
        testMode: true
      });
      console.log('✅ Test verifier updated successfully');
      return existingVerifier;
    }

    // Create hashed password for test verifier
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(TEST_CONFIG.VERIFIER.password, salt);

    // Create test verifier with bypass capabilities
    const testVerifier = db.createVerifier({
      companyName: TEST_CONFIG.VERIFIER.companyName,
      email: TEST_CONFIG.VERIFIER.email,
      password: hashedPassword,
      bypassToken: TEST_CONFIG.VERIFIER.bypassToken,
      isActive: true,
      isEmailVerified: true,
      testMode: true,
      verificationRequests: []
    });

    console.log('✅ Test verifier created successfully!');
    return testVerifier;
  } catch (error) {
    console.error('❌ Error creating test verifier:', error.message);
    throw error;
  }
}

function createTestInstructions() {
  console.log('\n📋 TEST CREDENTIALS INSTRUCTIONS');
  console.log('=====================================');
  console.log('\n🔧 ADMIN LOGIN:');
  console.log(`   Username: ${TEST_CONFIG.ADMIN.username}`);
  console.log(`   Password: ${TEST_CONFIG.ADMIN.password}`);
  console.log(`   Bypass Token: ${TEST_CONFIG.ADMIN.bypassToken}`);
  console.log(`   Email: ${TEST_CONFIG.ADMIN.email}`);
  
  console.log('\n🔧 VERIFIER LOGIN:');
  console.log(`   Email: ${TEST_CONFIG.VERIFIER.email}`);
  console.log(`   Password: ${TEST_CONFIG.VERIFIER.password}`);
  console.log(`   Bypass Token: ${TEST_CONFIG.VERIFIER.bypassToken}`);
  console.log(`   Company: ${TEST_CONFIG.VERIFIER.companyName}`);
  
  console.log('\n🚀 TEST MODE FEATURES:');
  console.log('   • Bypasses all email verification');
  console.log('   • Bypasses all authentication checkpoints');
  console.log('   • Full admin permissions');
  console.log('   • Access to all system features');
  console.log('   • Test data isolation');
  
  console.log('\n⚡ QUICK TESTING:');
  console.log('   1. Use these credentials to login as admin/verifier');
  console.log('   2. System will automatically detect test mode');
  console.log('   3. All restrictions are bypassed for testing');
  console.log('   4. You can test all features without limitations');
  
  console.log('\n🔒 SECURITY NOTE:');
  console.log('   These credentials are for TESTING ONLY!');
  console.log('   Never use in production environments.');
  console.log(`   Test Mode Token: ${TEST_CONFIG.TEST_MODE_TOKEN}`);
}

async function createSampleTestData(db) {
  console.log('\n📊 Creating sample test data...');
  
  // Create sample employees
  const employees = [
    {
      employeeId: 'TEST001',
      name: 'John Doe',
      email: 'john.doe@testcorp.com',
      entityName: 'TVSCSHIB',
      dateOfJoining: '2023-01-15',
      dateOfLeaving: '2024-03-20',
      designation: 'Manager',
      exitReason: 'Resigned',
      department: 'Engineering',
      fnfStatus: 'Completed'
    },
    {
      employeeId: 'TEST002',
      name: 'Jane Smith',
      email: 'jane.smith@testcorp.com',
      entityName: 'HIB',
      dateOfJoining: '2022-06-10',
      dateOfLeaving: '2024-01-30',
      designation: 'Assistant Manager',
      exitReason: 'Contract Completed',
      department: 'Sales',
      fnfStatus: 'Pending'
    }
  ];
  
  // Store employees using the existing data structure
  const existingEmployees = db.getData('employees') || [];
  employees.forEach(emp => {
    if (!existingEmployees.find(e => e.employeeId === emp.employeeId)) {
      existingEmployees.push({
        ...emp,
        id: db.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });
  db.setData('employees', existingEmployees);
  
  // Create sample verification records
  const verificationRecords = [
    {
      verifierId: db.findVerifierByEmail(TEST_CONFIG.VERIFIER.email)?.id,
      employeeId: 'TEST001',
      verificationId: 'VER000001',
      status: 'approved',
      verifiedAt: new Date().toISOString(),
      data: {
        name: 'John Doe',
        designation: 'Manager',
        dateOfJoining: '2023-01-15',
        dateOfLeaving: '2024-03-20'
      }
    },
    {
      verifierId: db.findVerifierByEmail(TEST_CONFIG.VERIFIER.email)?.id,
      employeeId: 'TEST002', 
      verificationId: 'VER000002',
      status: 'pending',
      verifiedAt: null,
      data: {
        name: 'Jane Smith',
        designation: 'Assistant Manager', 
        dateOfJoining: '2022-06-10',
        dateOfLeaving: '2024-01-30'
      }
    }
  ];
  
  const existingRecords = db.getData('verification_records') || [];
  verificationRecords.forEach(record => {
    if (!existingRecords.find(r => r.verificationId === record.verificationId)) {
      existingRecords.push({
        ...record,
        id: db.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });
  db.setData('verification_records', existingRecords);
  
  // Create sample appeals
  const appeals = [
    {
      appealId: 'APL000001',
      verificationId: 'VER000002',
      employeeId: 'TEST002',
      employeeName: 'Jane Smith',
      verifierEmail: TEST_CONFIG.VERIFIER.email,
      status: 'pending',
      comments: 'There seems to be a discrepancy in the employment dates. Please review.',
      mismatchedFields: [
        {
          fieldName: 'dateOfLeaving',
          verifierValue: '2024-01-30',
          companyValue: '2024-02-15'
        }
      ],
      submittedAt: new Date().toISOString()
    }
  ];
  
  const existingAppeals = db.getData('appeals') || [];
  appeals.forEach(appeal => {
    if (!existingAppeals.find(a => a.appealId === appeal.appealId)) {
      existingAppeals.push({
        ...appeal,
        id: db.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });
  db.setData('appeals', existingAppeals);
  
  console.log('✅ Sample test data created successfully!');
}

async function main() {
  try {
    console.log('🚀 Creating Test Credentials for Employee Verification Portal');
    console.log('=========================================================');
    
    // Initialize localStorage and database
    const db = await initializeLocalStorage();
    
    // Create test credentials
    await createTestAdmin(db);
    await createTestVerifier(db);
    
    // Create sample test data
    await createSampleTestData(db);
    
    // Display instructions
    createTestInstructions();
    
    console.log('\n✅ Test credentials setup completed successfully!');
    console.log('🎯 You can now test all portal functionalities.');
    
  } catch (error) {
    console.error('❌ Failed to create test credentials:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  TEST_CONFIG,
  createTestAdmin,
  createTestVerifier,
  main
};

// Run if called directly
if (require.main === module) {
  main();
}