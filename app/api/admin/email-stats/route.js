/**
 * Email Statistics API Endpoint
 * Returns delivery metrics for comparing email providers (Brevo vs SendGrid)
 */

import { NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { getEmailStats } from '@/lib/services/emailService';

export async function GET(request) {
    try {
        // Verify admin authentication
        const token = extractTokenFromHeader(request);
        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Access token required' },
                { status: 401 }
            );
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (tokenError) {
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }

        if (!decoded || !['admin', 'hr_manager', 'super_admin'].includes(decoded.role)) {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            );
        }

        // Get days parameter (default: 7)
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '7', 10);

        // Fetch email statistics
        const { stats, recentLogs } = await getEmailStats(days);

        // Calculate comparison metrics
        const comparison = {
            brevo: stats.find(s => s.provider === 'brevo') || {
                provider: 'brevo',
                totalEmails: 0,
                successCount: 0,
                failureCount: 0,
                successRate: 0,
                avgResponseTime: 0
            },
            sendgrid: stats.find(s => s.provider === 'sendgrid') || {
                provider: 'sendgrid',
                totalEmails: 0,
                successCount: 0,
                failureCount: 0,
                successRate: 0,
                avgResponseTime: 0
            }
        };

        // Determine winner based on success rate and response time
        let recommendation = 'insufficient_data';
        if (comparison.brevo.totalEmails >= 10 && comparison.sendgrid.totalEmails >= 10) {
            const brevoScore = comparison.brevo.successRate - (comparison.brevo.avgResponseTime / 100);
            const sgScore = comparison.sendgrid.successRate - (comparison.sendgrid.avgResponseTime / 100);
            recommendation = brevoScore >= sgScore ? 'brevo' : 'sendgrid';
        }

        return NextResponse.json({
            success: true,
            data: {
                period: `Last ${days} days`,
                comparison,
                recommendation,
                recentLogs: recentLogs.map(log => ({
                    id: log.id,
                    provider: log.provider,
                    emailType: log.emailType,
                    recipient: log.recipient?.substring(0, 3) + '****',
                    status: log.status,
                    responseTime: log.responseTime,
                    createdAt: log.createdAt
                }))
            }
        });

    } catch (error) {
        console.error('[EMAIL STATS] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch email statistics' },
            { status: 500 }
        );
    }
}
