// Email Templates for various workflows
// This utility provides pre-formatted email bodies for different document request scenarios

export const emailTemplates = {
    cvitpRequestDetails: {
        subject: 'CVITP Tax Clinic - Required Documents Checklist',
        bodyTemplate: (uploadLink) => `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.6; max-width: 600px;">
        <p>Thank you for reaching out to us regarding the filing of your income tax return. We're here to help you every step of the way.</p>

        <p>In order to proceed, we will need some essential information and documents for each year from you to ensure your tax return is accurate and complete.</p>

        <p>Here's what we need:</p>

        <p><strong>📝 Personal Information:</strong><br>
        1. First Name<br>
        2. Middle Name<br>
        3. Last Name<br>
        4. SIN Number<br>
        5. Date of Birth (DD/MM/YYYY)<br>
        6. Status in Canada (Permanent Resident / Citizen)<br>
        7. Gender (Male / Female / Other)</p>

        <p><strong>🏠 Address & Contact Details:</strong><br>
        8. Door or Apt No.<br>
        9. Street Address<br>
        10. City<br>
        11. Postal Code<br>
        12. Phone Number<br>
        13. Email Address</p>

        <p><strong>📄 Financial/Immigration Details:</strong><br>
        14. Total Rent Paid for each Year<br>
        15. Did you immigrate to Canada? (Yes/No)<br>
        16. If yes, Date of Entry into Canada</p>

        <p><strong>📑 Tax Slips & Marital/Family Info:</strong><br>
        17. All relevant tax slips (T4, T5007, T4A, T2202, etc.)<br>
        18. Marital Status (Single / Married / Separated / Widowed / Divorced)<br>
        19. If married – spouse's details (same as questions #1–18)<br>
        20. If you have children under 18 – full names, DOBs, gender</p>

        <p>Please feel free to send all the necessary information and documents via the secure document upload portal below or in a single email to <a href="mailto:cvitp-team@orientalbiz.ca" style="color: #0056b3; text-decoration: none;">cvitp-team@orientalbiz.ca</a>.</p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 400px; border: 1px solid #e1e1e1; border-radius: 8px; font-family: Arial, sans-serif; margin-top: 20px; margin-bottom: 20px;">
          <tr>
            <td>
              <a href="${uploadLink}" style="text-decoration: none; color: inherit; display: block;">
                <div style="padding: 15px; background-color: #f9f9f9; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                  <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #333333;">📤 Secure Document Upload</h3>
                  <p style="margin: 0; font-size: 14px; color: #666666;">Click here to securely upload your documents to Orientalbiz.</p>
                </div>
              </a>
            </td>
          </tr>
        </table>

        <p>Providing complete and accurate information will help ensure your tax returns are prepared correctly and efficiently.</p>

        <p>If you have any trouble gathering the documents or need any assistance, please let us know.<br>
        We are here to make this process as smooth as possible for you.</p>

        <p>Thank you for choosing Oriental Business Solutions!</p>

        <p>Best regards,<br>
        <strong>CVITP Tax Clinic Team</strong><br>
        Oriental Business Solutions Inc.<br>
        📧 <a href="mailto:cvitp-team@orientalbiz.ca" style="color: #0056b3; text-decoration: none;">cvitp-team@orientalbiz.ca</a><br>
        📞 <a href="tel:+16478475477" style="color: #0056b3; text-decoration: none;">+1 (647) 847-5477</a><br>    
        Contact us for any queries</p>
    </div>`
    },

    cvitpRequestEsign: {
        subject: `Action Required: Review & Sign Your Tax Return Draft`,
        bodyTemplate: (generatedLink, taxYear, clientName) => `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>Hello ${clientName},</p>
          <p>Our team has completed the draft for your <strong>${taxYear}</strong> tax return.</p>
          <p>Please use our secure client portal link below to review the draft, supply your authorization signature:</p>
          <div style="margin: 20px 0;">
            <a href="${generatedLink}" style="display: inline-block; padding: 12px 24px; background-color: #198754; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Review &amp; Sign Tax Return</a>
          </div>
          <p style="font-size: 10px;">If the button doesn't work, you can copy and paste the following link into your browser:
          <a href="${generatedLink}" style="color: #0d6efd; text-decoration: none;">${generatedLink}</a></p>
        <p>Best regards,<br>
        <strong>CVITP Tax Clinic Team</strong><br>
        Oriental Business Solutions Inc.<br>
        📧 <a href="mailto:cvitp-team@orientalbiz.ca" style="color: #0056b3; text-decoration: none;">cvitp-team@orientalbiz.ca</a><br>
        📞 <a href="tel:+16478475477" style="color: #0056b3; text-decoration: none;">+1 (647) 847-5477</a><br>    
        Contact us for any queries</p>
        </div>
      `
    },

    personalTaxRequestDetails: {
        subject: 'Personal Tax Return - Required Documents',
        bodyTemplate: (uploadLink) => `Thank you for choosing Oriental Business Solutions for your personal tax filing needs.

To prepare your personal tax return accurately, we require the following documents and information:

1. Notice of Assessment from previous year
2. T4 slips (Employment Income)
3. T5 slips (Investment Income)
4. T4A slips (Other Income)
5. Receipts for deductible expenses
6. Mortgage interest statements
7. Property tax documents
8. Charitable donation receipts

📤 Secure Document Upload Link:
${uploadLink}

Or email them to: info@orientalbiz.ca


Best regards,
Oriental Business Solutions Inc.`
    },

    corporateTaxRequestDetails: {
        subject: 'Corporate Tax Return - Required Documents',
        bodyTemplate: (uploadLink) => `Thank you for entrusting Oriental Business Solutions with your corporate tax filing.

To prepare your corporate tax return, we will need the following:

1. Financial Statements (Balance Sheet & Income Statement)
2. General Ledger
3. Bank Statements & Reconciliations
4. Invoices & Receipts
5. T4 and T4A Slips for Employees
6. T5 Slips (if applicable)
7. Previous Year's Tax Return
8. Corporate Registration Documents

📤 Secure Document Upload Link:
${uploadLink}

Or contact us at: info@orientalbiz.ca

We look forward to assisting you.`
    },

    requestDocument: {
        subject: 'Please upload your documents',
        bodyTemplate: (customerFolderName, uploadLink) => `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>Hi ${customerFolderName},</p>
          <p>Please use the following link to securely upload your documents:</p>
          <div style="margin: 20px 0;">
            <a href="${uploadLink}" style="display: inline-block; padding: 12px 24px; background-color: #0d6efd; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Securely Upload Documents</a>
          </div>
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 12px; border-radius: 4px; border: 1px solid #e9ecef;">
            <a href="${uploadLink}" style="color: #0d6efd; text-decoration: none;">${uploadLink}</a>
          </p>
          <p>Thank you.</p>
        </div>
      `
    }
};
