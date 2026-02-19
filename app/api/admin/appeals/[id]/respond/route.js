import { NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { schemas } from '@/lib/validation';
import {
  getAppealById,
  updateAppeal,
  findVerifierById,
  findVerificationRecord,
  findEmployeeById
} from '@/lib/data.service';
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

    const decoded = verifyToken(token);

    if (!['admin', 'hr_manager', 'super_admin'].includes(decoded.role)) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    // Check permissions
    const hasPermission = decoded.permissions?.includes('manage_appeals');
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient permissions to manage appeals'
      }, { status: 403 });
    }

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
    const { id: appealId } = await params;

    // Find appeal
    const appeal = await getAppealById(appealId);

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

    // Get verifier information - Log warning if missing but continue
    const verifier = await findVerifierById(appeal.verifierId);

    if (!verifier) {
      console.warn('[API] Warning: Verifier not found for appeal', appealId, 'Email will not be sent.');
    }

    // Update appeal with response
    const updatedAppeal = await updateAppeal(appealId, {
      status: status,
      hrResponse: hrResponse.trim(),
      hrComments: hrResponse.trim(),
      reviewedBy: decoded.id,
      reviewedAt: new Date()
    });

    // Send email notification to verifier ONLY if verifier exists
    let emailSent = false;
    if (verifier) {
      try {
        await sendAppealResponseEmail(updatedAppeal, verifier.email);
        emailSent = true;
      } catch (emailError) {
        console.error('Failed to send appeal response email:', emailError);
        // Continue with the response, but log the error
      }
    }

    // Return updated appeal information
    return NextResponse.json({
      success: true,
      message: `Appeal has been ${status} successfully${!verifier ? ' (Verifier not found, no email sent)' : ''}`,
      data: {
        appealId: updatedAppeal.appealId,
        status: updatedAppeal.status,
        employeeId: updatedAppeal.employeeId,
        verifierEmail: verifier ? verifier.email : null,
        reviewedAt: updatedAppeal.reviewedAt,
        emailSent: emailSent
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

    const decoded = verifyToken(token);

    if (!['admin', 'hr_manager', 'super_admin'].includes(decoded.role)) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    // Check permissions
    const hasPermission = decoded.permissions?.includes('view_appeals');
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient permissions to view appeals'
      }, { status: 403 });
    }

    const { id: appealId } = await params;

    // Find appeal
    const appeal = await getAppealById(appealId);
    if (!appeal) {
      return NextResponse.json({
        success: false,
        message: 'Appeal not found'
      }, { status: 404 });
    }

    // Get verifier and verification information
    const verifier = await findVerifierById(appeal.verifierId);
    const verificationRecord = await findVerificationRecord(appeal.verificationId);
    const employee = await findEmployeeById(appeal.employeeId);

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
          appealReason: appeal.appealReason,
          comments: appeal.appealReason,
          supportingDocument: appeal.documents?.length > 0 ? {
            url: appeal.documents[0]
          } : null,
          documents: appeal.documents || [],
          mismatchedFields: appeal.mismatchedFields,
          status: appeal.status,
          hrResponse: appeal.hrResponse,
          hrComments: appeal.hrComments,
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