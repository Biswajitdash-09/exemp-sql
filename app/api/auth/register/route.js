import { NextResponse } from 'next/server';
import { schemas } from '@/lib/validation';
import { generateToken } from '@/lib/auth';
import { findVerifierByEmail, addVerifier, logAccess } from '@/lib/data.service';
import bcrypt from 'bcryptjs';

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

    const { error, value } = schemas.verifierRegistration.validate(body);

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { companyName, email, password, isBgvAgency } = value;
    requestEmail = email.toLowerCase();

    // Check if verifier already exists
    const existingVerifier = await findVerifierByEmail(requestEmail);
    if (existingVerifier) {
      await logAccess({
        email: requestEmail,
        role: 'verifier',
        action: 'REGISTER',
        status: 'FAILURE',
        failureReason: 'Account already exists',
        ipAddress,
        userAgent
      });

      return new Response(JSON.stringify({
        success: false,
        message: 'An account with this email already exists'
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Hash password before storing
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new verifier
    const newVerifier = await addVerifier({
      companyName,
      email: requestEmail,
      password: hashedPassword,
      isEmailVerified: true, 
      isActive: true,
      isBgvAgency: isBgvAgency || false
    });

    // Log success
    try {
      await logAccess({
        email: requestEmail,
        role: 'verifier',
        action: 'REGISTER',
        status: 'SUCCESS',
        ipAddress,
        userAgent,
        metadata: { companyName, isBgvAgency: !!isBgvAgency }
      });
    } catch (logError) {
      console.error('Logging failed, but registration succeeded:', logError);
    }

    // Generate JWT token
    const token = generateToken({
      id: newVerifier.id,
      email: newVerifier.email,
      companyName: newVerifier.companyName,
      role: 'verifier',
      isBgvAgency: newVerifier.isBgvAgency || false
    });

    // Return response without sensitive data
    const verifierResponse = {
      id: String(newVerifier.id),
      companyName: String(newVerifier.companyName),
      email: String(newVerifier.email),
      isBgvAgency: !!newVerifier.isBgvAgency,
      isEmailVerified: !!newVerifier.isEmailVerified,
      createdAt: newVerifier.createdAt ? newVerifier.createdAt.toISOString() : new Date().toISOString()
    };

    // Send welcome email (optional - will fail gracefully if not configured)
    try {
      // Use dynamic import with extra safety
      const emailService = await import('@/lib/services/emailService');
      if (emailService && emailService.sendWelcomeEmail) {
        await emailService.sendWelcomeEmail(newVerifier);
      }
    } catch (emailError) {
      console.log('Welcome email not sent (email service not configured or failed):', emailError.message);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Verifier registered successfully!',
      data: {
        verifier: verifierResponse,
        token
      }
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Registration error:', error);

    // Log the actual error to the database for debugging in production
    try {
      await logAccess({
        email: requestEmail,
        role: 'verifier',
        action: 'REGISTER',
        status: 'ERROR',
        failureReason: error.message || 'Unknown server error',
        ipAddress,
        userAgent,
        metadata: { stack: error.toString() } // Use toString() for safety
      });
    } catch (logError) {
      console.error('Failed to log registration error:', logError);
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}
