import { NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import {
  findVerificationRecord,
  updateVerificationRecord,
  findEmployeeById
} from '@/lib/data.service';
import { generateVerificationReportPDF } from '@/lib/services/pdfService';
import { sendVerificationReportEmail } from '@/lib/services/emailService';

export async function POST(request) {
  try {
    // Authenticate verifier
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

    // Parse request body
    const body = await request.json();
    const { verificationId, sendEmail = false } = body;

    if (!verificationId) {
      return NextResponse.json({
        success: false,
        message: 'Verification ID is required'
      }, { status: 400 });
    }

    // Find verification record
    const verificationRecord = await findVerificationRecord(verificationId);

    if (!verificationRecord || verificationRecord.verifierId !== decoded.id) {
      return NextResponse.json({
        success: false,
        message: 'Verification record not found or you do not have permission'
      }, { status: 404 });
    }

    // Find employee details
    const employee = await findEmployeeById(verificationRecord.employeeId);
    if (!employee) {
      return NextResponse.json({
        success: false,
        message: 'Employee record not found'
      }, { status: 404 });
    }

    // Check if PDF already exists
    if (verificationRecord.pdfReportUrl) {
      return NextResponse.json({
        success: true,
        message: 'PDF report already exists',
        data: {
          pdfUrl: verificationRecord.pdfReportUrl,
          generatedAt: verificationRecord.updatedAt || new Date()
        }
      }, { status: 200 });
    }

    // Prepare data for PDF generation
    const verificationData = {
      verificationId: verificationRecord.verificationId,
      verifiedAt: verificationRecord.verificationCompletedAt,
      verifierName: decoded.companyName,
      overallStatus: verificationRecord.overallStatus,
      matchScore: verificationRecord.matchScore,
      comparisonResults: verificationRecord.comparisonResults.map(result => ({
        field: result.field,
        label: getFieldLabel(result.field),
        verifierValue: result.verifierValue,
        companyValue: result.companyValue,
        isMatch: result.isMatch
      })),
      summary: generateComparisonSummary(verificationRecord.comparisonResults)
    };

    const employeeData = {
      employeeId: employee.employeeId,
      name: employee.name,
      entityName: employee.entityName,
      department: employee.department,
      dateOfJoining: employee.dateOfJoining,
      dateOfLeaving: employee.dateOfLeaving,
      designation: employee.designation,
      exitReason: employee.exitReason,
      fnfStatus: employee.fnfStatus
    };

    // Generate PDF
    const pdfResult = await generateVerificationReportPDF(verificationData, employeeData);

    // Update verification record with PDF info
    await updateVerificationRecord(verificationId, {
      pdfReportUrl: pdfResult.s3Url,
      pdfReportPath: pdfResult.s3Key,
      updatedAt: new Date()
    });

    // Send email if requested
    if (sendEmail) {
      try {
        await sendVerificationReportEmail(
          {
            verificationId: verificationData.verificationId,
            employeeData,
            comparisonResults: verificationData.comparisonResults,
            overallStatus: verificationData.overallStatus,
            matchScore: verificationData.matchScore,
            summary: verificationData.summary
          },
          decoded.email,
          pdfResult.s3Url
        );
      } catch (emailError) {
        console.error('Failed to send verification report email:', emailError);
        // Continue, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'PDF report generated successfully',
      data: {
        pdfUrl: pdfResult.s3Url,
        fileName: `${pdfResult.filename}`,
        generatedAt: new Date(),
        emailSent: sendEmail
      }
    }, { status: 200 });

  } catch (error) {
    console.error('PDF generation error:', error);

    return NextResponse.json({
      success: false,
      message: 'Failed to generate PDF report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Authenticate verifier
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const verificationId = searchParams.get('verificationId');

    if (!verificationId) {
      return NextResponse.json({
        success: false,
        message: 'Verification ID parameter is required'
      }, { status: 400 });
    }

    // Find verification record
    const verificationRecord = await findVerificationRecord(verificationId);

    if (!verificationRecord || verificationRecord.verifierId !== decoded.id) {
      return NextResponse.json({
        success: false,
        message: 'Verification record not found'
      }, { status: 404 });
    }

    // Check if PDF exists
    if (!verificationRecord.pdfReportUrl) {
      return NextResponse.json({
        success: false,
        message: 'PDF report not yet generated for this verification'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'PDF report found',
      data: {
        pdfUrl: verificationRecord.pdfReportUrl,
        generatedAt: verificationRecord.updatedAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get PDF report error:', error);

    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve PDF report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Helper functions
function getFieldLabel(fieldName) {
  const labels = {
    employeeId: 'Employee ID',
    name: 'Full Name',
    entityName: 'Entity Name',
    dateOfJoining: 'Date of Joining',
    dateOfLeaving: 'Date of Leaving',
    designation: 'Designation',
    exitReason: 'Exit Reason'
  };
  return labels[fieldName] || fieldName;
}

function generateComparisonSummary(comparisonResults) {
  const matches = comparisonResults.filter(r => r.isMatch).length;
  const total = comparisonResults.length;
  const score = Math.round((matches / total) * 100);

  if (score === 100) {
    return 'Perfect Match - All fields match our records';
  } else if (score >= 70) {
    return `Partial Match - ${matches} of ${total} fields match`;
  } else {
    return `Significant Mismatch - Only ${matches} of ${total} fields match`;
  }
}
