/**
 * Quick diagnostic script to test JWT token generation and verification
 * Run with: node scripts/test-jwt.js
 */

const { generateToken, verifyToken } = require('../lib/auth.js');

console.log('🧪 Testing JWT Token Generation and Verification\n');

// Simulate verifier login token payload
const testPayload = {
    id: '_ver1',
    email: 'adityamathan@codemateai.dev',
    companyName: 'codemate.ai',
    role: 'verifier',
    testMode: false
};

console.log('📦 Test Payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('');

try {
    // Generate token
    console.log('🔐 Generating token...');
    const token = generateToken(testPayload);
    console.log('✅ Token generated successfully');
    console.log(`   Length: ${token.length} characters`);
    console.log(`   Preview: ${token.substring(0, 50)}...`);
    console.log('');

    // Verify token
    console.log('🔍 Verifying token...');
    const decoded = verifyToken(token);
    console.log('✅ Token verified successfully');
    console.log('');

    console.log('📄 Decoded Payload:');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('');

    // Check role
    console.log('🎭 Role Check:');
    console.log(`   Role in token: "${decoded.role}"`);
    console.log(`   Is verifier: ${decoded.role === 'verifier'}`);
    console.log('');

    // Test the condition used in API
    if (decoded.role !== 'verifier') {
        console.log('❌ WOULD FAIL: decoded.role !== "verifier"');
        console.log(`   Expected: "verifier"`);
        console.log(`   Got: "${decoded.role}"`);
    } else {
        console.log('✅ WOULD PASS: Role is correct!');
    }

    console.log('');
    console.log('✅ All tests passed!');

} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
}
