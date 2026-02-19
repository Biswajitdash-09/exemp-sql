/**
 * Prisma Data Service
 * Server-side data operations using Prisma ORM
 * This replaces the MongoDB-based data service
 */

import prisma from './prisma.js';

// ==================== VERIFIER OPERATIONS ====================

/**
 * Get all verifiers
 */
export async function getVerifiers() {
    return await prisma.verifier.findMany();
}

/**
 * Add a new verifier
 */
export async function addVerifier(verifierData) {
    return await prisma.verifier.create({ data: verifierData });
}

/**
 * Find verifier by email
 */
export async function findVerifierByEmail(email) {
    return await prisma.verifier.findFirst({ 
        where: { email: email.toLowerCase().trim() } 
    });
}

/**
 * Find verifier by ID
 */
export async function findVerifierById(id) {
    return await prisma.verifier.findUnique({ where: { id } });
}

/**
 * Update verifier data
 */
export async function updateVerifier(id, updatedData) {
    return await prisma.verifier.update({ 
        where: { id }, 
        data: updatedData 
    });
}

/**
 * Clear verifier notifications
 */
export async function clearVerifierNotifications(verifierId) {
    return await prisma.verifier.update({
        where: { id: verifierId },
        data: { notifications: [] }
    });
}

// ==================== EMPLOYEE OPERATIONS ====================

/**
 * Find employee by employee ID
 */
export async function findEmployeeById(employeeId) {
    return await prisma.employee.findFirst({ 
        where: { employeeId } 
    });
}

/**
 * Get all employees
 */
export async function getEmployees() {
    return await prisma.employee.findMany();
}

// ==================== ADMIN OPERATIONS ====================

/**
 * Find admin by username
 */
export async function findAdminByUsername(username) {
    return await prisma.admin.findFirst({ where: { username } });
}

/**
 * Find admin by ID
 */
export async function findAdminById(id) {
    return await prisma.admin.findUnique({ where: { id } });
}

/**
 * Update admin last login
 */
export async function updateAdminLastLogin(id) {
    return await prisma.admin.update({
        where: { id },
        data: { lastLoginAt: new Date() }
    });
}

// ==================== VERIFICATION RECORD OPERATIONS ====================

/**
 * Get all verification records
 */
export async function getVerificationRecords() {
    return await prisma.verificationRecord.findMany();
}

/**
 * Find verification record by ID
 */
export async function findVerificationRecord(verificationId) {
    return await prisma.verificationRecord.findFirst({ 
        where: { verificationId } 
    });
}

/**
 * Add a new verification record
 */
export async function addVerificationRecord(recordData) {
    return await prisma.verificationRecord.create({ data: recordData });
}

/**
 * Get verification records by verifier ID
 */
export async function getVerificationRecordsByVerifier(verifierId) {
    return await prisma.verificationRecord.findMany({ 
        where: { verifierId } 
    });
}

/**
 * Update verification record
 */
export async function updateVerificationRecord(verificationId, updateData) {
    return await prisma.verificationRecord.update({
        where: { verificationId },
        data: updateData
    });
}

// ==================== APPEAL OPERATIONS ====================

/**
 * Get all appeals
 */
export async function getAppeals() {
    return await prisma.appeal.findMany();
}

/**
 * Get appeal by ID
 */
export async function getAppealById(appealId) {
    return await prisma.appeal.findFirst({ where: { appealId } });
}

/**
 * Add a new appeal
 */
export async function addAppeal(appealData) {
    return await prisma.appeal.create({ data: appealData });
}

/**
 * Update appeal status
 */
export async function updateAppeal(appealId, updateData) {
    return await prisma.appeal.update({
        where: { appealId },
        data: updateData
    });
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate a simple unique ID
 */
export function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate a sequential ID with prefix
 */
export async function generateSequentialId(prefix, model) {
    // Note: This is a simplified version since we can't pass the model directly
    // In practice, you should use specific count functions
    const countMap = {
        verifier: () => prisma.verifier.count(),
        employee: () => prisma.employee.count(),
        verificationrecord: () => prisma.verificationRecord.count(),
        appeal: () => prisma.appeal.count()
    };
    
    const countFn = countMap[model.toLowerCase()];
    const count = countFn ? await countFn() : 0;
    const nextNumber = (count + 1).toString().padStart(6, '0');
    return `${prefix}${nextNumber}`;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
    const [
        totalEmployees,
        totalVerifiers,
        totalVerifications,
        totalAppeals,
        pendingAppeals,
        matchedVerifications,
        partialMatches,
        mismatches
    ] = await Promise.all([
        prisma.employee.count(),
        prisma.verifier.count(),
        prisma.verificationRecord.count(),
        prisma.appeal.count(),
        prisma.appeal.count({ where: { status: 'pending' } }),
        prisma.verificationRecord.count({ where: { overallStatus: 'matched' } }),
        prisma.verificationRecord.count({ where: { overallStatus: 'partial_match' } }),
        prisma.verificationRecord.count({ where: { overallStatus: 'mismatch' } })
    ]);

    // Get recent activity
    const [recentVerifications, recentAppeals] = await Promise.all([
        prisma.verificationRecord.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10
        }),
        prisma.appeal.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10
        })
    ]);

    return {
        totalEmployees,
        totalVerifiers,
        totalVerifications,
        totalAppeals,
        pendingAppeals,
        recentVerifications,
        recentAppeals,
        matchedVerifications,
        partialMatches,
        mismatches
    };
}

// ==================== ACCESS LOG OPERATIONS ====================

/**
 * Log an access attempt
 * @param {Object} data - Log data
 * @returns {Promise<Object>} Created log entry
 */
