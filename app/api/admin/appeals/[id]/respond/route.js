import { NextResponse } from 'next/server';
import { extractTokenFromHeader } from '@/lib/auth';
import { schemas } from '@/lib/validation';
import db from '@/lib/localStorage.service';
import { sendAppealResponseEmail } from '@/lib/services/emailService';

export async function POST(request, { params }) {
  try {
    // Authenticate admin
    const token = extractTokenFromHeader(request);
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Access token is required'
      }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/auth');
    const decoded = verifyToken(token);
    
    if (!['admin', 'hr_manager', 'super_admin'].includes(decoded.role)) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    // Check permissions
    const hasPermission = decoded.permissions.includes('manage_appeals');
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient permissions to manage appeals'
      }, { status: 403 });
    }

    request.admin = decoded;

    // Parse and validate request body
    const body = await request.json();
    const { error, value } = schemas.appealResponse.validate(body);
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
      }, { status: 400 });
    }

    const { status, hrResponse } = value;
    const { id: appealId } = params;

    // Find appeal
    const appeal = db.findAppeal(appealId);
    if (!appeal) {
      return NextResponse.json({
        success: false,
        message: 'Appeal not found'
      }, { status: 404 });
    }

    // Check if appeal is still pending
    if (appeal.status !== 'pending') {
      return NextResponse.json({
        success: false,
        message: 'This appeal has already been reviewed'
      }, { status: 400 });
    }

    // Get verifier information
    const verifier = db.findVerifierById(appeal.verifierId);
    if (!verifier) {
      return NextResponse.json({
        success: false,
        message: 'Associated verifier not found'
      }, { status: 404 });
    }

    // Update appeal with response
    const updatedAppeal = db.updateAppeal(appealId, {
      status: status,
      hrResponse: hrResponse.trim(),
      reviewedBy: decoded.id,
      reviewedAt: new Date().toISOString(),
      emailSentAt: new Date().toISOString()
    });

    // Send email notification to verifier
    try {
      await sendAppealResponseEmail(updatedAppeal, verifier.email);
    } catch (emailError) {
      console.error('Failed to send appeal response email:', emailError);
      // Continue with the response, but log the error
    }

    // Return updated appeal information
    return NextResponse.json({
      success: true,
      message: `Appeal has been ${status} successfully`,
      data: {
        appealId: updatedAppeal.appealId,
        status: updatedAppeal.status,
        employeeId: updatedAppeal.employeeId,
        verifierEmail: verifier.email,
        reviewedAt: updatedAppeal.reviewedAt,
        emailSent: !!updatedAppeal.emailSentAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Appeal response error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to submit appeal response',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    // Authenticate admin
    const token = extractTokenFromHeader(request);
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Access token is required'
      }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/auth');
    const decoded = verifyToken(token);
    
    if (!['admin', 'hr_manager', 'super_admin'].includes(decoded.role)) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    // Check permissions
    const hasPermission = decoded.permissions.includes('view_appeals');
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient permissions to view appeals'
      }, { status: 403 });
    }

    const { id: appealId } = params;

    // Find appeal
    const appeal = db.findAppeal(appealId);
    if (!appeal) {
      return NextResponse.json({
        success: false,
        message: 'Appeal not found'
      }, { status: 404 });
    }

    // Get verifier and verification information
    const verifier = db.findVerifierById(appeal.verifierId);
    const verificationRecord = db.findVerificationRecord(appeal.verificationId);
    const employee = db.findEmployee(appeal.employeeId);

    return NextResponse.json({
      success: true,
      data: {
        appeal: {
          appealId: appeal.appealId,
          employeeId: appeal.employeeId,
          employeeName: employee?.name || 'Unknown',
          verifierInfo: verifier ? {
            companyName: verifier.companyName,
            email: verifier.email
          } : null,
          verificationInfo: verificationRecord ? {
            verificationId: verificationRecord.verificationId,
            comparisonResults: verificationRecord.comparisonResults,
            overallStatus: verificationRecord.overallStatus,
            matchScore: verificationRecord.matchScore
          } : null,
          comments: appeal.comments,
          supportingDocument: appeal.supportingDocument ? {
            filename: appeal.supportingDocument.filename,
            originalName: appeal.supportingDocument.originalName,
            size: appeal.supportingDocument.size,
            mimeType: appeal.supportingDocument.mimeType
          } : null,
          mismatchedFields: appeal.mismatchedFields,
          status: appeal.status,
          hrResponse: appeal.hrResponse,
          reviewedBy: appeal.reviewedBy,
          reviewedAt: appeal.reviewedAt,
          createdAt: appeal.createdAt
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get appeal details error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch appeal details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}