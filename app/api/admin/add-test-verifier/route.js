import { NextResponse } from 'next/server';
import db from '@/lib/localStorage.service';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    // Check if verifier already exists
    const existingVerifier = db.findVerifierByEmail('adityamathan@codemateai.dev');
    
    if (existingVerifier) {
      return NextResponse.json({
        success: true,
        message: 'Test verifier already exists',
        data: {
          companyName: existingVerifier.companyName,
          email: existingVerifier.email
        }
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Aditya@12345', salt);

    // Create test verifier
    const newVerifier = db.createVerifier({
      companyName: 'codemate.ai',
      email: 'adityamathan@codemateai.dev',
      password: hashedPassword,
      isEmailVerified: true,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      message: 'Test verifier created successfully',
      data: {
        companyName: 'codemate.ai',
        email: 'adityamathan@codemateai.dev',
        password: 'Aditya@12345'
      }
    });

  } catch (error) {
    console.error('Error creating test verifier:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create test verifier',
      error: error.message
    }, { status: 500 });
  }
}