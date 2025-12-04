import { NextResponse } from 'next/server';
import { extractTokenFromHeader } from '@/lib/auth';
import db from '@/lib/localStorage.service';

export async function GET(request) {
  try {
    // Extract and verify token
    const token = extractTokenFromHeader(request);
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Access token is required'
      }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/auth');
    const decoded = verifyToken(token);
    
    if (decoded.role !== 'verifier') {
      return NextResponse.json({
        success: false,
        message: 'Verifier access required'
      }, { status: 403 });
    }

    // Get verifier details from localStorage
    const verifier = db.findVerifierById(decoded.id);

    if (!verifier) {
      return NextResponse.json({
        success: false,
        message: 'Verifier not found'
      }, { status: 404 });
    }

    // Return verifier data (without password)
    const { password, ...verifierData } = verifier;

    return NextResponse.json({
      success: true,
      data: verifierData
    }, { status: 200 });

  } catch (error) {
    console.error('Get profile error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // Extract and verify token
    const token = extractTokenFromHeader(request);
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Access token is required'
      }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/auth');
    const decoded = verifyToken(token);
    
    if (decoded.role !== 'verifier') {
      return NextResponse.json({
        success: false,
        message: 'Verifier access required'
      }, { status: 403 });
    }

    const body = await request.json();

    // Only allow updating certain fields
    const allowedUpdates = {};
    if (body.companyName) {
      allowedUpdates.companyName = body.companyName.trim();
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid fields to update'
      }, { status: 400 });
    }

    // Update verifier in localStorage
    const updatedVerifier = db.updateVerifier(decoded.id, allowedUpdates);

    if (!updatedVerifier) {
      return NextResponse.json({
        success: false,
        message: 'Verifier not found'
      }, { status: 404 });
    }

    // Return updated data (without password)
    const { password, ...verifierData } = updatedVerifier;

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: verifierData
    }, { status: 200 });

  } catch (error) {
    console.error('Update profile error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}