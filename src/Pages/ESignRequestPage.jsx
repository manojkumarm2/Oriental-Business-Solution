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

      <div className="container mt-4">
        <div className="card shadow-sm mx-auto" style={{ maxWidth: '900px' }}>
          <div className="card-header bg-white py-3 border-bottom d-flex align-items-center">
            <h2 className="h5 mb-0 fw-bold text-primary">
              {clientName ? `eSign Request: ${clientName}` : 'eSign Request & Draft Review Form'}
            </h2>
          </div>
          
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleRegisterDocument}>
              {/* Client Details Section */}
              <h5 className="mb-3 border-bottom pb-2 text-secondary fs-6 text-uppercase fw-semibold">Client Details</h5>
              <div className="row g-4 mb-5">
                <div className="col-md-6">
                  <label className="form-label fw-medium text-dark">Client Name</label>
                  <input type="text" className="form-control" value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="John Doe" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium text-dark">Client Email</label>
                  <input type="email" className="form-control" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required placeholder="john@example.com" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium text-dark">Tax Type</label>
                  <select className="form-select" value={taxType} onChange={(e) => setTaxType(e.target.value)}>
                    <option value="Personal">Personal Tax (Paid)</option>
                    <option value="CVITP">CVITP Tax (Volunteer)</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium text-dark">Tax Year</label>
                  <input type="number" className="form-control" value={taxYear} onChange={(e) => setTaxYear(e.target.value)} required />
                </div>
              </div>

              {/* Document Selection Section */}
              <div className="mb-3 border-bottom pb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 text-secondary fs-6 text-uppercase fw-semibold">Document Selection</h5>
                </div>
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Or paste a OneDrive / SharePoint file link here..." 
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
                    className="btn btn-secondary text-nowrap" 
                    onClick={handleFetchPastedLink}
                    disabled={!pastedLink.trim() || isFetchingLink}
                  >
                    {isFetchingLink ? 'Fetching...' : 'Fetch File'}
                  </button>
                </div>
              </div>

              {/* Selected File Details */}
              <div className="row g-3 mb-5">
                <div className="col-md-12">
                   {fileName ? (
                      <div className="p-3 bg-light border rounded d-flex align-items-center justify-content-between">
                         <div className="d-flex align-items-center gap-3">
                            <span className="fs-3">📄</span>
                            <div>
                               <p className="mb-0 fw-bold text-dark">{fileName}</p>
                               <small className="text-muted text-truncate d-block" style={{ maxWidth: '400px' }}>
                                  ID: {onedriveId}
                               </small>
                            </div>
                         </div>
                         <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => { setFileName(''); setOnedriveId(''); setOnedriveDriveId(null); }}>
                            Clear Selection
                         </button>
                      </div>
                   ) : (
                      <div className="p-4 bg-light border border-dashed rounded text-center text-muted">
                        No document selected. Please paste a link to choose a file.
                      </div>
                   )}
                </div>
                {/* Optional Custom File Name input could go here if they still wanted to rename it, but it's cleaner without it unless required.
                    The requirement was to remove customerID from the form, which wasn't in the form. But removing OneDrive ID input makes it better. */}
                {fileName && (
                   <div className="col-md-12 mt-3">
                     <label className="form-label fw-medium text-dark">Confirm/Edit File Name</label>
                     <input type="text" className="form-control" value={fileName} onChange={(e) => setFileName(e.target.value)} />
                   </div>
                )}
              </div>

              <div className="d-grid mt-4">
                <button type="submit" disabled={loading || !onedriveId} className="btn btn-primary btn-lg fw-bold shadow-sm">
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Generating & Preparing Draft...</>
                  ) : 'Generate & Email Draft'}
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