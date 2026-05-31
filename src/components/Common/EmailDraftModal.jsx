import React, { useState, useEffect } from 'react';
import { generateRequestDetailsDraft, sendEmailViaGraphAPI } from '../../utils/sendEmail';

const EmailDraftModal = ({ customerData, msalInstance, account, onClose, action = 'requestDetails', taxType = 'CVITP', customData = {} }) => {
  const [emailDraft, setEmailDraft] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const customDataString = JSON.stringify(customData);

  // 1. Generate the draft as soon as the modal opens
  useEffect(() => {
    const parsedCustomData = JSON.parse(customDataString);
    const prepareDraft = async () => {
      try {
        const draft = await generateRequestDetailsDraft({
          customerEmail: customerData.email,
          customerData: customerData,
          msalInstance,
          account,
          templateType: taxType.toLowerCase(),
          action,
          customData: parsedCustomData
        });
        setEmailDraft(draft);
      } catch (error) {
        alert("Failed to prepare draft: " + error.message);
        onClose(); // Close if we fail
      }
    };
    
    prepareDraft();
  }, [customerData, msalInstance, account, onClose, action, taxType, customDataString]);

  // 2. Handle the Graph API Send
  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      await sendEmailViaGraphAPI(msalInstance, account, emailDraft);
      alert("Email sent successfully!");
      onClose();
    } catch (error) {
      alert("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  if (!emailDraft) return <div>Loading draft...</div>; // Optional: add a real spinner here

  return (
    <div className="modal-backdrop fade show" style={{ zIndex: 1600, display: 'block', opacity: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Review Email Draft</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={isSending}></button>
          </div>
          
          <div className="modal-body">
            <div className="mb-3">
              <strong>To:</strong> {emailDraft.to} <br/>
              <strong>Subject:</strong> {emailDraft.subject}
            </div>
            
            {/* The HTML preview window */}
            <div 
              style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '50vh', overflowY: 'auto' }}
              dangerouslySetInnerHTML={{ __html: emailDraft.body }} 
            />
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose} disabled={isSending}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSendEmail} disabled={isSending}>
              {isSending ? 'Sending via Graph API...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDraftModal;