import React, { useState, useRef } from 'react';
import { loginRequest, getApiUrl } from '../authConfig';
import { useTaxPortal } from '../utils/useTaxPortal';
import TaxPortalLayout from '../components/Common/TaxPortalLayout';

const FAX_DESTINATION_GROUPS = [
  {
    group: "General Options",
    options: [
      { label: 'Type in a custom fax number', value: 'manual' }
    ]
  },
  {
    group: "Personal Taxes, Benefits, and T1",
    options: [
      { label: 'Sudbury Tax Centre (ON, QC, Atlantic) ➔ +1 (855) 276-1529', value: '18552761529' },
      { label: 'Winnipeg Tax Centre (West/Territories) ➔ +1 (204) 984-5164', value: '12049845164' },
      { label: 'Jonquière Tax Centre (QC Remainder) ➔ +1 (418) 548-0846', value: '14185480846' }
    ]
  },
  {
    group: "Business and Corporate Tax Programs",
    options: [
      { label: 'Summerside Tax Centre (GST/HST) ➔ +1 (902) 432-5180', value: '19024325180' },
      { label: 'Ottawa Tax Centre (Corporate/SR&ED) ➔ +1 (613) 957-9765', value: '16139579765' }
    ]
  },
  {
    group: "Non-Resident Filings and Special Accounts",
    options: [
      { label: 'Winnipeg Tax Centre (International/Non-Resident) ➔ +1 (204) 984-5164', value: '12049845164' },
      { label: 'Non-Resident Representative Authorizations ➔ +1 (866) 765-8460', value: '18667658460' }
    ]
  }
];

