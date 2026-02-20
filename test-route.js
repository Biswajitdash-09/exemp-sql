
// Simulate Next.js API Request
const { POST } = require('./app/api/auth/register/route.js');
const { NextResponse } = require('next/server');

// Mock Request object
class MockRequest {
    constructor(body) {
        this.body = body;
        this.headers = new Map();
        this.headers.set('x-forwarded-for', '127.0.0.1');
        this.headers.set('user-agent', 'Test Script');
    }

    async json() {
        return this.body;
    }
}

// Mock Environment
process.env.generated_value = 'mock-value';

async function runTest() {
    console.log('🚀 Starting Route Simulation...');
    
    const mockBody = {
        companyName: "Production Test Company",
        email: "prod.test.verifier@example.com",
        password: "password123",
        isBgvAgency: false
    };

    try {
        const req = new MockRequest(mockBody);
        const response = await POST(req);
        
        console.log('✅ Response Status:', response.status);
        const data = await response.json();
        console.log('📦 Response Data:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('❌ CRASHED:', error);
    }
}

runTest();
