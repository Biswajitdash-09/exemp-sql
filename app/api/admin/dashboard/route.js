import { NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { getDashboardStats, findVerifierById } from '@/lib/data.service';

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

    // Get dashboard stats from MongoDB
    const stats = await getDashboardStats();

    // Get date ranges for statistics
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Calculate verification trends (last 7 days)
    const verificationTrend = {};
    stats.recentVerifications
      .filter(v => new Date(v.createdAt) >= sevenDaysAgo)
      .forEach(v => {
        const date = new Date(v.createdAt).toISOString().split('T')[0];
        verificationTrend[date] = (verificationTrend[date] || 0) + 1;
      });

    // Fill missing days with zero
    const filledTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      filledTrend.push({
        date: dateStr,
        count: verificationTrend[dateStr] || 0
      });
    }

    // Get recent activities
    const recentActivities = [];

    // Add recent verifications
    for (const v of stats.recentVerifications.slice(0, 5)) {
      const verifier = await findVerifierById(v.verifierId);
      recentActivities.push({
        type: 'verification',
        id: v.verificationId,
        description: `Verification for ${v.employeeId}`,
        status: v.overallStatus,
        user: verifier?.companyName || 'Unknown',
        timestamp: v.createdAt
      });
    }

    // Add recent appeals
    for (const a of stats.recentAppeals.slice(0, 5)) {
      const verifier = await findVerifierById(a.verifierId);
      recentActivities.push({
        type: 'appeal',
        id: a.appealId,
        description: `Appeal for ${a.employeeId}`,
        status: a.status,
        user: verifier?.companyName || 'Unknown',
        timestamp: a.createdAt
      });
    }

    // Sort by timestamp
    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Prepare dashboard data
    const dashboardData = {
      summary: {
        totalVerifications: stats.totalVerifications,
        recentVerifications: stats.recentVerifications.length,
        totalAppeals: stats.totalAppeals,
        pendingAppeals: stats.pendingAppeals,
        totalVerifiers: stats.totalVerifiers,
        activeVerifiers: stats.totalVerifiers,
        totalEmployees: stats.totalEmployees
      },
      breakdowns: {
        verificationStatus: {
          matched: stats.matchedVerifications,
          partial_match: stats.partialMatches,
          mismatch: stats.mismatches
        },
        appealStatus: {
          pending: stats.pendingAppeals,
          approved: 0,
          rejected: 0
        }
      },
      trends: {
        verifications: filledTrend
      },
      recentActivities: recentActivities.slice(0, 10),
      pendingAppealsCount: stats.pendingAppeals
    };

    return NextResponse.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: dashboardData
    }, { status: 200 });

  } catch (error) {
    console.error('Dashboard API error:', error);

    return NextResponse.json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