export async function logAccess(data) {
    try {
        const logEntry = {
            ...data,
            timestamp: new Date()
        };

        const log = await prisma.accessLog.create({ data: logEntry });
        return log;
    } catch (error) {
        // Don't throw error to prevent blocking main flow if logging fails
        console.error('Failed to create access log:', error);
        return null;
    }
}

/**
 * Get access logs with pagination and filters
 * @param {Object} options - Filter and pagination options
 * @returns {Promise<Object>} and logs and validation
 */
export async function getAccessLogs({ page = 1, limit = 20, status, role } = {}) {
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (role && role !== 'ALL') where.role = role;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        prisma.accessLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            skip,
            take: limit
        }),
        prisma.accessLog.count({ where })
    ]);

    return {
        logs: logs.map(log => ({
            ...log,
            id: log.id,
            timestamp: log.timestamp.toISOString()
        })),
        pagination: {
            total,
            pages: Math.ceil(total / limit),
            page,
            limit
        }
    };
}

// ==================== VERIFICATION ATTEMPT OPERATIONS ====================

// Configuration constants (moved from VerificationAttempt model)
const EXIT_TEAM_EMAIL = 'biswajit.dash@codemate.ai';
const MAX_ATTEMPTS = 3;

const VERIFICATION_ATTEMPT_CONFIG = {
    MAX_ATTEMPTS,
    EXIT_TEAM_EMAIL,
    BLOCKED_MESSAGE: `Maximum attempts reached. Please reach out to exit team - ${EXIT_TEAM_EMAIL}`
};

/**
 * Check if verifier is blocked for a specific employee
 */
export async function isVerificationBlocked(verifierId, employeeId) {
    const attempt = await prisma.verificationAttempt.findUnique({
        where: {
            verifierId_employeeId: {
                verifierId,
                employeeId: employeeId.toUpperCase().trim()
            }
        }
    });
    return attempt?.isBlocked || false;
}

/**
 * Get verification attempt record
 */
export async function getVerificationAttempt(verifierId, employeeId) {
    return await prisma.verificationAttempt.findUnique({
        where: {
            verifierId_employeeId: {
                verifierId,
                employeeId: employeeId.toUpperCase().trim()
            }
        }
    });
}

/**
 * Increment failed attempt count, block if max reached
 */
export async function incrementVerificationAttempt(verifierId, employeeId) {
    const normalizedEmployeeId = employeeId.toUpperCase().trim();

    // First, update the attempt count
    const attempt = await prisma.verificationAttempt.upsert({
        where: {
            verifierId_employeeId: {
                verifierId,
                employeeId: normalizedEmployeeId
            }
        },
        update: {
            attemptCount: { increment: 1 },
            lastAttemptAt: new Date()
        },
        create: {
            verifierId,
            employeeId: normalizedEmployeeId,
            attemptCount: 1,
            lastAttemptAt: new Date()
        }
    });

    // Block if max attempts reached
    if (attempt.attemptCount >= MAX_ATTEMPTS && !attempt.isBlocked) {
        const blockedAttempt = await prisma.verificationAttempt.update({
            where: { id: attempt.id },
            data: { 
                isBlocked: true, 
                blockedAt: new Date() 
            }
        });
        return { ...blockedAttempt, isBlocked: true, justBlocked: true };
    }

    return attempt;
}

/**
 * Reset verification attempts on successful validation
 */
export async function resetVerificationAttempt(verifierId, employeeId) {
    const normalizedEmployeeId = employeeId.toUpperCase().trim();
    return await prisma.verificationAttempt.upsert({
        where: {
            verifierId_employeeId: {
                verifierId,
                employeeId: normalizedEmployeeId
            }
        },
        update: {
            attemptCount: 0, 
            isBlocked: false, 
            blockedAt: null 
        },
        create: {
            verifierId,
            employeeId: normalizedEmployeeId,
            attemptCount: 0,
            isBlocked: false
        }
    });
}

/**
 * Get blocked message for UI
 */
export function getBlockedMessage() {
    return VERIFICATION_ATTEMPT_CONFIG.BLOCKED_MESSAGE;
}

export default {
    // Verifier operations
    getVerifiers,
    addVerifier,
    findVerifierByEmail,
    findVerifierById,
    updateVerifier,
    clearVerifierNotifications,

    // Employee operations
    findEmployeeById,
    getEmployees,

    // Admin operations
    findAdminByUsername,
    findAdminById,
    updateAdminLastLogin,

    // Verification operations
    getVerificationRecords,
    findVerificationRecord,
    addVerificationRecord,
    getVerificationRecordsByVerifier,
    updateVerificationRecord,

    // Appeal operations
    getAppeals,
    getAppealById,
    addAppeal,
    updateAppeal,

    // Verification attempt operations
    isVerificationBlocked,
    getVerificationAttempt,
    incrementVerificationAttempt,
    resetVerificationAttempt,
    getBlockedMessage,

    // Email Log operations
    logEmail: async (data) => {
        return await prisma.emailLog.create({ data });
    },
    getEmailStats: async (startDate, endDate) => {
        const where = {};
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const stats = await prisma.emailLog.groupBy({
            by: ['provider'],
            where,
            _count: { _all: true },
            _avg: { responseTime: true },
            _min: { responseTime: true },
            _max: { responseTime: true },
        });

        // Map to match original response structure
        return stats.map(s => ({
            provider: s.provider,
            totalEmails: s._count._all,
            avgResponseTime: Math.round(s._avg.responseTime || 0),
            minResponseTime: s._min.responseTime || 0,
            maxResponseTime: s._max.responseTime || 0
        }));
    },

    // Utilities
    generateId,
    generateSequentialId,
    getDashboardStats,
    logAccess,
    getAccessLogs
};
