import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest, getApiUrl } from '../authConfig';
import DataPageHeader from '../components/Common/DataPageHeader';
import EmailDraftModal from '../components/Common/EmailDraftModal';

const ESignRequestPage = () => {
  const location = useLocation();
  const state = location.state || {};

  // Controlled form states
  const [customerId] = useState(state.customerId || '');
  const [taxType, setTaxType] = useState(state.taxType || 'Personal');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [onedriveId, setOnedriveId] = useState('');
  const [onedriveDriveId, setOnedriveDriveId] = useState(null);
  const [fileName, setFileName] = useState('');
  const [clientEmail, setClientEmail] = useState(state.clientEmail || '');
  const [clientName, setClientName] = useState(state.clientName || '');
  
  const [loading, setLoading] = useState(false);
  const [emailModalConfig, setEmailModalConfig] = useState(null);

  // MSAL & OneDrive state
  const [account, setAccount] = useState(null);
  const [pastedLink, setPastedLink] = useState('');
  const [isFetchingLink, setIsFetchingLink] = useState(false);

  const msalInstance = useMemo(() => new PublicClientApplication(msalConfig), []);

  useEffect(() => {
    let isMounted = true;
    const initializeMsal = async () => {
      try {
        if (typeof msalInstance.initialize === 'function') {
          await msalInstance.initialize();
        }
        const response = await msalInstance.handleRedirectPromise();
        if (isMounted) {
          if (response && response.account) {
            setAccount(response.account);
          } else {
            const currentAccounts = msalInstance.getAllAccounts();
            if (currentAccounts.length > 0) {
              setAccount(currentAccounts[0]);
            }
          }
        }
      } catch (err) {
        console.error('MSAL Initialization Error:', err);
      }
    };
    initializeMsal();
    return () => { isMounted = false; };
  }, [msalInstance]);

  const handleFetchPastedLink = async () => {
    if (!account) {
      alert("Please sign in first (via the header) to fetch files.");
      return;
    }
    
    let cleanLink = pastedLink.trim();
    if (!cleanLink) {
      alert("Please paste a valid OneDrive or SharePoint link.");
      return;
    }
    
    // Ensure it's a full URL so Microsoft Graph can successfully resolve it
    if (!cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
      alert("Please paste the full URL including https://");
      return;
    }

    setIsFetchingLink(true);
    try {
      // Validate that JavaScript can correctly parse the URL
      try { new URL(cleanLink); } catch (e) { throw new Error("The pasted text does not appear to be a valid URL format."); }

      const tokenResponse = await msalInstance.acquireTokenSilent({ scopes: ['Files.ReadWrite.All'], account });
      // Microsoft Graph Base64 encoding requirement for sharing URLs
      const base64Value = btoa(unescape(encodeURIComponent(cleanLink)))
        .replace(/\//g, '_')
        .replace(/\+/g, '-')
        .replace(/=+$/, '');
      const encodedUrl = `u!${base64Value}`;

      const response = await fetch(`https://graph.microsoft.com/v1.0/shares/${encodedUrl}/driveItem`, {
        headers: { 'Authorization': `Bearer ${tokenResponse.accessToken}` }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.error?.innerError?.code === "badArgument" || errData.error?.code === "invalidRequest") {
          throw new Error("Microsoft Graph could not recognize this as a valid sharing link. Please ensure you copied the entire URL correctly from OneDrive.");
        }
        throw new Error(errData.error?.message || "Could not access the file. Ensure the link is valid and you have permissions.");
      }

      const driveItem = await response.json();
      
      if (driveItem.folder) {
         throw new Error("The provided link points to a folder. Please provide a link to a specific file.");
      }

      setOnedriveId(driveItem.id);
      setOnedriveDriveId(driveItem.parentReference?.driveId || null);
      setFileName(driveItem.name);
      setPastedLink(''); // clear it
    } catch (err) {
      console.error("Fetch link error:", err);
      alert(err.message);
    } finally {
      setIsFetchingLink(false);
    }
  };

  const handleLocalFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!account) {
      alert("Please sign in first (via the header).");
      e.target.value = '';
      return;
    }

    setIsFetchingLink(true);
    setOnedriveId('');
    setOnedriveDriveId(null);
    setFileName('');

    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({ scopes: ['Files.ReadWrite.All'], account });
      
      let matchedFiles = [];
      
      const searchPayload = {
        requests: [{
          entityTypes: ['driveItem'],
          query: { queryString: `filename:"${file.name.replace(/"/g, '')}"` }
        }]
      };

      const globalSearchResponse = await fetch('https://graph.microsoft.com/v1.0/search/query', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${tokenResponse.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchPayload)
      });

      if (globalSearchResponse.ok) {
        const globalData = await globalSearchResponse.json();
        const hits = globalData.value?.[0]?.hitsContainers?.[0]?.hits || [];
        
        matchedFiles = hits
          .map(hit => hit.resource)
          .filter(item => item && item.name === file.name && !item.folder);
      }

      if (matchedFiles.length === 0) {
         alert("Could not find this file in your OneDrive or Shared folders. Ensure it's fully synced.");
         return;
      }

      const selectedItem = matchedFiles[0];

      setOnedriveId(selectedItem.id);
      setOnedriveDriveId(selectedItem.parentReference?.driveId || null);
      setFileName(selectedItem.name);

    } catch (err) {
      console.error(err);
      alert('Could not match local file to OneDrive. ' + err.message);
    } finally {
      setIsFetchingLink(false);
      e.target.value = ''; 
    }
  };

  const handleLogin = async () => {
    try {
      await msalInstance.loginRedirect(loginRequest);
    } catch (err) { alert(err.message || 'Microsoft sign-in failed.'); }
  };

  const handleLogout = async () => {
    try {
      await msalInstance.logoutRedirect({ account });
    } catch (err) { alert(err.message || 'Logout failed.'); }
  };

  const handleRegisterDocument = async (e) => {
    e.preventDefault();
    if (!account) {
      alert("Please sign in first (via the header) to generate a link.");
      return;
    }

    if (!onedriveId) {
      alert("Please select a document from OneDrive first.");
      return;
    }

    setLoading(true);

    try {
      // 1. Get Graph API Token for creating the link
      let graphToken;
      try {
        graphToken = await msalInstance.acquireTokenSilent({ scopes: ['Files.ReadWrite.All'], account });
      } catch (e) {
        throw new Error("Unable to acquire OneDrive permissions. Please ensure you are signed in.");
      }

      // 2. Generate Anonymous View Link via MS Graph
      const createLinkUrl = onedriveDriveId 
        ? `https://graph.microsoft.com/v1.0/drives/${onedriveDriveId}/items/${onedriveId}/createLink`
        : `https://graph.microsoft.com/v1.0/me/drive/items/${onedriveId}/createLink`;

      const linkResponse = await fetch(createLinkUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${graphToken.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'blocksDownload', scope: 'anonymous' })
      });

      if (!linkResponse.ok) {
        const errData = await linkResponse.json();
        throw new Error(errData.error?.message || "Failed to create public sharing link. Ensure your organization allows anonymous links.");
      }

      const linkData = await linkResponse.json();
      const shareUrl = new URL(linkData.link.webUrl);
      shareUrl.searchParams.set('action', 'embedview');
      shareUrl.searchParams.set('wdDownloadButton', 'False');
      shareUrl.searchParams.set('wdPrintButton', 'False');

      const payload = {
        customer_id: customerId,
        tax_type: taxType,
        tax_year: parseInt(taxYear),
        onedrive_item_id: onedriveId,
        file_name: fileName,
        shared_link: shareUrl.toString()
      };

      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      
      const response = await fetch(getApiUrl('/api/staff/initialize-document'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenResponse.accessToken}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (response.ok) {
        // Instantly launch the email modal with the newly generated link
        setEmailModalConfig({
          action: 'requestEsign',
          taxType: taxType,
          customer: { email: clientEmail },
          customData: {
            generatedLink: result.link,
            taxYear,
            clientName,
            clientEmail
          }
        });
      } else {
        alert(`Error: ${result.error || result.message}`);
      }
    } catch (err) {
      console.error("Failed handling server handshake", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <DataPageHeader
        title="eSign Request & Draft Review"
        description="Generate secure access links for client document review and e-signature."
        account={account}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <div className="container mt-5">
        <div className="card shadow-lg border-0 rounded-4 mx-auto" style={{ maxWidth: '850px' }}>
          <div className="card-header bg-white pt-4 pb-3 px-4 px-md-5 border-bottom-0 rounded-top-4">
            <h2 className="h4 mb-1 fw-bold text-primary d-flex align-items-center gap-2">
              <span className="fs-3 lh-1">✍️</span>
              {clientName ? `Draft Review: ${clientName}` : 'Secure eSign Request'}
            </h2>
            <p className="text-muted mb-0 small ms-5">Configure and send a secure access link for client review and signature.</p>
          </div>
          
          <div className="card-body p-4 p-md-5 pt-0">
            <form onSubmit={handleRegisterDocument}>
              {/* Client Details Section */}
              <div className="d-flex align-items-center mb-4 pb-2 border-bottom mt-3">
                <span className="bg-primary-subtle text-primary fw-bold rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '32px', height: '32px'}}>1</span>
                <h5 className="mb-0 text-dark fw-bold">Client Information</h5>
              </div>
              
              <div className="row g-4 mb-5">
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-secondary small text-uppercase tracking-wider">Client Name</label>
                  <input type="text" className="form-control form-control-lg bg-light" value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="John Doe" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-secondary small text-uppercase tracking-wider">Client Email</label>
                  <input type="email" className="form-control form-control-lg bg-light" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required placeholder="john@example.com" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-secondary small text-uppercase tracking-wider">Tax Type</label>
                  <select className="form-select form-select-lg bg-light" value={taxType} onChange={(e) => setTaxType(e.target.value)}>
                    <option value="Personal">Personal Tax (Paid)</option>
                    <option value="CVITP">CVITP Tax (Volunteer)</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-secondary small text-uppercase tracking-wider">Tax Year</label>
                  <input type="number" className="form-control form-control-lg bg-light" value={taxYear} onChange={(e) => setTaxYear(e.target.value)} required />
                </div>
              </div>

              {/* Document Selection Section */}
              <div className="d-flex align-items-center mb-4 pb-2 border-bottom">
                <span className="bg-primary-subtle text-primary fw-bold rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '32px', height: '32px'}}>2</span>
                <h5 className="mb-0 text-dark fw-bold">Document Source</h5>
              </div>

              <div className="p-4 bg-light rounded-4 border d-flex flex-column gap-3 mb-4">
                  <label className={`btn btn-primary btn-lg fw-medium d-flex align-items-center justify-content-center gap-2 ${isFetchingLink ? 'disabled' : ''}`}>
                    {isFetchingLink ? <><span className="spinner-border spinner-border-sm"></span> Syncing with Graph...</> : <>📂 Browse Local OneDrive Folder</>}
                    <input 
                      type="file" 
                      className="d-none" 
                      onChange={handleLocalFileSelect}
                      disabled={isFetchingLink}
                    />
                  </label>
                  
                  <div className="d-flex align-items-center gap-3 text-muted my-1">
                    <hr className="flex-grow-1 m-0 opacity-25" />
                    <span className="small text-uppercase fw-bold text-secondary" style={{letterSpacing: '1px'}}>OR</span>
                    <hr className="flex-grow-1 m-0 opacity-25" />
                  </div>

                  <div className="input-group shadow-sm rounded-3 overflow-hidden">
                    <span className="input-group-text bg-white border-end-0 text-muted ps-3">🔗</span>
                    <input 
                      type="text" 
                      className="form-control border-start-0 ps-0 form-control-lg" 
                      placeholder="Paste SharePoint / OneDrive link..." 
                      value={pastedLink} 
                      onChange={(e) => setPastedLink(e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFetchPastedLink();
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-dark px-4 fw-medium" 
                      onClick={handleFetchPastedLink}
                      disabled={!pastedLink.trim() || isFetchingLink}
                    >
                      {isFetchingLink ? 'Fetching...' : 'Fetch Link'}
                    </button>
                  </div>
                  <div className="text-center mt-1 text-muted small">
                    ℹ️ Ensure the local file is fully synced to the cloud before selecting.
                  </div>
              </div>

              {/* Selected File Details */}
              <div className="mb-5">
                   {fileName ? (
                      <div className="p-4 bg-primary-subtle border border-primary-subtle rounded-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow-sm">
                         <div className="d-flex align-items-center gap-3">
                            <div className="bg-white p-3 rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                              <span className="fs-3 lh-1">📄</span>
                            </div>
                            <div>
                               <p className="mb-1 fw-bold text-dark fs-5">{fileName}</p>
                               <span className="badge bg-white text-secondary border font-monospace text-truncate d-inline-block shadow-sm" style={{ maxWidth: '300px' }}>
                                  ID: {onedriveId}
                               </span>
                            </div>
                         </div>
                         <button type="button" className="btn btn-outline-danger bg-white fw-medium px-3 shadow-sm" onClick={() => { setFileName(''); setOnedriveId(''); setOnedriveDriveId(null); }}>
                            ✕ Remove File
                         </button>
                      </div>
                   ) : (
                      <div className="p-5 bg-white border border-dashed rounded-4 text-center text-muted" style={{borderWidth: '2px'}}>
                        <span className="fs-1 d-block mb-2 opacity-50">📥</span>
                        <p className="mb-0 fw-medium fs-5 text-secondary">No Document Attached</p>
                        <small>Please select a local synced file or paste a secure link above.</small>
                      </div>
                   )}

                {fileName && (
                   <div className="mt-4 p-4 bg-light border rounded-4">
                     <label className="form-label fw-bold text-dark mb-2">Display Title <span className="text-muted fw-normal ms-1">(Visible to client in email)</span></label>
                     <input type="text" className="form-control form-control-lg shadow-sm" value={fileName} onChange={(e) => setFileName(e.target.value)} />
                   </div>
                )}
              </div>

              <div className="d-grid mt-5 pt-4 border-top">
                <button type="submit" disabled={loading || !onedriveId} className="btn btn-success btn-lg py-3 fs-5 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2 rounded-3">
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Initializing Secure Session...</>
                  ) : <>✉️ Generate & Email Secure Draft</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {emailModalConfig && (
        <EmailDraftModal 
          customerData={emailModalConfig.customer}
          action={emailModalConfig.action}
          taxType={emailModalConfig.taxType}
          customData={emailModalConfig.customData}
          msalInstance={msalInstance}
          account={account}
          onClose={() => setEmailModalConfig(null)}
        />
      )}
    </div>
  );
};

export default ESignRequestPage;