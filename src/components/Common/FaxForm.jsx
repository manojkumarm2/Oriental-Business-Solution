import React, { useState, useRef, useEffect } from 'react';

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

const FaxForm = ({ onSubmit, initialSenderEmail = '', initialSenderName = '', loading = false, errorCallback }) => {
  const fileInputRef = useRef(null);

  const [senderName, setSenderName] = useState(initialSenderName);
  const [senderEmail, setSenderEmail] = useState(initialSenderEmail);
  const [department, setDepartment] = useState('');
  
  const [selectedTarget, setSelectedTarget] = useState('manual');
  const [toNumber, setToNumber] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (initialSenderEmail) setSenderEmail(initialSenderEmail);
  }, [initialSenderEmail]);

  useEffect(() => {
    if (initialSenderName) setSenderName(initialSenderName);
  }, [initialSenderName]);

  const handleTargetChange = (e) => {
    const val = e.target.value;
    setSelectedTarget(val);
    setToNumber(val !== 'manual' ? val : '');

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
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const pdfFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
      setSelectedFiles((prev) => [...prev, ...pdfFiles]);
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setToNumber('');
    setSelectedTarget('manual');
    setSelectedFiles([]);
    setDepartment('');
    setSubject('');
    setMessageText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalNumber = selectedTarget === 'manual' ? toNumber : selectedTarget;

    if (!finalNumber || selectedFiles.length === 0 || !senderName) {
      if (errorCallback) {
        errorCallback("Please fill out your name, the destination fax number, and attach a file before sending.");
      }
      return;
    }

    const formData = new FormData();
    formData.append('to_number', finalNumber);
    selectedFiles.forEach((file) => formData.append('file', file));
    formData.append('sender_name', senderName);
    formData.append('sender_email', senderEmail);
    formData.append('department', department);
    formData.append('subject', subject);
    formData.append('message', messageText);

    onSubmit(formData, resetForm);
  };

  return (
    <form onSubmit={handleSubmit}>
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
        <label className="form-label fw-semibold text-dark small">Attach Documents (Must be PDF files)</label>
        <div 
          className={`p-4 text-center border rounded ${isDragging ? 'bg-primary-subtle border-primary' : 'bg-light'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ borderStyle: 'dashed', borderWidth: '2px', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} id="faxFileInput" type="file" className="d-none" accept=".pdf" multiple onChange={handleFileChange} />
          <div className="fs-1 mb-2">📄</div>
          <p className="mb-1 fw-bold text-dark">Drag and drop PDF files here</p>
          <p className="text-muted small mb-0">or click to browse from your computer</p>
        </div>

        {selectedFiles.length > 0 && (
          <ul className="list-group mt-3 shadow-sm">
            {selectedFiles.map((file, i) => (
              <li key={i} className="list-group-item d-flex justify-content-between align-items-center bg-white border-light">
                <span className="small text-truncate fw-medium" style={{ maxWidth: '85%' }}>{file.name}</span>
                <button type="button" className="btn btn-sm btn-outline-danger py-0 px-2 fw-bold" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>&times;</button>
              </li>
            ))}
          </ul>
        )}
        <div className="form-text text-muted small mt-2">If your files are stored in OneDrive, you can browse directly to your OneDrive folder on your computer to select your file.</div>
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
  );
};

export default FaxForm;