import { NextResponse } from 'next/server';
import { generateOTP, storeOTP, canRequestOTP, OTP_EXPIRY_MINUTES } from '@/lib/services/otp.service';
import sgMail from '@sendgrid/mail';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Send OTP to verifier email
 * POST /api/auth/send-otp
 * 
 * Uses SendGrid API for reliable email delivery
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

        // Send email via SendGrid
        await sendEmailViaSendGrid(email, otp);

        // Return success
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
 * Send OTP email via SendGrid API
 */
async function sendEmailViaSendGrid(email, otp) {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
        console.error('[OTP] ❌ SENDGRID_API_KEY not configured!');
        throw new Error('SendGrid API key not configured');
    }

    sgMail.setApiKey(apiKey);

    const fromEmail = process.env.FROM_EMAIL || 'noreply@example.com';
    const companyName = process.env.COMPANY_NAME || 'Ex-Employee Verification Portal';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { color: white; margin: 0; font-size: 24px; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .otp-box { background: #667eea; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 8px; margin: 20px 0; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${companyName}</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>Your one-time password (OTP) for login is:</p>
                    <div class="otp-box">${otp}</div>
                    <p>This OTP is valid for <strong>5 minutes</strong>.</p>
                    <p>If you didn't request this OTP, please ignore this email.</p>
                    <p>Best regards,<br>${companyName} Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const msg = {
        to: email,
        from: {
            email: fromEmail,
            name: companyName
        },
        subject: `Your OTP Code: ${otp}`,
        html: htmlContent,
        text: `Your OTP is: ${otp}. Valid for 5 minutes.`
    };

    console.log(`[OTP] Sending OTP to ${email} via SendGrid...`);

    try {
        const response = await sgMail.send(msg);
        console.log(`[OTP] ✅ SendGrid email sent successfully to ${email}`);
        return response;
    } catch (error) {
        console.error(`[OTP] ❌ SendGrid error:`, error.message);
        if (error.response) {
            console.error(`[OTP] SendGrid response:`, error.response.body);
        }
        throw error;
    }
}
