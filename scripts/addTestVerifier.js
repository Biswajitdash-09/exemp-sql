// Simple script to add test verifier directly to localStorage
const db = require('../lib/localStorage.service');
const bcrypt = require('bcryptjs');

async function addTestVerifier() {
  try {
    console.log('🔗 Initializing localStorage...');
    
    // Initialize localStorage for Node.js environment
    if (typeof global !== 'undefined' && !global.localStorage) {
      global.localStorage = {
        data: {},
        getItem: function(key) { return this.data[key] || null; },
        setItem: function(key, value) { this.data[key] = value; },
        removeItem: function(key) { delete this.data[key]; },
        clear: function() { this.data = {}; }
      };
    }
    
    db.initializeData();
    console.log('✅ localStorage initialized successfully');

    // Check if verifier already exists
    const existingVerifier = db.findVerifierByEmail('adityamathan@codemateai.dev');
    
    if (existingVerifier) {
      console.log('ℹ️  Verifier already exists:');
      console.log(`   Company: ${existingVerifier.companyName}`);
      console.log(`   Email: ${existingVerifier.email}`);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Aditya@12345', salt);

    // Create test verifier
    const testVerifier = db.createVerifier({
      companyName: 'codemate.ai',
      email: 'adityamathan@codemateai.dev',
      password: hashedPassword,
      isEmailVerified: true,
      isActive: true
    });
    
    console.log('✅ Test verifier created successfully!');
    console.log('🔐 Login Credentials:');
    console.log('   Email: adityamathan@codemateai.dev');
    console.log('   Password: Aditya@12345');
    console.log('   Company: codemate.ai');

  } catch (error) {
    console.error('❌ Error adding test verifier:', error.message);
  }
}

addTestVerifier();