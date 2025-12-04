/**
 * Diagnose the verifier login issue
 * Run with: node scripts/diagnose-login.js
 */

const { readStorage } = require('../lib/fileStorage.service.js');
const { generateToken, verifyToken } = require('../lib/auth.js');

console.log('🔍 Diagnosing Verifier Login Issue\n');

// Get storage
const storage = readStorage();
const verifiers = storage.verifiers || [];

console.log(`Found ${verifiers.length} verifier(s) in storage\n`);

// Find the target verifier
const targetEmail = 'adityamathan@codemateai.dev';
const targetVerifier = verifiers.find(v => v.email.toLowerCase() === targetEmail.toLowerCase());

if (!targetVerifier) {
    console.log(`❌ Target verifier ${targetEmail} NOT FOUND!`);
    process.exit(1);
}

console.log('✅ Target verifier found:');
console.log(JSON.stringify(targetVerifier, null, 2));
console.log('');

// Simulate what happens during login
console.log('🔐 Simulating login process...\n');

console.log('Step 1: Password check');
const passwordMatch = targetVerifier.password === 'Aditya@12345';
console.log(`   Password matches: ${passwordMatch ? '✅ YES' : '❌ NO'}`);
console.log(`   Stored password: ${targetVerifier.password}`);
console.log('');

console.log('Step 2: Token generation');
const tokenPayload = {
    id: targetVerifier.id,
    email: targetVerifier.email,
    companyName: targetVerifier.companyName,
    role: 'verifier',  // THIS IS WHAT THE LOGIN API SETS
    testMode: targetVerifier.testMode || false
};

console.log('   Token payload:');
console.log(JSON.stringify(tokenPayload, null, 2));

const token = generateToken(tokenPayload);
console.log(`   ✅ Token generated (${token.length} chars)`);
console.log('');

console.log('Step 3: Token verification (what API does)');
const decoded = verifyToken(token);
console.log('   Decoded token:');
console.log(JSON.stringify(decoded, null, 2));
console.log('');

console.log('Step 4: Role check (what causes the error)');
console.log(`   decoded.role: "${decoded.role}"`);
console.log(`   Expected: "verifier"`);
console.log(`   Match: ${decoded.role === 'verifier' ? '✅ YES' : '❌ NO'}`);

if (decoded.role !== 'verifier') {
    console.log('');
    console.log('❌ ROLE MISMATCH - This is the problem!');
    console.log(`   The API would return: "Verifier access required"`);
} else {
    console.log('');
    console.log('✅ Role check would PASS!');
    console.log('   The error must be coming from somewhere else...');
}

console.log('');
console.log('📋 What to check in browser:');
console.log('   1. Open DevTools → Console');
console.log('   2. Run: localStorage.getItem("verifier_session")');
console.log('   3. Check if the session contains a "token" field');
console.log('   4. Decode the token and check the "role" field');
console.log('');
console.log('🔧 Expected verifier_session format:');
const expectedSession = {
    ...targetVerifier,
    token: '<JWT_TOKEN_HERE>',
    userType: 'verifier'
};
delete expectedSession.password;  // Don't include password in session
console.log(JSON.stringify(expectedSession, null, 2));
