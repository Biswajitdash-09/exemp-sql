import { NextResponse } from 'next/server';
import { schemas } from '@/lib/validation';
import { generateToken } from '@/lib/auth';
import { findVerifierByEmail, createVerifier, updateVerifier } from '@/lib/localStorage.service';

// Test configuration
const TEST_CONFIG = {
  TEST_EMAIL: 'testverifier@company.test',
  TEST_PASSWORD: 'TestVerifier@2024!',
  BYPASS_TOKEN: 'VERIFIER_TEST_BYPASS',
  TEST_MODE_TOKEN: 'TEST_BYPASS_2024!'
};

export async function POST(request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { error, value } = schemas.verifierLogin.validate(body);

    // Allow test bypass to skip validation for test credentials
    const isTestAttempt = body.email === TEST_CONFIG.TEST_EMAIL;

    if (error && !isTestAttempt) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
      }, { status: 400 });
    }

    const { email, password, bypassToken, testMode } = body;

    // Check for test mode bypass
    if (isTestAttempt && (
      password === TEST_CONFIG.TEST_PASSWORD ||
      (bypassToken === TEST_CONFIG.BYPASS_TOKEN) ||
      (testMode === TEST_CONFIG.TEST_MODE_TOKEN)
    )) {
      console.log('🧪 Test mode bypass activated for verifier login');

      // Find or create test verifier
      let verifier = findVerifierByEmail(TEST_CONFIG.TEST_EMAIL);

      if (!verifier) {
        // Create test verifier if not exists
        verifier = createVerifier({
          companyName: 'Test Company Inc',
          email: TEST_CONFIG.TEST_EMAIL,
          password: 'bypassed', // Doesn't matter for test mode
          isEmailVerified: true,
          isActive: true,
          testMode: true,
          bypassToken: TEST_CONFIG.BYPASS_TOKEN
        });
      } else {
        // Update verifier to ensure test mode is enabled
        updateVerifier(verifier.id, {
          isEmailVerified: true,
          isActive: true,
          testMode: true,
          bypassToken: TEST_CONFIG.BYPASS_TOKEN
        });
      }

      // Update last login time
      const updatedVerifier = updateVerifier(verifier.id, {
        lastLoginAt: new Date().toISOString()
      });

      // Generate JWT token with test mode indicator
      const token = generateToken({
        id: verifier.id,
        email: verifier.email,
        companyName: verifier.companyName,
        role: 'verifier',
        testMode: true,
        bypassToken: TEST_CONFIG.BYPASS_TOKEN
      });

      // Return response without sensitive data
      const verifierResponse = {
        id: verifier.id,
        companyName: verifier.companyName,
        email: verifier.email,
        isEmailVerified: true, // Bypass email verification in test mode
        lastLoginAt: updatedVerifier.lastLoginAt,
        createdAt: verifier.createdAt,
        testMode: true // Indicate this is test mode
      };

      return NextResponse.json({
        success: true,
        message: 'Test login successful - Test mode activated',
        data: {
          verifier: verifierResponse,
          token,
          testMode: true
        }
      }, { status: 200 });
    }

    // Normal authentication flow
    const { email: normalEmail, password: normalPassword } = value;

    // Debug: Log login attempt and check storage
    console.log('🔐 Login attempt for:', normalEmail.toLowerCase());

    const verifier = findVerifierByEmail(normalEmail.toLowerCase());

    // Debug: Log verifier lookup result
    console.log('🔍 Verifier lookup result:', verifier ? 'FOUND' : 'NOT FOUND');
    if (!verifier) {
      console.log('❌ Login failed: No verifier found with email', normalEmail.toLowerCase());
      console.log('💡 Tip: Check if registration completed successfully');
    } else {
      console.log('✅ Verifier found:', {
        id: verifier.id,
        email: verifier.email,
        companyName: verifier.companyName,
        hasPassword: !!verifier.password,
        passwordStartsWith: verifier.password?.substring(0, 4)
      });
    }

    if (!verifier) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Check if account is active
    if (!verifier.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      }, { status: 403 });
    }

    // Verify password - handle both bcrypt and plaintext for demo
    let isPasswordValid = false;
    if (verifier.password.startsWith('$2') || verifier.password.startsWith('$2a') || verifier.password.startsWith('$2b')) {
      // Hashed password - use bcrypt
      const bcrypt = require('bcryptjs');
      isPasswordValid = await bcrypt.compare(normalPassword, verifier.password);
    } else {
      // Plain text password for demo
      isPasswordValid = normalPassword === verifier.password;
    }

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Update last login time
    const updatedVerifier = updateVerifier(verifier.id, {
      lastLoginAt: new Date().toISOString()
    });

    // Generate JWT token
    const token = generateToken({
      id: verifier.id,
      email: verifier.email,
      companyName: verifier.companyName,
      role: 'verifier',
      testMode: verifier.testMode || false
    });

    // Return response without sensitive data
    const verifierResponse = {
      id: verifier.id,
      companyName: verifier.companyName,
      email: verifier.email,
      isEmailVerified: verifier.isEmailVerified || verifier.testMode, // Auto-verify in test mode
      lastLoginAt: updatedVerifier.lastLoginAt,
      createdAt: verifier.createdAt,
      testMode: verifier.testMode || false
    };

    return NextResponse.json({
      success: true,
      message: verifier.testMode ? 'Test login successful' : 'Login successful',
      data: {
        verifier: verifierResponse,
        token,
        testMode: verifier.testMode || false
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json({
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}