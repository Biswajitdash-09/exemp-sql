/**
 * OTP Service
 * Handles OTP generation, storage, and verification
 */

import prisma from '@/lib/prisma.js';

// OTP Configuration
const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5; // 5 minutes
const MAX_OTP_ATTEMPTS = 3;

/**
 * Generate a random OTP
 * @returns {string} 6-digit OTP
 */
export function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
}

/**
 * Calculate OTP expiry time
 * @returns {Date} Expiry timestamp
 */
export function getOTPExpiry() {
    const now = new Date();
    return new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

/**
 * Store OTP for a verifier (email)
 * @param {string} email - Verifier email
 * @param {string} otp - Generated OTP
 * @returns {Promise<Object>} Result object
 */
export async function storeOTP(email, otp) {
    try {
        const otpData = {
            email: email.toLowerCase(),
            otp: otp,
            expiresAt: getOTPExpiry(),
            attempts: 0
        };

        await prisma.otp.upsert({
            where: { email: email.toLowerCase() },
            update: otpData,
            create: otpData
        });

        return { success: true };
    } catch (error) {
        console.error('Error storing OTP:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Verify OTP for a given email
 * @param {string} email - Verifier email
 * @param {string} otp - OTP to verify
 * @returns {Promise<Object>} Verification result
 */
export async function verifyOTP(email, otp) {
    try {
        const otpRecord = await prisma.otp.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!otpRecord) {
            return {
                success: false,
                message: 'No OTP found. Please request a new one.'
            };
        }

        // Check if OTP is expired
        if (new Date() > new Date(otpRecord.expiresAt)) {
            await prisma.otp.delete({ where: { email: email.toLowerCase() } });
            return {
                success: false,
                message: 'OTP has expired. Please request a new one.'
            };
        }

        // Check max attempts
        if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
            await prisma.otp.delete({ where: { email: email.toLowerCase() } });
            return {
                success: false,
                message: 'Maximum attempts exceeded. Please request a new OTP.'
            };
        }

        // Increment attempts and verify OTP
        const updatedRecord = await prisma.otp.update({
            where: { email: email.toLowerCase() },
            data: { attempts: { increment: 1 } }
        });

        // Verify OTP
        if (otpRecord.otp !== otp) {
            const remainingAttempts = MAX_OTP_ATTEMPTS - otpRecord.attempts - 1;
            return {
                success: false,
                message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
            };
        }

        // OTP is valid - delete it
        await prisma.otp.delete({ where: { email: email.toLowerCase() } });

        return { success: true };
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return { success: false, message: 'Verification failed. Please try again.' };
    }
}

/**
 * Check if user can request a new OTP (rate limiting)
 * @param {string} email - Verifier email
 * @returns {Promise<Object>} Result with cooldown info
 */
export async function canRequestOTP(email) {
    try {
        const otpRecord = await prisma.otp.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!otpRecord) {
            return { canRequest: true };
        }

        // Check if OTP was created less than 60 seconds ago
        const timeSinceCreation = (new Date() - new Date(otpRecord.createdAt)) / 1000;
        if (timeSinceCreation < 60) {
            const cooldownRemaining = Math.ceil(60 - timeSinceCreation);
            return {
                canRequest: false,
                cooldownSeconds: cooldownRemaining,
                message: `Please wait ${cooldownRemaining} seconds before requesting a new OTP.`
            };
        }

        return { canRequest: true };
    } catch (error) {
        console.error('Error checking OTP rate limit:', error);
        return { canRequest: true }; // Allow on error to not block user
    }
}

/**
 * Clean up expired OTPs (can be called periodically)
 */
export async function cleanupExpiredOTPs() {
    try {
        const result = await prisma.otp.deleteMany({
            where: {
                expiresAt: { lt: new Date() }
            }
        });

        return { deletedCount: result.count };
    } catch (error) {
        console.error('Error cleaning up expired OTPs:', error);
        return { deletedCount: 0 };
    }
}

export default {
    generateOTP,
    getOTPExpiry,
    storeOTP,
    verifyOTP,
    canRequestOTP,
    cleanupExpiredOTPs,
    OTP_EXPIRY_MINUTES
};
