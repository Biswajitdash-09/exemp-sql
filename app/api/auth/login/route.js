import { NextResponse } from 'next/server';
import { schemas } from '@/lib/validation';
import { generateToken } from '@/lib/auth';
import { findVerifierByEmail, updateVerifier, logAccess } from '@/lib/data.service';
import bcrypt from 'bcryptjs';

// Test mode is controlled by environment variable - disabled in production
const isTestModeEnabled = process.env.NODE_ENV === 'development' && process.env.ENABLE_TEST_MODE === 'true';

export async function POST(request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { error, value } = schemas.verifierLogin.validate(body);

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
      }, { status: 400 });
    }

    // Normal authentication flow
    const { email: normalEmail, password: normalPassword } = value;

    // Debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Login attempt for:', normalEmail.toLowerCase());
    }

    const verifier = await findVerifierByEmail(normalEmail.toLowerCase());

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Verifier lookup result:', verifier ? 'FOUND' : 'NOT FOUND');
    }

    if (!verifier) {
      // Log failure (User not found)
      await logAccess({
        email: normalEmail.toLowerCase(),
        role: 'unknown',
        action: 'LOGIN',
        status: 'FAILURE',
        failureReason: 'User not found',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

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

    // Verify password - only bcrypt hashed passwords are supported
    let isPasswordValid = false;
    if (verifier.password && (verifier.password.startsWith('$2') || verifier.password.startsWith('$2a') || verifier.password.startsWith('$2b'))) {
      // Hashed password - use bcrypt
      isPasswordValid = await bcrypt.compare(normalPassword, verifier.password);
    } else {
      // No valid password hash found - reject login
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Password is not properly hashed for user:', normalEmail);
      }
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      // Log failure (Invalid password)
      await logAccess({
        email: verifier.email,
        role: 'verifier',
        action: 'LOGIN',
        status: 'FAILURE',
        failureReason: 'Invalid password',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Update last login time
    const updatedVerifier = await updateVerifier(verifier.id, {
      lastLoginAt: new Date()
    });

    // Log success
    await logAccess({
      email: verifier.email,
      role: 'verifier',
      action: 'LOGIN',
      status: 'SUCCESS',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        companyName: verifier.companyName
      }
    });

    // Generate JWT token
    const token = generateToken({
      id: verifier.id,
      email: verifier.email,
      companyName: verifier.companyName,
      role: 'verifier'
    });

    // Return response without sensitive data
    const verifierResponse = {
      id: verifier.id,
      companyName: verifier.companyName,
      email: verifier.email,
      isEmailVerified: verifier.isEmailVerified,
      lastLoginAt: updatedVerifier?.lastLoginAt || verifier.lastLoginAt,
      createdAt: verifier.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        verifier: verifierResponse,
        token
      }
    }, { status: 200 });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', error);
    }

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
