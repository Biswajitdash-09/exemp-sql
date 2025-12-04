import { NextResponse } from 'next/server';
import db from '@/lib/localStorage.service';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    // Find existing verifier
    const existingVerifier = db.findVerifierByEmail('adityamathan@codemateai.dev');
    
    if (!existingVerifier) {
      return NextResponse.json({
        success: false,
        message: 'Test verifier not found'
      }, { status: 404 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Aditya@12345', salt);

    // Update the verifier with properly hashed password
    const updatedVerifier = db.updateVerifier(existingVerifier.id, {
      password: hashedPassword,
      isEmailVerified: true,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      message: 'Test verifier password updated successfully',
      data: {
        companyName: updatedVerifier.companyName,
        email: updatedVerifier.email,
        password: 'Aditya@12345'
      }
    });

  } catch (error) {
    console.error('Error fixing test verifier:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to fix test verifier',
      error: error.message
    }, { status: 500 });
  }
}