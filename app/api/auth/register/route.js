import { NextResponse } from 'next/server';
import { schemas } from '@/lib/validation';
import { generateToken } from '@/lib/auth';
import { findVerifierByEmail, createVerifier } from '@/lib/localStorage.service';

export async function POST(request) {
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

    const { companyName, email, password } = value;

    // Check if verifier already exists
    const existingVerifier = findVerifierByEmail(email.toLowerCase());
    if (existingVerifier) {
      return NextResponse.json({
        success: false,
        message: 'An account with this email already exists'
      }, { status: 409 });
    }

    // Hash password before storing
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new verifier
    const newVerifier = createVerifier({
      companyName,
      email: email.toLowerCase(),
      password: hashedPassword,
      isEmailVerified: true, // Auto-verify for demo purposes
      isActive: true
    });

    // Debug: Log the created verifier and all verifiers
    console.log('✅ New verifier created:', {
      id: newVerifier.id,
      email: newVerifier.email,
      companyName: newVerifier.companyName
    });

    // Verify the verifier was actually saved
    const savedVerifier = findVerifierByEmail(email.toLowerCase());
    console.log('🔍 Verification check - Saved verifier found:', savedVerifier ? 'YES' : 'NO');
    if (savedVerifier) {
      console.log('Saved verifier details:', {
        id: savedVerifier.id,
        email: savedVerifier.email,
        hasPassword: !!savedVerifier.password
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: newVerifier.id,
      email: newVerifier.email,
      companyName: newVerifier.companyName,
      role: 'verifier'
    });

    // Return response without sensitive data
    const verifierResponse = {
      id: newVerifier.id,
      companyName: newVerifier.companyName,
      email: newVerifier.email,
      isEmailVerified: newVerifier.isEmailVerified,
      createdAt: newVerifier.createdAt
    };

    // Send welcome email (optional - will fail gracefully if not configured)
    try {
      const { sendWelcomeEmail } = await import('@/lib/services/emailService');
      await sendWelcomeEmail(newVerifier);
    } catch (emailError) {
      console.log('Welcome email not sent (email service not configured):', emailError.message);
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