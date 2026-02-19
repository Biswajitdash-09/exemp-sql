import { NextResponse } from 'next/server';
import { getAccessLogs } from '@/lib/data.service';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    // Auth check
    const token = extractTokenFromHeader(request);

    if (!token) {
        return NextResponse.json({
            success: false,
            message: 'Access token is required'
        }, { status: 401 });
    }

    try {
        const decoded = verifyToken(token);
        if (decoded.role !== 'admin' && decoded.role !== 'hr_manager' && decoded.role !== 'super_admin') {
            return NextResponse.json({
                success: false,
                message: 'Admin access required'
            }, { status: 403 });
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Invalid or expired token'
        }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const role = searchParams.get('role');

        const result = await getAccessLogs({ page, limit, status, role });

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch logs'
        }, { status: 500 });
    }
}
