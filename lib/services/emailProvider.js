/**
 * Unified Email Provider Service
 * Supports multiple email providers with A/B testing and fallback capabilities
 * 
 * Configuration via EMAIL_PROVIDER env variable:
 * - sendgrid: Use SendGrid only
 * - brevo: Use Brevo only (recommended - no domain verification needed)
 * - ab_test: Randomly select between Brevo and SendGrid (50/50)
 * - fallback: Try Brevo first, fall back to SendGrid on failure
 */

import sgMail from '@sendgrid/mail';
import * as Brevo from '@getbrevo/brevo';
import EmailLog from '../models/EmailLog.js';
import connectDB from '../db/mongodb.js';

// Initialize providers
let sendgridInitialized = false;
let brevoClient = null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@company.com';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Employee Verification Portal';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'hr@company.com';
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'brevo';

// Initialize SendGrid
function initSendGrid() {
    if (!sendgridInitialized && process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        sendgridInitialized = true;
        console.log('[EMAIL] SendGrid initialized');
    }
    return sendgridInitialized;
}

// Initialize Brevo
function initBrevo() {
    if (!brevoClient && process.env.BREVO_API_KEY) {
        brevoClient = new Brevo.TransactionalEmailsApi();
        brevoClient.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
        console.log('[EMAIL] Brevo initialized');
    }
    return brevoClient !== null;
}

/**
 * Select which provider to use based on configuration
 */
function selectProvider() {
    const provider = EMAIL_PROVIDER.toLowerCase();

    switch (provider) {
        case 'sendgrid':
            return 'sendgrid';
        case 'ab_test':
            // Random 50/50 selection for A/B testing
            return Math.random() < 0.5 ? 'brevo' : 'sendgrid';
        case 'fallback':
            return 'brevo'; // Start with Brevo, fallback to SendGrid
        case 'brevo':
        default:
            return 'brevo';
    }
}

/**
 * Log email delivery attempt
 */
async function logEmail(provider, emailType, recipient, subject, status, responseTime, messageId = null, error = null) {
    try {
        await connectDB();
        await EmailLog.create({
            provider,
            emailType,
            recipient,
            subject,
            status,
            responseTime,
            messageId,
            error: error ? String(error) : null
        });
    } catch (logError) {
        console.error('[EMAIL] Failed to log email:', logError.message);
    }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(to, subject, html, text) {
    if (!initSendGrid()) {
        throw new Error('SendGrid API key not configured');
    }

    const msg = {
        to,
        from: `${COMPANY_NAME} <${FROM_EMAIL}>`,
        subject,
        html,
        ...(text && { text })
    };

    const response = await sgMail.send(msg);
    return {
        messageId: response[0]?.headers?.['x-message-id'] || 'sg-' + Date.now(),
        provider: 'sendgrid'
    };
}

/**
 * Send email via Brevo (formerly SendinBlue)
 */
async function sendViaBrevo(to, subject, html, text) {
    if (!initBrevo()) {
        throw new Error('Brevo API key not configured');
    }

    const sendSmtpEmail = {
        sender: { name: COMPANY_NAME, email: FROM_EMAIL },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
        ...(text && { textContent: text })
    };

    const response = await brevoClient.sendTransacEmail(sendSmtpEmail);
    return {
        messageId: response?.body?.messageId || 'brevo-' + Date.now(),
        provider: 'brevo'
    };
}

/**
 * Main email sending function with provider selection and logging
 */
export async function sendEmail(to, subject, html, text = null, emailType = 'other') {
    const startTime = Date.now();
    let selectedProvider = selectProvider();
    let result = null;
    let error = null;

    console.log(`[EMAIL] Attempting to send via ${selectedProvider}...`);

    try {
        // Try primary provider
        if (selectedProvider === 'sendgrid') {
            result = await sendViaSendGrid(to, subject, html, text);
        } else {
            result = await sendViaBrevo(to, subject, html, text);
        }

        const responseTime = Date.now() - startTime;
        console.log(`[EMAIL] ✓ Sent via ${result.provider} in ${responseTime}ms`);

        // Log success
        await logEmail(result.provider, emailType, to, subject, 'sent', responseTime, result.messageId);

        return { success: true, provider: result.provider, messageId: result.messageId, responseTime };

    } catch (primaryError) {
        error = primaryError;
        console.error(`[EMAIL] ✗ ${selectedProvider} failed:`, primaryError.message);

        // Fallback logic - Brevo → SendGrid
        if (EMAIL_PROVIDER.toLowerCase() === 'fallback' && selectedProvider === 'brevo') {
            console.log('[EMAIL] Trying SendGrid as fallback...');
            try {
                result = await sendViaSendGrid(to, subject, html, text);
                const responseTime = Date.now() - startTime;
                console.log(`[EMAIL] ✓ Fallback to SendGrid succeeded in ${responseTime}ms`);

                await logEmail('sendgrid', emailType, to, subject, 'sent', responseTime, result.messageId);
                return { success: true, provider: 'sendgrid', messageId: result.messageId, responseTime, fallback: true };

            } catch (fallbackError) {
                console.error('[EMAIL] ✗ Fallback also failed:', fallbackError.message);
                error = fallbackError;
            }
        }

        // Log failure
        const responseTime = Date.now() - startTime;
        await logEmail(selectedProvider, emailType, to, subject, 'failed', responseTime, null, error.message);

        throw new Error(`Failed to send email: ${error.message}`);
    }
}

/**
 * Get email provider statistics for comparison
 */
export async function getEmailStats(days = 7) {
    try {
        await connectDB();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const stats = await EmailLog.getProviderStats(startDate, new Date());

        // Get recent logs for details
        const recentLogs = await EmailLog.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return { stats, recentLogs };
    } catch (error) {
        console.error('[EMAIL] Failed to get stats:', error);
        return { stats: [], recentLogs: [] };
    }
}

// Export configuration constants
export { FROM_EMAIL, COMPANY_NAME, SUPPORT_EMAIL, EMAIL_PROVIDER };
