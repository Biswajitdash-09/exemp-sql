import { NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import {
  findVerificationRecord,
  addAppeal,
  getAppeals,
  findVerifierById,
  generateSequentialId
} from '@/lib/mongodb.data.service';
import Appeal from '@/lib/models/Appeal.js';
import { uploadFileToS3 } from '@/lib/services/fileService';
import { sendAppealNotificationEmail } from '@/lib/services/emailService';

export async function POST(request) {
  try {
    // Authenticate the verifier
    const token = extractTokenFromHeader(request);
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Access token is required'
      }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (decoded.role !== 'verifier') {
      return NextResponse.json({
        success: false,
        message: 'Verifier access required'
      }, { status: 403 });
    }

    // Parse form data (for file upload)
    const formData = await request.formData();

    // Extract fields from form data
    const verificationId = formData.get('verificationId');
    const comments = formData.get('comments');
    const supportingDocument = formData.get('supportingDocument');

    // Validate required fields
    if (!verificationId || !comments) {
      return NextResponse.json({
        success: false,
        message: 'Verification ID and comments are required'
      }, { status: 400 });
    }

    // Find verification record
    const verificationRecord = await findVerificationRecord(verificationId);
    if (!verificationRecord || verificationRecord.verifierId !== decoded.id) {
      return NextResponse.json({
        success: false,
        message: 'Verification record not found or you do not have permission to appeal this verification'
      }, { status: 404 });
    }

    // Get mismatched fields from verification record
    const mismatchedFields = verificationRecord.comparisonResults
      .filter(result => !result.isMatch)
      .map(result => ({
        fieldName: result.field,
        verifierValue: result.verifierValue,
        companyValue: result.companyValue
      }));

    // Handle file upload if present
    let uploadedFileUrl = null;
    console.log('[APPEAL] File upload check:', {
      hasFile: !!supportingDocument,
      fileSize: supportingDocument?.size || 0,
      fileName: supportingDocument?.name || 'none'
    });

    if (supportingDocument && supportingDocument.size > 0) {
      try {
        console.log('[APPEAL] Starting file upload to Vercel Blob...');
        const uploadResult = await uploadFileToS3(supportingDocument, `appeals/${verificationRecord.employeeId}`);
        uploadedFileUrl = uploadResult.s3Url;
        console.log('[APPEAL] ✅ File uploaded successfully:', uploadedFileUrl);
      } catch (uploadError) {
        console.error('[APPEAL] ❌ File upload error:', uploadError.message);
        console.error('[APPEAL] Full error:', uploadError);
        // Continue without file, but log the error
      }
    } else {
      console.log('[APPEAL] No file provided or file is empty');
    }

    // Generate appeal ID
    const appealId = await generateSequentialId('APP', Appeal);

    // Create appeal
    const appeal = await addAppeal({
      appealId,
      verificationId,
      employeeId: verificationRecord.employeeId,
      verifierId: decoded.id,
      appealReason: comments.trim(),
      documents: uploadedFileUrl ? [uploadedFileUrl] : [],
      status: 'pending',
      mismatchedFields: mismatchedFields
    });

    // Send notification email to HR/admin
    try {
      await sendAppealNotificationEmail(appeal);
    } catch (emailError) {
      console.error('Failed to send appeal notification email:', emailError);
      // Continue, but log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Appeal submitted successfully. We will review your case and respond shortly.',
      data: {
        appealId: appeal.appealId,
        verificationId: appeal.verificationId,
        employeeId: appeal.employeeId,
        status: appeal.status,
        submittedAt: appeal.createdAt,
        mismatchedFields: mismatchedFields.length,
        hasSupportingDocument: !!uploadedFileUrl
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Appeal submission error:', error);

    return NextResponse.json({
      success: false,
      message: 'Failed to submit appeal. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // This endpoint is for admins only
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    // Get all appeals from MongoDB
    const appeals = await getAppeals();

    // Filter appeals if criteria provided
    let filteredAppeals = appeals;
    if (status) {
      filteredAppeals = filteredAppeals.filter(a => a.status === status);
    }
    if (employeeId) {
      filteredAppeals = filteredAppeals.filter(a => a.employeeId === employeeId);
    }

    // Get verifier information for each appeal
    const appealsWithVerifierInfo = await Promise.all(
      filteredAppeals.map(async (appeal) => {
        const verifier = await findVerifierById(appeal.verifierId);

        return {
          appealId: appeal.appealId,
          verificationId: appeal.verificationId,
          employeeId: appeal.employeeId,
          verifierInfo: verifier ? {
            companyName: verifier.companyName,
            email: verifier.email
          } : null,
          appealReason: appeal.appealReason,
          status: appeal.status,
          mismatchedFields: appeal.mismatchedFields?.length || 0,
          hasSupportingDocument: appeal.documents?.length > 0,
          documents: appeal.documents,
          hrResponse: appeal.hrResponse,
          hrComments: appeal.hrComments,
          createdAt: appeal.createdAt,
          reviewedAt: appeal.reviewedAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        appeals: appealsWithVerifierInfo,
        total: appealsWithVerifierInfo.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get appeals error:', error);

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch appeals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}