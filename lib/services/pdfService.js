import jsPDF from 'jspdf';
import { uploadFileToS3 } from './fileService';

/**
 * Generate PDF verification report with official letterhead
 * @param {Object} verificationData - Complete verification data
 * @param {Object} employeeData - Employee information
 * @returns {Object} PDF upload result with S3 URL
 */
export async function generateVerificationReportPDF(verificationData, employeeData) {
  try {
    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // PDF dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Add letterhead
    addLetterhead(pdf, pageWidth, margin);

    // Add title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EMPLOYMENT VERIFICATION REPORT', margin, 80, { align: 'left' });

    // Add verification details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const verificationInfo = [
      `Verification ID: ${verificationData.verificationId}`,
      `Date of Verification: ${new Date(verificationData.verifiedAt).toLocaleDateString()}`,
      `Requested by: ${verificationData.verifierName}`,
      `Overall Status: ${verificationData.overallStatus.toUpperCase()}`,
      `Match Score: ${verificationData.matchScore}%`
    ];

    let yPosition = 95;
    verificationInfo.forEach(line => {
      pdf.text(line, margin, yPosition);
      yPosition += 7;
    });

    // Add employee details section
    yPosition += 10;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EMPLOYEE DETAILS', margin, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    const employeeInfo = [
      ['Employee ID:', employeeData.employeeId],
      ['Full Name:', employeeData.name],
      ['Entity Name:', employeeData.entityName],
      ['Department:', employeeData.department],
      ['Designation:', employeeData.designation],
      ['Date of Joining:', formatDate(employeeData.dateOfJoining)],
      ['Date of Leaving:', formatDate(employeeData.dateOfLeaving)],
      ['Exit Reason:', employeeData.exitReason],
      ['F&F Status:', employeeData.fnfStatus]
    ];

    employeeInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, margin + 40, yPosition);
      yPosition += 8;
    });

    // Add comparison table
    yPosition += 15;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VERIFICATION COMPARISON', margin, yPosition);

    yPosition += 10;
    
    // Table headers
    const tableHeaders = ['Field', 'Provided Data', 'Company Records', 'Status'];
    const columnWidths = [40, 50, 50, 30];
    let xPos = margin;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    tableHeaders.forEach((header, index) => {
      pdf.text(header, xPos, yPosition);
      xPos += columnWidths[index];
    });

    yPosition += 8;
    xPos = margin;

    // Table data
    pdf.setFont('helvetica', 'normal');
    verificationData.comparisonResults.forEach(result => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
        
        // Add letterhead to new page
        addLetterhead(pdf, pageWidth, margin);
      }

      const row = [
        result.label,
        result.verifierValue,
        result.companyValue,
        result.isMatch ? '✓ Match' : '✗ Mismatch'
      ];

      xPos = margin;
      row.forEach((cell, index) => {
        if (index === 3) { // Status column - add color
          if (result.isMatch) {
            pdf.setTextColor(0, 128, 0); // Green
          } else {
            pdf.setTextColor(255, 0, 0); // Red
          }
        }
        
        // Wrap text if needed
        const text = pdf.splitTextToSize(cell || 'N/A', columnWidths[index] - 2);
        pdf.text(text, xPos, yPosition);
        xPos += columnWidths[index];
      });

      pdf.setTextColor(0, 0, 0); // Reset to black
      yPosition += 10;
    });

    // Add summary
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
      
      // Add letterhead to new page
      addLetterhead(pdf, pageWidth, margin);
    }

    yPosition += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SUMMARY', margin, yPosition);
    
    yPosition += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    const summaryText = pdf.splitTextToSize(verificationData.summary, contentWidth);
    summaryText.forEach(line => {
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    });

    // Add footer
    yPosition = pageHeight - 30;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text('This is an official verification document issued by ', margin, yPosition);
    yPosition += 5;
    pdf.text('the HR Department. For any queries, please contact hr@company.com', margin, yPosition);

    // Add signature line
    yPosition += 15;
    pdf.setFont('helvetica', 'normal');
    pdf.text('_________________________', margin + 80, yPosition);
    yPosition += 5;
    pdf.text('Authorized Signatory', margin + 80, yPosition);

    // Generate PDF buffer
    const pdfBuffer = pdf.output('arraybuffer');
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

    // Create file object for upload
    const file = new File([pdfBlob], `verification-report-${verificationData.verificationId}.pdf`, {
      type: 'application/pdf'
    });

    // Upload to S3
    const uploadResult = await uploadFileToS3(file, `reports/${verificationData.verificationId}`);

    return uploadResult;

  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF report: ${error.message}`);
  }
}

/**
 * Add letterhead to PDF
 * @param {Object} pdf - jsPDF instance
 * @param {Number} pageWidth - Page width
 * @param {Number} margin - Page margin
 */
function addLetterhead(pdf, pageWidth, margin) {
  // Company name at top
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('COMPANY NAME', margin, 20);
  
  // Address
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('123 Business Avenue, Corporate District, City - 123456', margin, 28);
  pdf.text('Phone: +91-80-1234-5678 | Email: hr@company.com | Website: www.company.com', margin, 34);
  
  // Divider line
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(margin, 40, pageWidth - margin, 40);
  
  // Document type
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Official Document - Employee Verification', margin, 48);
}

/**
 * Format date for display in PDF
 * @param {Date|String} date - Date to format
 * @returns {String} Formatted date
 */
function formatDate(date) {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  
  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Generate PDF for appeal response
 * @param {Object} appealData - Appeal data with response
 * @returns {Object} PDF upload result
 */
export async function generateAppealResponsePDF(appealData) {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;

    // Add letterhead
    addLetterhead(pdf, pageWidth, margin);

    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('APPEAL RESPONSE', margin, 80);

    // Appeal details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const appealInfo = [
      `Appeal ID: ${appealData.appealId}`,
      `Employee ID: ${appealData.employeeId}`,
      `Status: ${appealData.status.toUpperCase()}`,
      `Response Date: ${new Date(appealData.reviewedAt).toLocaleDateString()}`
    ];

    let yPosition = 95;
    appealInfo.forEach(line => {
      pdf.text(line, margin, yPosition);
      yPosition += 8;
    });

    // HR Response
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('HR DEPARTMENT RESPONSE', margin, yPosition);
    
    yPosition += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    const responseText = pdf.splitTextToSize(appealData.hrResponse, pageWidth - (margin * 2));
    responseText.forEach(line => {
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    });

    // Generate PDF buffer
    const pdfBuffer = pdf.output('arraybuffer');
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

    // Create file object for upload
    const file = new File([pdfBlob], `appeal-response-${appealData.appealId}.pdf`, {
      type: 'application/pdf'
    });

    // Upload to S3
    const uploadResult = await uploadFileToS3(file, `appeals/${appealData.appealId}`);

    return uploadResult;

  } catch (error) {
    console.error('Appeal PDF generation error:', error);
    throw new Error(`Failed to generate appeal PDF: ${error.message}`);
  }
}

/**
 * Download PDF buffer directly (for local development)
 * @param {Object} verificationData - Verification data
 * @param {Object} employeeData - Employee data
 * @returns {Buffer} PDF buffer
 */
export function generatePDFBuffer(verificationData, employeeData) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Similar implementation as above but return buffer instead of uploading
  // This is used for immediate downloads in development
  
  return pdf.output('arraybuffer');
}