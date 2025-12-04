/**
 * Simple Client-Side PDF Generation
 * Creates PDF in browser without requiring server upload
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateVerificationPDF(verificationData, employeeData) {
    const pdf = new jsPDF();

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(0, 122, 61); // Green color
    pdf.text('Employment Verification Report', 105, 20, { align: 'center' });

    // Date
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

    // Employee Details
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Employee Information', 20, 45);

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Employee ID: ${employeeData.employeeId || 'N/A'}`, 20, 55);
    pdf.text(`Name: ${employeeData.name || 'N/A'}`, 20, 62);
    pdf.text(`Entity: ${employeeData.entityName || 'N/A'}`, 20, 69);
    pdf.text(`Designation: ${employeeData.designation || 'N/A'}`, 20, 76);

    // Comparison Results Table
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Verification Results', 20, 90);

    const tableData = verificationData.comparisonResults.map(row => [
        row.field || '',
        row.verifierValue || 'Not Provided',
        row.companyValue || 'N/A',
        row.isMatch ? '✓ Match' : '✗ Mismatch'
    ]);

    autoTable(pdf, {
        startY: 95,
        head: [['Field', 'Entered Value', 'Official Record', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 122, 61] },
        styles: { fontSize: 9 },
        didDrawCell: (data) => {
            if (data.column.index === 3 && data.cell.section === 'body') {
                if (data.cell.text[0].includes('Match')) {
                    data.cell.styles.textColor = [0, 128, 0];
                } else {
                    data.cell.styles.textColor = [255, 0, 0];
                }
            }
        }
    });

    // Footer
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128);
        pdf.text(
            `Page ${i} of ${pageCount} | Employee Verification Portal`,
            105,
            pdf.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    // Download the PDF
    pdf.save(`Verification_${employeeData.employeeId}_${new Date().getTime()}.pdf`);

    return { success: true };
}
