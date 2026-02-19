import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/services/otp.service';
import { generateToken } from '@/lib/auth';
import prisma from '@/lib/prisma.js';
import { addVerifier, updateVerifier, logAccess } from '@/lib/data.service';
import bcrypt from 'bcryptjs';

/**
 * Verify OTP and login/register verifier
 * POST /api/auth/verify-otp
 * Body: { email: string, otp: string, companyName?: string }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { email, otp, companyName } = body;

        // Validate required fields
        if (!email || !otp) {
            return NextResponse.json({
                success: false,
                message: 'Email and OTP are required'
            }, { status: 400 });
        }

        // Verify OTP
        const verifyResult = await verifyOTP(email, otp);
        if (!verifyResult.success) {
            // Log failure (Invalid OTP)
            await logAccess({
                email: email.toLowerCase(),
                role: 'verifier',
                action: 'LOGIN_OTP',
                status: 'FAILURE',
                failureReason: 'Invalid OTP',
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown'
            });

            return NextResponse.json({
                success: false,
                message: verifyResult.message
            }, { status: 400 });
        }

        // Check if verifier exists
        let verifier = await prisma.verifier.findFirst({
            where: { email: email.toLowerCase() }
        });

        const isNewUser = !verifier;

        if (!verifier) {
            // Auto-register new verifier
            const emailDomain = email.split('@')[1];
            const defaultCompanyName = companyName || emailDomain.split('.')[0].toUpperCase();

            // Create a hashed placeholder password
            // This is required by the schema even for OTP users
            const placeholderPassword = await bcrypt.hash(Math.random().toString(36), 10);

            verifier = await addVerifier({
                email: email.toLowerCase(),
                companyName: defaultCompanyName,
                password: placeholderPassword,
                isActive: true,
                isEmailVerified: true
            });
        } else {
            // Update last login
            verifier = await updateVerifier(verifier.id, { lastLoginAt: new Date() });
        }

        // Log success
        await logAccess({
            email: verifier.email,
            role: 'verifier',
            action: 'LOGIN_OTP',
            status: 'SUCCESS',
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            metadata: {
                companyName: verifier.companyName,
                isNewUser: isNewUser
            }
        });

        // Generate JWT token
        const token = generateToken({
            id: verifier.id,
            email: verifier.email,
            companyName: verifier.companyName,
            role: 'verifier'
        });

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                verifier: {
                    id: verifier.id,
                    email: verifier.email,
                    companyName: verifier.companyName
                }
            }
        }, { status: 200 });

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Verify OTP error details:', error);
        }

        return NextResponse.json({
            success: false,
            message: 'Verification failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
