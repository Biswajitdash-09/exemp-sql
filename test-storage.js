// Quick test script to verify file storage is working
const { readStorage, writeStorage } = require('./lib/fileStorage.service.js');

console.log('=== Testing File Storage ===');

// Test 1: Read storage
console.log('\n1. Reading storage:');
const data = readStorage();
console.log('Storage data:', JSON.stringify(data, null, 2));

// Test 2: Check if verifiers exist
console.log('\n2. Checking verifiers:');
console.log('Verifiers count:', data.verifiers ? data.verifiers.length : 0);
if (data.verifiers && data.verifiers.length > 0) {
    console.log('First verifier:', data.verifiers[0]);
}

console.log('\n=== Test Complete ===');
