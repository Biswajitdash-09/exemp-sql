import { NextResponse } from 'next/server';
import { extractTokenFromHeader } from '@/lib/auth';
import { schemas } from '@/lib/validation';
import { compareEmployeeData, calculateFnFStatus } from '@/lib/services/comparisonService';
import db from '@/lib/localStorage.service';

export async function POST(request) {
  try {
    // Authenticate the verifier
    const token = extractTokenFromHeader(request);
    console.log('Verify Request - Token received:', !!token);

    if (!token) {
      console.log('Verify Request - No token found in headers');
      return NextResponse.json({
        success: false,
        message: 'Access token is required'
      }, { status: 401 });
    }


    // Verify token
    const { verifyToken } = await import('@/lib/auth');

    let decoded; // Declare outside try-catch for wider scope
    try {
      decoded = verifyToken(token);
      console.log('Verify Request - Token decoded successfully:', decoded);

      if (decoded.role !== 'verifier') {
        console.log('Verify Request - Invalid role:', decoded.role);
        return NextResponse.json({
          success: false,
          message: 'Verifier access required'
        }, { status: 403 });
      }

      request.verifier = decoded;
    } catch (tokenError) {
      console.error('Verify Request - Token verification failed:', tokenError.message);
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired token'
      }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { error, value } = schemas.verificationRequest.validate(body);

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
      }, { status: 400 });
    }


    const { employeeId, ...otherFields } = value;

    // Find employee in localStorage
    const employee = db.findEmployee(employeeId.toUpperCase());
    if (!employee) {
      return NextResponse.json({
        success: false,
        message: `Employee with ID "${employeeId}" not found in our records`
      }, { status: 404 });
    }

    // Include employeeId in verification data for comparison
    const verificationData = { employeeId, ...otherFields };

    // Perform detailed comparison
    const comparisonResults = compareEmployeeData(verificationData, employee);

    // Calculate F&F status
    const fnfStatus = calculateFnFStatus(employee.exitReason, employee.dateOfLeaving);

    // Create verification record
    const verificationRecord = db.createVerificationRecord({
      verifierId: decoded.id,
      employeeId: employeeId.toUpperCase(),
      submittedData: verificationData,
      comparisonResults: comparisonResults.comparisonResults,
      overallStatus: comparisonResults.overallStatus,
      matchScore: comparisonResults.matchScore,
      consentGiven: verificationData.consentGiven,
      verificationCompletedAt: new Date().toISOString()
    });

    // Update verifier with new verification request
    db.updateVerifier(decoded.id, {
      lastLoginAt: new Date().toISOString()
    });

    // Prepare response data
    const responseData = {
      verificationId: verificationRecord.verificationId,
      employeeData: {
        employeeId: employee.employeeId,
        name: employee.name,
        entityName: employee.entityName,
        dateOfJoining: employee.dateOfJoining,
        dateOfLeaving: employee.dateOfLeaving,
        designation: employee.designation,
        exitReason: employee.exitReason,
        fnfStatus: fnfStatus,
        department: employee.department
      },
      comparisonResults: comparisonResults.comparisonResults.map(result => ({
        field: result.field,
        label: getFieldLabel(result.field),
        verifierValue: result.verifierValue,
        companyValue: result.companyValue,
        isMatch: result.isMatch,
        matchType: result.matchType,
        color: result.isMatch ? 'green' : 'red'
      })),
      overallStatus: comparisonResults.overallStatus,
      matchScore: comparisonResults.matchScore,
      fnfStatus: fnfStatus,
      summary: generateComparisonSummary(comparisonResults.comparisonResults),
      verifiedAt: verificationRecord.verificationCompletedAt
    };

    return NextResponse.json({
      success: true,
      message: 'Verification completed successfully',
      data: responseData
    }, { status: 200 });

  } catch (error) {
    console.error('Verification request error:', error);

    return NextResponse.json({
      success: false,
      message: 'Verification failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Authenticate the verifier
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const verificationId = searchParams.get('id');

    // If verification ID is provided, return specific verification details
    if (verificationId) {
      // Find verification record
      const verificationRecord = db.findVerificationRecord(verificationId);
      if (!verificationRecord || verificationRecord.verifierId !== decoded.id) {
        return NextResponse.json({
          success: false,
          message: 'Verification record not found or you do not have permission to access it'
        }, { status: 404 });
      }

      // Find employee
      const employee = db.findEmployee(verificationRecord.employeeId);
      if (!employee) {
        return NextResponse.json({
          success: false,
          message: 'Employee record not found'
        }, { status: 404 });
      }

      // Calculate F&F status
      const { calculateFnFStatus } = require('@/lib/services/comparisonService');
      const fnfStatus = calculateFnFStatus(employee.exitReason, employee.dateOfLeaving);

      // Return verification details
      return NextResponse.json({
        success: true,
        data: {
          verificationId: verificationRecord.verificationId,
          employeeId: verificationRecord.employeeId,
          submittedData: verificationRecord.submittedData,
          comparisonResults: verificationRecord.comparisonResults,
          overallStatus: verificationRecord.overallStatus,
          matchScore: verificationRecord.matchScore,
          employeeData: {
            employeeId: employee.employeeId,
            name: employee.name,
            entityName: employee.entityName,
            dateOfJoining: employee.dateOfJoining,
            dateOfLeaving: employee.dateOfLeaving,
            designation: employee.designation,
            exitReason: employee.exitReason,
            fnfStatus: fnfStatus,
            department: employee.department
          },
          verifiedAt: verificationRecord.verificationCompletedAt
        }
      }, { status: 200 });
    }

    // Otherwise, return verification history with pagination
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Get verifier's verification history from localStorage
    const result = db.getVerificationRecordsByVerifier(decoded.id, page, limit);

    return NextResponse.json({
      success: true,
      data: {
        verificationRecords: result.records.map(record => ({
          verificationId: record.verificationId,
          employeeId: record.employeeId,
          overallStatus: record.overallStatus,
          matchScore: record.matchScore,
          createdAt: record.createdAt,
          verificationCompletedAt: record.verificationCompletedAt
        })),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET verification error:', error);

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch verification data',
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