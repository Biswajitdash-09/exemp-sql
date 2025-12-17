import { NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { findEmployeeById } from '@/lib/mongodb.data.service';

/**
 * Validate that Employee ID exists before proceeding to next step
 * POST /api/verify/validate-employee
 * Body: { employeeId: string, name: string }
 * 
 * Note: This ONLY checks if the Employee ID exists in the database.
 * Name and other field comparisons are shown in the final results page.
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

        // Find employee in MongoDB - ONLY check if employee ID exists
        const employee = await findEmployeeById(normalizedEmployeeId);

        if (!employee) {
            return NextResponse.json({
                success: false,
                message: `Employee with ID "${employeeId}" not found in our records. Please verify the Employee ID.`
            }, { status: 404 });
        }

        // Employee ID exists - proceed to next step
        // Name and all other field comparisons will be shown in the final results
        return NextResponse.json({
            success: true,
            message: 'Employee ID verified. Proceed to enter employment details.'
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