const FaxPage = () => {
  const portalState = useTaxPortal();
  const { account, msalInstance, error, setError, message, setMessage } = portalState;

  const fileInputRef = useRef(null);

  // Friendly defaults matching your verified business setup
  const [senderName, setSenderName] = useState('Ashok Manickam');
  const [senderEmail, setSenderEmail] = useState('fax@orientalbiz.ca');
  const [department, setDepartment] = useState('');
  
  const [selectedTarget, setSelectedTarget] = useState('manual');
  const [toNumber, setToNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTargetChange = (e) => {
    const val = e.target.value;
    setSelectedTarget(val);
    setToNumber(val !== 'manual' ? val : '');

    // Prepopulate the Department based on the destination office chosen
    const departmentMap = {
      '18552761529': 'Personal Taxes, Benefits, and T1',
      '12049845164': 'Personal Taxes / Non-Resident Filings',
      '14185480846': 'Personal Taxes, Benefits, and T1',
      '19024325180': 'Business and Corporate Tax Programs (GST/HST)',
      '16139579765': 'Corporate Tax / SR&ED',
      '18667658460': 'Non-Resident Representative Authorizations',
      'manual': ''
    };
    setDepartment(departmentMap[val] || '');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSendFax = async (e) => {
    e.preventDefault();
    const finalNumber = selectedTarget === 'manual' ? toNumber : selectedTarget;

    if (!finalNumber || !selectedFile || !senderName) {
      setError("Please fill out your name, the destination fax number, and attach a file before sending.");
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('to_number', finalNumber);
    formData.append('file', selectedFile);
    formData.append('sender_name', senderName);
    formData.append('sender_email', senderEmail);
    formData.append('department', department);
    formData.append('subject', subject);
    formData.append('message', messageText);

    try {
      let headers = {};
      if (account) {
        const tokenResponse = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account,
        });
        headers['Authorization'] = `Bearer ${tokenResponse.accessToken}`;
      }

      const response = await fetch(getApiUrl('/api/send-fax'), {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Success! Your fax has been queued and is now being transmitted.`);
        
        setToNumber('');
        setSelectedTarget('manual');
        setSelectedFile(null);
        setDepartment('');
        setSubject('');
        setMessageText('');
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError(`Could not send fax: ${data.detail || 'The server encountered an error.'}`);
      }
    } catch (err) {
      setError(`Connection Error: Unable to reach the fax service. Please check your internet line.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TaxPortalLayout
      title="CRA Fax Document Portal"
      description="Send tax documents and support files directly to the Canada Revenue Agency."
      portalState={portalState}
    >
      {/* Alert Status Banner */}
      {(error || message) && (
        <div className="mb-4">
          {error && <div className="alert alert-danger border-start border-danger border-4 shadow-sm">{error}</div>}
          {message && <div className="alert alert-success border-start border-success border-4 shadow-sm">{message}</div>}
        </div>
      )}

      {account ? (
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-4 p-md-5">
                <form onSubmit={handleSendFax}>
                  
                  {/* STEP 1: SENDER INFO */}
                  <div className="border-bottom pb-2 mb-4">
                    <h5 className="text-secondary fw-bold text-uppercase small tracking-wider">1. Your Information (Sender)</h5>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-dark small">Your Name or Business Name</label>
                      <input type="text" className="form-control" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="e.g., John Doe or Company Ltd." required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-muted small">Your Email Address</label>
                      <input type="email" className="form-control" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="e.g., name@email.com" />
                    </div>
                  </div>

                  {/* STEP 2: DESTINATION */}
                  <div className="border-bottom pb-2 my-4">
                    <h5 className="text-secondary fw-bold text-uppercase small tracking-wider">2. Where is this Fax going?</h5>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-dark small">Choose a Destination Office</label>
                      <select className="form-select" value={selectedTarget} onChange={handleTargetChange}>
                        {FAX_DESTINATION_GROUPS.map((groupObj, index) => (
                          <optgroup key={index} label={groupObj.group}>
                            {groupObj.options.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      {selectedTarget === 'manual' ? (
                        <>
                          <label className="form-label fw-semibold text-dark small">Recipient Fax Number</label>
                          <input type="tel" className="form-control" value={toNumber} onChange={(e) => setToNumber(e.target.value)} placeholder="e.g., 9055551234" required />
                        </>
                      ) : (
                        <>
                          <label className="form-label fw-semibold text-muted small">Confirmed Destination Number</label>
                          <div className="form-control bg-light border-0 text-primary fw-bold px-3">
                            +{selectedTarget.slice(0, 1)} ({selectedTarget.slice(1, 4)}) {selectedTarget.slice(4, 7)}-{selectedTarget.slice(7)}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label fw-semibold text-muted small">CRA Department / Program Name</label>
                      <input type="text" className="form-control" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., Personal Taxes, Benefits, and T1" />
                    </div>
                  </div>

                  {/* STEP 3: COVER SHEET CONTENT */}
                  <div className="border-bottom pb-2 my-4">
                    <h5 className="text-secondary fw-bold text-uppercase small tracking-wider">3. Cover Page Document Details</h5>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">Subject Line</label>
                    <input type="text" className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Personal Tax / Corporate Tax - John Doe" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">
                      Cover Page Notes & Taxpayer Details
                    </label>
                    <textarea 
                      className="form-control font-monospace" 
                      rows="6" 
                      value={messageText} 
                      onChange={(e) => setMessageText(e.target.value)} 
                      placeholder={
                      `Please provide explicit details about this request using the template below:

                      1. REASON FOR NON-RESIDENT STATUS:
                      (e.g., Working temporarily in Canada, Rental property owner, Emigrated from Canada)

                      2. TAXPAYER IDENTITY PROFILE:
                      • Full Legal Name: 
                      • Social Security Number (SSN / ITIN) or SIN: 
                      • Date of Birth (YYYY-MM-DD): 

                      3. ADDITIONAL REMARKS / INSTRUCTIONS FOR THE AGENT:`
                      }
                    ></textarea>
                    <div className="form-text text-muted x-small mt-1">
                      <strong>CRA compliance note:</strong> Non-resident files without an explicit reason for status or missing identity markers (Name, SSN/SIN, DOB) face immediate classification processing delays.
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark small">Attach Document (Must be a PDF file)</label>
                    <input ref={fileInputRef} id="faxFileInput" type="file" className="form-control" accept=".pdf" onChange={handleFileChange} required />
                    <div className="form-text text-muted small mt-1">If your files are stored in OneDrive, you can browse directly to your OneDrive folder on your computer to select your file.</div>
                  </div>

                  {/* SUBMIT */}
                  <div className="d-flex justify-content-end mt-4">
                    <button type="submit" className="btn btn-primary btn-lg px-4 fs-6 fw-bold shadow-sm" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Sending Fax Now...
                        </>
                      ) : (
                        'Send Fax Securely'
                      )}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-warning border-start border-warning border-4 shadow-sm">
          Access Denied: Please log in using your user account to access the secure document transmission system.
        </div>
      )}
    </TaxPortalLayout>
  );
};

export default FaxPage;