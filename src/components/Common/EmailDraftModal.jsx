import React, { useState, useEffect } from 'react';
import { generateRequestDetailsDraft, sendEmailViaGraphAPI } from '../../utils/sendEmail';

const EmailDraftModal = ({ customerData, msalInstance, account, onClose, action = 'requestDetails', taxType = 'CVITP', customData = {} }) => {
  const [emailDraft, setEmailDraft] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [draftError, setDraftError] = useState('');

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
        setDraftError("Failed to prepare draft: " + error.message);
      }
    };
    
    prepareDraft();
  }, [customerData, msalInstance, account, onClose, action, taxType, customDataString]);

  // 2. Handle the Graph API Send
  const handleSendEmail = async () => {
    setIsSending(true);
    setSubmitStatus(null);
    try {
      await sendEmailViaGraphAPI(msalInstance, account, emailDraft, taxType.toLowerCase());
      setSubmitStatus({ type: 'success', message: 'Email sent successfully!' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setSubmitStatus({ type: 'danger', message: 'Failed to send email. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  if (draftError) return (
    <div className="modal-backdrop fade show d-flex justify-content-center align-items-center bg-white" style={{ zIndex: 1600, opacity: 0.9 }}>
      <div className="text-center p-4 bg-light rounded shadow border" style={{ maxWidth: '400px' }}>
        <div className="fs-1 text-danger mb-2">⚠️</div>
        <div className="fw-bold text-danger mb-3">{draftError}</div>
        <button className="btn btn-secondary px-4" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  if (!emailDraft) return (
    <div className="modal-backdrop fade show d-flex justify-content-center align-items-center bg-white" style={{ zIndex: 1600, opacity: 0.8 }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-2" role="status" aria-hidden="true"></div>
        <div className="fw-bold text-secondary">Preparing email draft...</div>
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop fade show" style={{ zIndex: 1600, display: 'block', opacity: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content position-relative">
          {isSending && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white" style={{ zIndex: 10, opacity: 0.8, borderRadius: 'inherit' }}>
              <div className="text-center">
                <div className="spinner-border text-primary mb-2" role="status" aria-hidden="true"></div>
                <div className="fw-bold text-secondary">Sending email...</div>
              </div>
            </div>
          )}
          <div className="modal-header">
            <h5 className="modal-title">Review Email Draft</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={isSending}></button>
          </div>
          
          <div className="modal-body">
            {submitStatus && (
              <div className={`alert alert-${submitStatus.type} py-2`} role="alert">
                {submitStatus.message}
              </div>
            )}
            <div className="row mb-3 align-items-end">
              <div className="col">
                <label className="fw-bold form-label">To:</label>
                <input type="email" className="form-control" value={emailDraft.to} onChange={(e) => setEmailDraft({ ...emailDraft, to: e.target.value })} disabled={isSending} />
              </div>
              <div className="col-auto">
                <button className="btn btn-primary" onClick={handleSendEmail} disabled={isSending || submitStatus?.type === 'success'}>
                  {isSending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
            <div className="mb-3">
              <label className="fw-bold form-label">Subject:</label>
              <input type="text" className="form-control" value={emailDraft.subject} onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })} disabled={isSending} />
            </div>
            
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="fw-bold form-label mb-0">Message Body:</label>
                <button 
                  type="button"
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={() => setIsEditingBody(!isEditingBody)}
                  disabled={isSending}
                >
                  {isEditingBody ? '👁️ Preview HTML' : '✏️ Edit HTML Source'}
                </button>
              </div>
              {isEditingBody ? (
                <textarea 
                  className="form-control" 
                  value={emailDraft.body} 
                  onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })} 
                  disabled={isSending}
                  style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '13px' }}
                />
              ) : (
                <div 
                  style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f8f9fa' }}
                  dangerouslySetInnerHTML={{ __html: emailDraft.body }} 
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDraftModal;