import { generateSecureUploadLink } from './OneDriveHelper';
import { emailTemplates } from './emailTemplates';
/**
 * Sends an email using the Microsoft Graph API
 */
export const sendEmailViaGraphAPI = async (msalInstance, account, emailConfig, taxType='personal') => {
  const { subject, body, to } = emailConfig;

  try {
    // 1. Acquire an access token silently
    const tokenRequest = {
      scopes: ["Mail.Send"],
      account: account
    };
    const authResult = await msalInstance.acquireTokenSilent(tokenRequest);

    // 2. Construct the Graph API payload for an HTML email
    const mailPayload = {
      message: {
        subject: subject,
        body: {
          contentType: "HTML", // This is the magic word that fixes the formatting!
          content: body
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ]
      },
      saveToSentItems: "true"
    };

    if (taxType.toLowerCase() === 'cvitp') {
        mailPayload.message.from = {
            emailAddress: {
                address: "cvitp-team@orientalbiz.ca"
            }
        };
    }

    // 3. Make the API call
    const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authResult.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(mailPayload)
    });

    if (!response.ok) {
      throw new Error(`Graph API Error: ${response.statusText}`);
    }

    return true; // Success!

  } catch (error) {
    console.error("Failed to send email via Graph API:", error);
    throw error;
  }
};

/**
 * Generates the email draft details so the agent can review them in a modal
 */
export const generateRequestDetailsDraft = async (config) => {
  const { 
    customerEmail, 
    customerData, 
    msalInstance, 
    account, 
    templateType = 'cvitp',
    action = 'requestDetails',
    customData = {}
  } = config;

  try {

    // Generate secure upload link from OneDrive
    let uploadLink;
    try {
      uploadLink = await generateSecureUploadLink(msalInstance, account, customerData, templateType === 'cvitp' ? 'CVITP' : templateType);
    } catch (error) {
      console.warn('Could not generate OneDrive link, using fallback:', error);
    }

    let template;
    let bodyTemplate;

    switch(action) {
        case 'requestEsign':
            switch(templateType.toLowerCase()) {
                case 'personal': template = emailTemplates.personalRequestEsign; break;
                case 'corporate': template = emailTemplates.corporateRequestEsign; break;
                case 'cvitp':
                default: template = emailTemplates.cvitpRequestEsign; break;
            }
            bodyTemplate = template.bodyTemplate(customData.generatedLink, customData.taxYear, customData.clientName);
            break;
            
        case 'requestDocument':
            switch(templateType.toLowerCase()) {
                case 'personal': template = emailTemplates.personalRequestDocument; break;
                case 'corporate': template = emailTemplates.corporateRequestDocument; break;
                case 'cvitp':
                default: template = emailTemplates.cvitpRequestDocument; break;
            }
            const customerFolderName = (customerData.name || customerData.businessNumber || customerData.corporateName || 'Unknown_Customer').replace(/[\\/:*?"<>|]/g, '_');
            bodyTemplate = template.bodyTemplate(customerFolderName, uploadLink);
            break;
            
        case 'requestDetails':
        default:
            switch(templateType.toLowerCase()) {
                case 'personal': template = emailTemplates.personalRequestDetails; break;
                case 'corporate': template = emailTemplates.corporateRequestDetails; break;
                case 'cvitp':
                default: template = emailTemplates.cvitpRequestDetails; break;
            }
            bodyTemplate = template.bodyTemplate(uploadLink);
            break;
    }

    // Return the configuration object instead of launching an email client
    return {
      subject: template.subject,
      body: bodyTemplate,
      to: customerEmail || 'cvitp-team@orientalbiz.ca'
    };

  } catch (error) {
    console.error('Error generating email draft:', error);
    throw new Error('Error generating email draft: ' + error.message);
  }
};