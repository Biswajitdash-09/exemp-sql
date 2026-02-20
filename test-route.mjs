
// Simulate Next.js API Request
import { POST } from './app/api/auth/register/route.js';

// Mock Request object
class MockRequest {
    constructor(body) {
        this.json = async () => body;
        this.headers = new Map();
        this.headers.set('x-forwarded-for', '127.0.0.1');
        this.headers.set('user-agent', 'Test Script');
        this.headers.get = (key) => this.headers.get(key);
    }
}

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
