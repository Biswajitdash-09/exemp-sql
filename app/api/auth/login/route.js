import { NextResponse } from 'next/server';
import { schemas } from '@/lib/validation';
import { generateToken } from '@/lib/auth';
import { findVerifierByEmail, updateVerifier, logAccess } from '@/lib/data.service';
import bcrypt from 'bcryptjs';

// Test mode is controlled by environment variable - disabled in production
const isTestModeEnabled = process.env.NODE_ENV === 'development' && process.env.ENABLE_TEST_MODE === 'true';

export async function POST(request) {
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  let requestEmail = 'unknown';

  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid JSON body'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { error, value } = schemas.verifierLogin.validate(body);

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Normal authentication flow
    const { email: rawEmail, password } = value;
    const email = rawEmail.toLowerCase().trim();
    requestEmail = email;

    // Debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Login attempt for: "${email}" (original: "${rawEmail}")`);
    }

    const verifier = await findVerifierByEmail(email);

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Verifier lookup result:', verifier ? 'FOUND' : 'NOT FOUND');
    }

    if (!verifier) {
      // Log failure (User not found)
      try {
        await logAccess({
          email: email,
          role: 'unknown',
          action: 'LOGIN',
          status: 'FAILURE',
          failureReason: 'User not found',
          ipAddress,
          userAgent
        });
      } catch (logError) {
        console.error('Failed to log login failure (User not found):', logError);
      }

      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid email or password'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if account is active
    if (!verifier.isActive) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify password - only bcrypt hashed passwords are supported
    let isPasswordValid = false;
    if (verifier.password && (verifier.password.startsWith('$2') || verifier.password.startsWith('$2a') || verifier.password.startsWith('$2b'))) {
      // Hashed password - use bcrypt
      isPasswordValid = await bcrypt.compare(password, verifier.password);
    } else {
      // No valid password hash found - reject login
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Password is not properly hashed for user:', email);
      }
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      // Log failure (Invalid password)
      try {
        await logAccess({
          email: verifier.email,
          role: 'verifier',
          action: 'LOGIN',
          status: 'FAILURE',
          failureReason: 'Invalid password',
          ipAddress,
          userAgent
        });
      } catch (logError) {
        console.error('Failed to log login failure (Invalid password):', logError);
      }

      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid email or password'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // Update last login time
    const updatedVerifier = await updateVerifier(verifier.id, {
      lastLoginAt: new Date()
    });

    // Log success
    try {
      await logAccess({
        email: verifier.email,
        role: 'verifier',
        action: 'LOGIN',
        status: 'SUCCESS',
        ipAddress,
        userAgent,
        metadata: {
          companyName: verifier.companyName
        }
      });
    } catch (logError) {
      console.error('Failed to log login success:', logError);
    }

    // Generate JWT token
    const token = generateToken({
      id: verifier.id,
      email: verifier.email,
      companyName: verifier.companyName,
      role: 'verifier'
    });

    // Return response without sensitive data
    const verifierResponse = {
      id: String(verifier.id),
      companyName: String(verifier.companyName),
      email: String(verifier.email),
      isEmailVerified: !!verifier.isEmailVerified,
      lastLoginAt: updatedVerifier?.lastLoginAt ? updatedVerifier.lastLoginAt.toISOString() : (verifier.lastLoginAt ? verifier.lastLoginAt.toISOString() : null),
      createdAt: verifier.createdAt ? verifier.createdAt.toISOString() : new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      message: 'Login successful',
      data: {
        verifier: verifierResponse,
        token
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Login error:', error);

    // Log the error
    try {
      await logAccess({
        email: requestEmail,
        role: 'unknown',
        action: 'LOGIN',
        status: 'ERROR',
        failureReason: error.message || 'Unknown server error',
        metadata: { stack: error.toString() },
        ipAddress,
        userAgent
      });
    } catch (logError) {
      console.error('Failed to log login error:', logError);
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function GET() {
  return new Response(JSON.stringify({
    success: false,
    message: 'Method not allowed'
  }), { status: 405, headers: { 'Content-Type': 'application/json' } });
}
