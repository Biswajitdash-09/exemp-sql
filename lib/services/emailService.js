import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SendGrid API key not configured. Email features will be disabled.');
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@company.com';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Employee Verification Portal';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'hr@company.com';

/**
 * General email sender function
 * @param {String} to - Recipient email
 * @param {String} subject - Email subject
 * @param {String} html - HTML email content
 * @param {String} text - Plain text email content (optional)
 * @returns {Object} SendGrid response
 */
export async function sendEmail(to, subject, html, text = null) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }

    const msg = {
      to,
      from: FROM_EMAIL,
      subject,
      html,
      ...(text && { text })
    };

    const response = await sgMail.send(msg);
    return { success: true, response };

  } catch (error) {
    console.error('Email send error:', error);
    
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send welcome email to new verifier
 * @param {Object} verifier - Verifier object
 * @returns {Object} SendGrid response
 */
export async function sendWelcomeEmail(verifier) {
  const subject = `Welcome to ${COMPANY_NAME} Employee Verification Portal`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Employee Verification Portal</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${COMPANY_NAME}</h1>
        </div>
        <div class="content">
          <p>Dear ${verifier.companyName} Team,</p>
          <p>Thank you for registering with our Employee Verification Portal. Your account has been created successfully with the email address: <strong>${verifier.email}</strong></p>
          
          <p>You can now:</p>
          <ul>
            <li>Submit employee verification requests</li>
            <li>Track verification status</li>
            <li>Download official verification reports</li>
            <li>Submit appeals for any discrepancies</li>
          </ul>
          
          <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login" class="btn">Login to Your Account</a></p>
          
          <p>If you have any questions, please don't hesitate to contact our HR team at ${SUPPORT_EMAIL}.</p>
          
          <p>Best regards,<br>
          HR Team<br>
          ${COMPANY_NAME}</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(verifier.email, subject, html);
}

/**
 * Send verification report email
 * @param {Object} data - Verification data
 * @param {String} verifierEmail - Verifier's email
 * @param {String} pdfUrl - URL to generated PDF report
 * @returns {Object} SendGrid response
 */
export async function sendVerificationReportEmail(data, verifierEmail, pdfUrl) {
  const subject = `Employee Verification Report - ${data.employeeId}`;
  
  const getStatusColor = (isMatch) => isMatch ? '#28a745' : '#dc3545';
  const getStatusText = (isMatch) => isMatch ? '✓ Match' : '✗ Mismatch';
  
  const comparisonRows = data.comparisonResults.map(result => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${result.label}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${result.verifierValue}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${result.companyValue}</td>
      <td style="padding: 8px; border: 1px solid #ddd; color: ${getStatusColor(result.isMatch)}; font-weight: bold;">
        ${getStatusText(result.isMatch)}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Employee Verification Report</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .summary { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background: #f8f9fa; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Employee Verification Report</h1>
          <p>Official Employment Details Verification</p>
        </div>
        <div class="content">
          <p>Dear Verifier,</p>
          <p>Thank you for using our Employee Verification Portal. The verification for employee <strong>${data.employeeData.employeeId}</strong> has been completed.</p>
          
          <div class="summary">
            <h3>Verification Summary</h3>
            <p><strong>Employee:</strong> ${data.employeeData.name} (${data.employeeData.employeeId})</p>
            <p><strong>Overall Status:</strong> <span style="color: ${data.overallStatus === 'matched' ? '#28a745' : data.overallStatus === 'partial_match' ? '#ffc107' : '#dc3545'}">${data.overallStatus.toUpperCase()}</span></p>
            <p><strong>Match Score:</strong> ${data.matchScore}%</p>
            <p><strong>Verification ID:</strong> ${data.verificationId}</p>
            <p><strong>F&F Status:</strong> ${data.employeeData.fnfStatus}</p>
          </div>
          
          <h3>Detailed Comparison</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Your Data</th>
                <th>Company Records</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${comparisonRows}
            </tbody>
          </table>
          
          <p><strong>Summary:</strong> ${data.summary}</p>
          
          ${pdfUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${pdfUrl}" class="btn" target="_blank">Download Official Report (PDF)</a>
            </div>
          ` : ''}
          
          <p>If you have any questions about these results or if any information appears to be incorrect, please submit an appeal through the portal or contact our HR team directly at ${SUPPORT_EMAIL}.</p>
          
          <p>Best regards,<br>
          HR Team<br>
          ${COMPANY_NAME}</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(verifierEmail, subject, html);
}

/**
 * Send appeal notification email to HR
 * @param {Object} appeal - Appeal object
 * @returns {Object} SendGrid response
 */
export async function sendAppealNotificationEmail(appeal) {
  const subject = `New Appeal Submitted - Employee ${appeal.employeeId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Appeal Submitted</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .alert { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Appeal Submitted</h1>
        </div>
        <div class="content">
          <div class="alert">
            <strong>Action Required:</strong> A new appeal has been submitted that requires your review.
          </div>
          
          <p>Dear HR Team,</p>
          <p>A new appeal has been submitted by <strong>${appeal.verifierId.companyName}</strong> regarding the verification of employee <strong>${appeal.employeeId}</strong>.</p>
          
          <h3>Appeal Details</h3>
          <ul>
            <li><strong>Appeal ID:</strong> ${appeal.appealId}</li>
            <li><strong>Employee ID:</strong> ${appeal.employeeId}</li>
            <li><strong>Verifier:</strong> ${appeal.verifierId.companyName} (${appeal.verifierId.email})</li>
            <li><strong>Status:</strong> <span style="color: #ffc107;">PENDING</span></li>
            <li><strong>Submitted:</strong> ${new Date(appeal.createdAt).toLocaleString()}</li>
          </ul>
          
          <h3>Verifier's Comments</h3>
          <p style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            ${appeal.comments}
          </p>
          
          ${appeal.mismatchedFields && appeal.mismatchedFields.length > 0 ? `
            <h3>Mismatched Fields</h3>
            <ul>
              ${appeal.mismatchedFields.map(field => `
                <li><strong>${field.fieldName}:</strong> Verifier provided "${field.verifierValue}" but records show "${field.companyValue}"</li>
              `).join('')}
            </ul>
          ` : ''}
          
          ${appeal.supportingDocument ? `
            <p><strong>Supporting Document:</strong> ${appeal.supportingDocument.originalName} (${(appeal.supportingDocument.size / 1024).toFixed(2)} KB)</p>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/appeals" class="btn">Review Appeal</a>
          </div>
          
          <p>Please review this appeal at your earliest convenience and provide a response to the verifier.</p>
          
          <p>Best regards,<br>
          ${COMPANY_NAME} System</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(SUPPORT_EMAIL, subject, html);
}

/**
 * Send appeal response email to verifier
 * @param {Object} appeal - Appeal object with response
 * @param {String} verifierEmail - Verifier's email
 * @returns {Object} SendGrid response
 */
export async function sendAppealResponseEmail(appeal, verifierEmail) {
  const subject = `Response to Your Appeal - Employee ${appeal.employeeId}`;
  const statusColor = appeal.status === 'approved' ? '#28a745' : '#dc3545';
  const statusText = appeal.status === 'approved' ? 'APPROVED' : 'REJECTED';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Appeal Response</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .status { background: ${statusColor}; color: white; padding: 10px; text-align: center; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .response { background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0; }
        .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appeal Response</h1>
        </div>
        <div class="content">
          <p>Dear Verifier,</p>
          <p>Your appeal regarding the verification of employee <strong>${appeal.employeeId}</strong> has been reviewed by our HR team.</p>
          
          <div class="status">
            Appeal Status: ${statusText}
          </div>
          
          <h3>HR Response</h3>
          <div class="response">
            ${appeal.hrResponse}
          </div>
          
          <h3>Appeal Details</h3>
          <ul>
            <li><strong>Appeal ID:</strong> ${appeal.appealId}</li>
            <li><strong>Employee ID:</strong> ${appeal.employeeId}</li>
            <li><strong>Submitted:</strong> ${new Date(appeal.createdAt).toLocaleDateString()}</li>
            <li><strong>Reviewed:</strong> ${new Date(appeal.reviewedAt).toLocaleDateString()}</li>
          </ul>
          
          <p>If you have any further questions or require additional information, please don't hesitate to contact our HR team at ${SUPPORT_EMAIL}.</p>
          
          <p>Best regards,<br>
          HR Team<br>
          ${COMPANY_NAME}</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(verifierEmail, subject, html);
}