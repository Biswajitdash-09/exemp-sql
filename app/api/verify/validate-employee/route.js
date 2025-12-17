import { NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { findEmployeeById } from '@/lib/mongodb.data.service';

/**
 * Validate Employee ID and Name match before proceeding to next step
 * POST /api/verify/validate-employee
 * Body: { employeeId: string, name: string }
 * 
 * Note: This validates both Employee ID exists AND Name matches.
 * No blocking mechanism - verifier can retry as many times as needed.
 */
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

        // Verify token
        let decoded;
        try {
            decoded = verifyToken(token);

            if (decoded.role !== 'verifier') {
                return NextResponse.json({
                    success: false,
                    message: 'Verifier access required'
                }, { status: 403 });
            }
        } catch (tokenError) {
            return NextResponse.json({
                success: false,
                message: 'Invalid or expired token'
            }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { employeeId, name } = body;

        // Validate required fields
        if (!employeeId || !name) {
            return NextResponse.json({
                success: false,
                message: 'Employee ID and Name are required'
            }, { status: 400 });
        }

        const normalizedEmployeeId = employeeId.toUpperCase().trim();

        // Find employee in MongoDB
        const employee = await findEmployeeById(normalizedEmployeeId);

        if (!employee) {
            return NextResponse.json({
                success: false,
                message: `Employee with ID "${employeeId}" not found in our records. Please verify the Employee ID.`
            }, { status: 404 });
        }

        // Compare names (case-insensitive, trim whitespace)
        const submittedName = name.toLowerCase().trim();
        const officialName = employee.name.toLowerCase().trim();

        // Check for exact match or partial match (handles variations like "S Sathish" vs "S. Sathish")
        const namesMatch =
            submittedName === officialName ||
            submittedName.replace(/\./g, '') === officialName.replace(/\./g, '') ||
            submittedName.split(' ').join('') === officialName.split(' ').join('');

        if (!namesMatch) {
            return NextResponse.json({
                success: false,
                message: 'Employee ID and Name do not match. Please check and try again.'
            }, { status: 400 });
        }

        // Validation successful
        return NextResponse.json({
            success: true,
            message: 'Employee validated successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('Employee validation error:', error);

        return NextResponse.json({
            success: false,
            message: 'Validation failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}


