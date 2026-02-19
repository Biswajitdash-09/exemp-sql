import { NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { getVerificationRecords, findVerifierById, getEmployees } from '@/lib/data.service';

/**
 * Export verifications data as JSON (to be converted to Excel on client side)
 * GET /api/admin/export
 * 
 * Excel Headers as per requirements:
 * S.No | Employee ID | Employee Name | Product | Department | Designation | 
 * Date of Joining | Last Working Day | Verified on | Verified by | Verified for
 */
export async function GET(request) {
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

        // Get all verifications
        const verifications = await getVerificationRecords();
        const employees = await getEmployees();

        // Create a map for quick employee lookup
        const employeeMap = {};
        employees.forEach(emp => {
            employeeMap[emp.employeeId] = emp;
        });

        // Build export data with required headers
        const exportData = [];
        let serialNo = 1;

        for (const verification of verifications) {
            const employee = employeeMap[verification.employeeId] || {};
            const verifier = await findVerifierById(verification.verifierId);

            exportData.push({
                'S.No': serialNo++,
                'Employee ID': verification.employeeId || '',
                'Employee Name': employee.name || verification.submittedData?.name || '',
                'Product': employee.product || 'N/A',
                'Department': employee.department || 'N/A',
                'Designation': employee.designation || verification.submittedData?.designation || '',
                'Date of Joining': employee.dateOfJoining ?
                    new Date(employee.dateOfJoining).toLocaleDateString('en-GB') : '',
                'Last Working Day': employee.dateOfLeaving ?
                    new Date(employee.dateOfLeaving).toLocaleDateString('en-GB') : '',
                'Verified on': verification.verificationCompletedAt ?
                    new Date(verification.verificationCompletedAt).toLocaleString('en-GB') :
                    (verification.createdAt ? new Date(verification.createdAt).toLocaleString('en-GB') : ''),
                'Verified by': verifier?.email || 'Unknown',
                'Verified for': verifier?.companyName || 'Unknown'
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Export data generated successfully',
            data: {
                records: exportData,
                total: exportData.length,
                headers: [
                    'S.No',
                    'Employee ID',
                    'Employee Name',
                    'Product',
                    'Department',
                    'Designation',
                    'Date of Joining',
                    'Last Working Day',
                    'Verified on',
                    'Verified by',
                    'Verified for'
                ],
                exportedAt: new Date().toISOString()
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Export API error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to export data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
