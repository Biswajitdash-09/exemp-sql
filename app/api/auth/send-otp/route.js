import { NextResponse } from 'next/server';
import { generateOTP, storeOTP, canRequestOTP, OTP_EXPIRY_MINUTES } from '@/lib/services/otp.service';
import { sendOTPEmail } from '@/lib/services/emailService';
import { sendOTPEmailSMTP } from '@/lib/services/smtpService';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Send OTP to verifier email
 * POST /api/auth/send-otp
 * 
 * Uses SMTP locally, Brevo API in production
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { email } = body;

        // Validate email
        if (!email) {
            return NextResponse.json({
                success: false,
                message: 'Email is required'
            }, { status: 400 });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({
                success: false,
                message: 'Please enter a valid email address'
            }, { status: 400 });
        }

        // Block personal email domains
        const blockedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
        const emailDomain = email.split('@')[1].toLowerCase();
        if (blockedDomains.includes(emailDomain)) {
            return NextResponse.json({
                success: false,
                message: 'Please use your company email address. Personal emails are not allowed.'
            }, { status: 400 });
        }

        // Check rate limiting
        const rateLimitCheck = await canRequestOTP(email);
        if (!rateLimitCheck.canRequest) {
            return NextResponse.json({
                success: false,
                message: rateLimitCheck.message,
                cooldownSeconds: rateLimitCheck.cooldownSeconds
            }, { status: 429 });
        }

        // Generate OTP
        const otp = generateOTP();

        // Store OTP in database
        const storeResult = await storeOTP(email, otp);
        if (!storeResult.success) {
            return NextResponse.json({
                success: false,
                message: 'Failed to generate OTP. Please try again.'
            }, { status: 500 });
        }

        // Send email - use different methods for dev vs production
        sendEmailAsync(email, otp);

        // Return success immediately
        return NextResponse.json({
            success: true,
            message: `OTP sent to ${email}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
            expiryMinutes: OTP_EXPIRY_MINUTES
        }, { status: 200 });

    } catch (error) {
        console.error('[OTP] Send OTP error:', error.message);

        return NextResponse.json({
            success: false,
            message: 'Failed to send OTP. Please try again.',
            error: isDev ? error.message : undefined
        }, { status: 500 });
    }
}

/**
 * Send email - SMTP for local, Brevo API for production
 * Vercel blocks SMTP connections, so we must use API in production
 */
async function sendEmailAsync(email, otp) {
    try {
        if (isDev && process.env.SMTP_USER && process.env.SMTP_PASS) {
            // Use SMTP locally (better for testing)
            console.log(`[OTP] Sending OTP to ${email} via SMTP (local)`);
            const result = await sendOTPEmailSMTP(email, otp);
            console.log(`[OTP] ✅ Email sent via SMTP, messageId: ${result.messageId}`);
        } else {
            // Use Brevo API in production (works with Vercel)
            console.log(`[OTP] Sending OTP to ${email} via Brevo API (production)`);

            if (!process.env.BREVO_API_KEY) {
                console.error(`[OTP] ❌ BREVO_API_KEY not configured!`);
                return;
            }

            const result = await sendOTPEmail(email, otp);
            console.log(`[OTP] ✅ Email sent via Brevo API`);
        }
    } catch (error) {
        console.error(`[OTP] ❌ Failed to send email to ${email}:`, error.message);
    }
}
