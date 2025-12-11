/**
 * Resend Email Service
 * Alternative email provider for OTP and notifications
 */

import { Resend } from 'resend';

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Employee Verification Portal';

/**
 * Send email using Resend
 */
async function sendEmail(to, subject, html, text) {
  if (!resend) {
    console.warn('[RESEND] API key not configured');
    throw new Error('Resend API key not configured');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${COMPANY_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: subject,
      html: html,
      text: text
    });

    if (error) {
      console.error('[RESEND] Error:', error);
      throw new Error(error.message);
    }

    console.log('[RESEND] Email sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('[RESEND] Failed to send email:', error);
    throw error;
  }
}

/**
 * Send OTP email
 */
export async function sendOTPEmailResend(email, otp) {
  const subject = `Your OTP Code - ${COMPANY_NAME}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your OTP Code</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 500px; margin: 0 auto; padding: 20px; }
        .header { background: #007A3D; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .otp-code { 
          font-size: 36px; 
          font-weight: bold; 
          letter-spacing: 8px; 
          text-align: center; 
          background: #007A3D; 
          color: white; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0;
        }
        .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 10px; border-radius: 5px; margin-top: 20px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${COMPANY_NAME}</h1>
        <p>Employee Verification Portal</p>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) for logging in is:</p>
        
        <div class="otp-code">${otp}</div>
        
        <p><strong>This OTP is valid for 5 minutes.</strong></p>
        
        <div class="warning">
          <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone.
        </div>
        
        <p>If you did not request this OTP, please ignore this email.</p>
        
        <p>Best regards,<br>${COMPANY_NAME} Team</p>
      </div>
      <div class="footer">
        <p>This is an automated message. Please do not reply.</p>
      </div>
    </body>
    </html>
  `;

  const text = `Your OTP for ${COMPANY_NAME} login is: ${otp}. This OTP is valid for 5 minutes. Do not share this with anyone.`;

  return sendEmail(email, subject, html, text);
}

export default {
  sendOTPEmailResend
};
