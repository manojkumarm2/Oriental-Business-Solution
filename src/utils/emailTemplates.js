// Email Templates for various workflows
// This utility provides pre-formatted email bodies for different document request scenarios

export const emailTemplates = {
    // --- 1. REQUEST DETAILS TEMPLATES ---
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
        Available: Mon - Fri 9AM to 6PM</p>
    </div>`
    },

    personalRequestDetails: {
        subject: 'Personal Tax Return - Required Documents',
        bodyTemplate: (uploadLink) => `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.6; max-width: 600px;">
        <p>Thank you for choosing Oriental Business Solutions for your personal tax filing needs.</p>
        <p>To prepare your personal tax return accurately, we require the following documents and information:</p>
        <p><strong>📑 Tax Slips & Documents:</strong><br>
        1. Notice of Assessment from previous year<br>
        2. T4 slips (Employment Income)<br>
        3. T5 slips (Investment Income)<br>
        4. T4A slips (Other Income)<br>
        5. Receipts for deductible expenses<br>
        6. Mortgage interest statements<br>
        7. Property tax documents<br>
        8. Charitable donation receipts</p>

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
        <p>Or email them to: <a href="mailto:info@orientalbiz.ca" style="color: #0056b3; text-decoration: none;">info@orientalbiz.ca</a></p>
        <p>Best regards,<br>
        <strong>Personal Tax Expert Team</strong><br>
        Oriental Business Solutions Inc.<br>
        📧 <a href="mailto:info@orientalbiz.ca" style="color: #0056b3; text-decoration: none;">info@orientalbiz.ca</a><br>
        📞 <a href="tel:+16478556177" style="color: #0056b3; text-decoration: none;">+1 (647) 855-6177</a></p>
    </div>`
    },

    corporateRequestDetails: {
        subject: 'Corporate Tax Return - Required Documents',
        bodyTemplate: (uploadLink) => `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.6; max-width: 600px;">
        <p>Thank you for entrusting Oriental Business Solutions with your corporate tax filing.</p>
        <p>To prepare your corporate tax return, we will need the following:</p>
        <p><strong>📑 Financial Documents:</strong><br>
        1. Financial Statements (Balance Sheet & Income Statement)<br>
        2. General Ledger<br>
        3. Bank Statements & Reconciliations<br>
        4. Invoices & Receipts<br>
        5. T4 and T4A Slips for Employees<br>
        6. T5 Slips (if applicable)<br>
        7. Previous Year's Tax Return<br>
        8. Corporate Registration Documents</p>

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
        <p>Or contact us at: <a href="mailto:info@orientalbiz.ca" style="color: #0056b3; text-decoration: none;">info@orientalbiz.ca</a></p>
        <p>We look forward to assisting you.<br><br>
        Best regards,<br>
        <strong>Corporate Tax Expert Team</strong><br>
        Oriental Business Solutions Inc.<br>
        📧 <a href="mailto:info@orientalbiz.ca" style="color: #0056b3; text-decoration: none;">info@orientalbiz.ca</a><br>
        📞 <a href="tel:+16478556177" style="color: #0056b3; text-decoration: none;">+1 (647) 855-6177</a></p>
    </div>`
    },

    // --- 2. REQUEST ESIGN TEMPLATES ---
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
        Available: Mon - Fri 9AM to 6PM</p>
        </div>
      `
    },

    personalRequestEsign: {
        subject: `Action Required: Review & Sign Your Personal Tax Return Draft`,
        bodyTemplate: (generatedLink, taxYear, clientName) => `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>Hello ${clientName},</p>
          <p>Our team has completed the draft for your <strong>${taxYear}</strong> personal tax return.</p>
          <p>Please use our secure client portal link below to review the draft and supply your authorization signature:</p>
          <div style="margin: 20px 0;">
            <a href="${generatedLink}" style="display: inline-block; padding: 12px 24px; background-color: #198754; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Review &amp; Sign Tax Return</a>
          </div>
          <p style="font-size: 10px;">If the button doesn't work, you can copy and paste the following link into your browser:
          <a href="${generatedLink}" style="color: #0d6efd; text-decoration: none;">${generatedLink}</a></p>
        <p>Best regards,<br>
        <strong>Personal Tax Expert Team</strong><br>
        Oriental Business Solutions Inc.<br>
        📧 <a href="mailto:info@orientalbiz.ca" style="color: #0056b3; text-decoration: none;">info@orientalbiz.ca</a><br>
        📞 <a href="tel:+16478556177" style="color: #0056b3; text-decoration: none;">+1 (647) 855-6177</a></p>
        </div>
      `
    },

    corporateRequestEsign: {
        subject: `Action Required: Review & Sign Your Corporate Tax Return Draft`,
        bodyTemplate: (generatedLink, taxYear, clientName) => `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>Hello ${clientName},</p>
          <p>Our team has completed the draft for your <strong>${taxYear}</strong> corporate tax return.</p>
          <p>Please use our secure client portal link below to review the draft and supply your authorization signature:</p>
          <div style="margin: 20px 0;">
            <a href="${generatedLink}" style="display: inline-block; padding: 12px 24px; background-color: #198754; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Review &amp; Sign Tax Return</a>
          </div>
          <p style="font-size: 10px;">If the button doesn't work, you can copy and paste the following link into your browser:
          <a href="${generatedLink}" style="color: #0d6efd; text-decoration: none;">${generatedLink}</a></p>
        <p>Best regards,<br>
        <strong>Corporate Tax Expert Team</strong><br>
        Oriental Business Solutions Inc.<br>
        📧 <a href="mailto:info@orientalbiz.ca" style="color: #0056b3; text-decoration: none;">info@orientalbiz.ca</a><br>
        📞 <a href="tel:+16478556177" style="color: #0056b3; text-decoration: none;">+1 (647) 855-6177</a></p>
        </div>
      `
    },

    // --- 3. REQUEST DOCUMENT TEMPLATES ---
    cvitpRequestDocument: {
        subject: 'Action Required: Please upload your CVITP Tax documents',
        bodyTemplate: (customerFolderName, uploadLink) => `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>Hi ${customerFolderName},</p>
          <p>Please use the following link to securely upload any additional documents for your CVITP tax file:</p>
          <div style="margin: 20px 0;">
            <a href="${uploadLink}" style="display: inline-block; padding: 12px 24px; background-color: #0d6efd; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Securely Upload Documents</a>
          </div>
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 12px; border-radius: 4px; border: 1px solid #e9ecef;">
            <a href="${uploadLink}" style="color: #0d6efd; text-decoration: none;">${uploadLink}</a>
          </p>
          <p>Thank you.<br><br>
          Best regards,<br>
          <strong>CVITP Tax Clinic Team</strong><br>
          Oriental Business Solutions Inc.<br>
          📧 <a href="mailto:cvitp-team@orientalbiz.ca" style="color: #0056b3; text-decoration: none;">cvitp-team@orientalbiz.ca</a><br>
          📞 <a href="tel:+16478475477" style="color: #0056b3; text-decoration: none;">+1 (647) 847-5477</a><br>
          Available: Mon - Fri 9AM to 6PM</p>
        </div>
      `
    },

    personalRequestDocument: {
        subject: 'Action Required: Please upload your Personal Tax documents',
        bodyTemplate: (customerFolderName, uploadLink) => `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>Hi ${customerFolderName},</p>
          <p>Please use the following link to securely upload any additional documents for your personal tax file:</p>
          <div style="margin: 20px 0;">
            <a href="${uploadLink}" style="display: inline-block; padding: 12px 24px; background-color: #0d6efd; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Securely Upload Documents</a>
          </div>
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 12px; border-radius: 4px; border: 1px solid #e9ecef;">
            <a href="${uploadLink}" style="color: #0d6efd; text-decoration: none;">${uploadLink}</a>
          </p>
          <p>Thank you.<br><br>
          Best regards,<br>
          <strong>Personal Tax Expert Team</strong><br>
          Oriental Business Solutions Inc.<br>
          📧 <a href="mailto:info@orientalbiz.ca" style="color: #0056b3; text-decoration: none;">info@orientalbiz.ca</a><br>
          📞 <a href="tel:+16478556177" style="color: #0056b3; text-decoration: none;">+1 (647) 855-6177</a></p>
        </div>
      `
    },

    corporateRequestDocument: {
        subject: 'Action Required: Please upload your Corporate Tax documents',
        bodyTemplate: (customerFolderName, uploadLink) => `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>Hi ${customerFolderName},</p>
          <p>Please use the following link to securely upload any additional documents for your corporate tax file:</p>
          <div style="margin: 20px 0;">
            <a href="${uploadLink}" style="display: inline-block; padding: 12px 24px; background-color: #0d6efd; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Securely Upload Documents</a>
          </div>
          <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 12px; border-radius: 4px; border: 1px solid #e9ecef;">
            <a href="${uploadLink}" style="color: #0d6efd; text-decoration: none;">${uploadLink}</a>
          </p>
          <p>Thank you.<br><br>
          Best regards,<br>
          <strong>Corporate Tax Expert Team</strong><br>
          Oriental Business Solutions Inc.<br>
          📧 <a href="mailto:info@orientalbiz.ca" style="color: #0056b3; text-decoration: none;">info@orientalbiz.ca</a><br>
          📞 <a href="tel:+16478556177" style="color: #0056b3; text-decoration: none;">+1 (647) 855-6177</a></p>
        </div>
      `
    },

    faxRequestLink: {
                subject: 'Secure Fax Submission Link from Oriental Business Solutions Inc.',
                bodyTemplate: (generatedLink) => `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 30px; border-radius: 8px;">
                        <h2 style="color: #1A1A4B; border-bottom: 2px solid #4A6EC9; padding-bottom: 10px;">Secure Fax Submission Link</h2>
                        <p>Hello,</p>
                        <p>Thank you for choosing Oriental Business Solutions Inc. for your secure document transmission needs.</p>
                        <p>As requested, here is your unique and secure link to send your paper applications or documents via fax to the Canada Revenue Agency (CRA) or your desired destination. This link is valid for a <strong>single use</strong>.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${generatedLink}" style="background-color: #4A6EC9; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Click Here to Send Your Secure Fax</a>
                        </div>
                        <h3 style="color: #1A1A4B; font-size: 16px;">Instructions:</h3>
                        <ol style="padding-left: 20px; color: #555; line-height: 1.6;">
                            <li>Click the secure link above.</li>
                            <li>Fill in the recipient's fax number (e.g., the CRA fax number) and your details on the form.</li>
                            <li>Attach your paper application or documents (PDF format, max 10MB).</li>
                            <li>Click 'Send Secure Fax' to complete the process.</li>
                        </ol>
                        <p>If you have any questions or encounter any issues, please do not hesitate to contact us by replying to this email.</p>
                        <p>Thank you.<br><br>
                        Best regards,<br>
                        <strong>Oriental Business Solutions Inc.</strong><br>
                        📧 <a href="mailto:info@orientalbiz.ca" style="color: #0056b3; text-decoration: none;">info@orientalbiz.ca</a><br>
                        📞 <a href="tel:+16478556177" style="color: #0056b3; text-decoration: none;">+1 (647) 855-6177</a></p>
                    </div>
                `,
    }
};
