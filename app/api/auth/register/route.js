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
    const body = await request.json();
    const { error, value } = schemas.verifierRegistration.validate(body);

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
      }, { status: 400 });
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

      return NextResponse.json({
        success: false,
        message: 'An account with this email already exists'
      }, { status: 409 });
    }

    // Hash password before storing
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new verifier
    const newVerifier = await addVerifier({
      companyName,
      email: requestEmail,
      password: hashedPassword,
      isEmailVerified: true, // Auto-verify for demo purposes
      isActive: true,
      isBgvAgency: isBgvAgency || false
    });

    // Log success
    await logAccess({
      email: requestEmail,
      role: 'verifier',
      action: 'REGISTER',
      status: 'SUCCESS',
      ipAddress,
      userAgent,
      metadata: { companyName, isBgvAgency: !!isBgvAgency }
    });

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
      const { sendWelcomeEmail } = await import('@/lib/services/emailService');
      await sendWelcomeEmail(newVerifier);
    } catch (emailError) {
      console.log('Welcome email not sent (email service not configured or failed):', emailError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Verifier registered successfully!',
      data: {
        verifier: verifierResponse,
        token
      }
    }, { status: 201 });

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
        metadata: { stack: error.stack }
      });
    } catch (logError) {
      console.error('Failed to log registration error:', logError);
    }

    return NextResponse.json({
      success: false,
      message: 'Registration failed. Please try again.',
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
