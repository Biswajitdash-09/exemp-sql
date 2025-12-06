/**
 * MongoDB Data Service
 * Server-side data operations using MongoDB models
 * This replaces file-based storage for server-side API routes
 */

import connectDB from './db/mongodb.js';
import { Employee, Verifier, Admin, VerificationRecord, Appeal } from './models/index.js';

// Ensure DB connection before operations
async function ensureConnection() {
    await connectDB();
}

// ==================== VERIFIER OPERATIONS ====================

/**
 * Get all verifiers
 */
export async function getVerifiers() {
    await ensureConnection();
    return await Verifier.find({}).lean();
}

/**
 * Add a new verifier
 */
export async function addVerifier(verifierData) {
    await ensureConnection();
    const verifier = new Verifier(verifierData);
    return await verifier.save();
}

/**
 * Find verifier by email
 */
export async function findVerifierByEmail(email) {
    await ensureConnection();
    return await Verifier.findOne({ email: email.toLowerCase() }).lean();
}

/**
 * Find verifier by ID
 */
export async function findVerifierById(id) {
    await ensureConnection();
    return await Verifier.findById(id).lean();
}

/**
 * Update verifier data
 */
export async function updateVerifier(id, updatedData) {
    await ensureConnection();
    return await Verifier.findByIdAndUpdate(
        id,
        { $set: updatedData },
        { new: true, runValidators: true }
    ).lean();
}

/**
 * Clear verifier notifications
 */
export async function clearVerifierNotifications(verifierId) {
    await ensureConnection();
    return await Verifier.findByIdAndUpdate(
        verifierId,
        { $set: { notifications: [] } },
        { new: true }
    ).lean();
}

// ==================== EMPLOYEE OPERATIONS ====================

/**
 * Find employee by employee ID
 */
export async function findEmployeeById(employeeId) {
    await ensureConnection();
    return await Employee.findOne({ employeeId }).lean();
}

/**
 * Get all employees
 */
export async function getEmployees() {
    await ensureConnection();
    return await Employee.find({}).lean();
}

// ==================== ADMIN OPERATIONS ====================

/**
 * Find admin by username
 */
export async function findAdminByUsername(username) {
    await ensureConnection();
    return await Admin.findOne({ username }).lean();
}

/**
 * Find admin by ID
 */
export async function findAdminById(id) {
    await ensureConnection();
    return await Admin.findById(id).lean();
}

/**
 * Update admin last login
 */
export async function updateAdminLastLogin(id) {
    await ensureConnection();
    return await Admin.findByIdAndUpdate(
        id,
        { $set: { lastLoginAt: new Date() } },
        { new: true }
    ).lean();
}

// ==================== VERIFICATION RECORD OPERATIONS ====================

/**
 * Get all verification records
 */
export async function getVerificationRecords() {
    await ensureConnection();
    return await VerificationRecord.find({}).lean();
}

/**
 * Find verification record by ID
 */
export async function findVerificationRecord(verificationId) {
    await ensureConnection();
    return await VerificationRecord.findOne({ verificationId }).lean();
}

/**
 * Add a new verification record
 */
export async function addVerificationRecord(recordData) {
    await ensureConnection();
    const record = new VerificationRecord(recordData);
    return await record.save();
}

/**
 * Get verification records by verifier ID
 */
export async function getVerificationRecordsByVerifier(verifierId) {
    await ensureConnection();
    return await VerificationRecord.find({ verifierId }).lean();
}

/**
 * Update verification record
 */
export async function updateVerificationRecord(verificationId, updateData) {
    await ensureConnection();
    return await VerificationRecord.findOneAndUpdate(
        { verificationId },
        { $set: updateData },
        { new: true, runValidators: true }
    ).lean();
}

// ==================== APPEAL OPERATIONS ====================

/**
 * Get all appeals
 */
export async function getAppeals() {
    await ensureConnection();
    return await Appeal.find({}).lean();
}

/**
 * Get appeal by ID
 */
export async function getAppealById(appealId) {
    await ensureConnection();
    return await Appeal.findOne({ appealId }).lean();
}

/**
 * Add a new appeal
 */
export async function addAppeal(appealData) {
    await ensureConnection();
    const appeal = new Appeal(appealData);
    return await appeal.save();
}

/**
 * Update appeal status
 */
export async function updateAppeal(appealId, updateData) {
    await ensureConnection();
    return await Appeal.findOneAndUpdate(
        { appealId },
        { $set: updateData },
        { new: true, runValidators: true }
    ).lean();
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
export async function generateSequentialId(prefix, Model) {
    await ensureConnection();
    const count = await Model.countDocuments();
    const nextNumber = (count + 1).toString().padStart(6, '0');
    return `${prefix}${nextNumber}`;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
    await ensureConnection();

    const totalEmployees = await Employee.countDocuments();
    const totalVerifiers = await Verifier.countDocuments();
    const totalVerifications = await VerificationRecord.countDocuments();
    const totalAppeals = await Appeal.countDocuments();
    const pendingAppeals = await Appeal.countDocuments({ status: 'pending' });

    // Get recent activity
    const recentVerifications = await VerificationRecord.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    const recentAppeals = await Appeal.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    return {
        totalEmployees,
        totalVerifiers,
        totalVerifications,
        totalAppeals,
        pendingAppeals,
        recentVerifications,
        recentAppeals,
        matchedVerifications: await VerificationRecord.countDocuments({ overallStatus: 'matched' }),
        partialMatches: await VerificationRecord.countDocuments({ overallStatus: 'partial_match' }),
        mismatches: await VerificationRecord.countDocuments({ overallStatus: 'mismatch' }),
    };
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

    // Utilities
    generateId,
    generateSequentialId,
    getDashboardStats,
};
