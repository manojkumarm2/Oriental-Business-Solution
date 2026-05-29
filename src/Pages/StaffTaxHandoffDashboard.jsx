import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest, getApiUrl } from '../authConfig';
import DataPageHeader from '../components/Common/DataPageHeader';

const StaffTaxHandoffDashboard = () => {
  const location = useLocation();
  const state = location.state || {};

  // Controlled form states
  const [customerId, setCustomerId] = useState(state.customerId || '');
  const [taxType, setTaxType] = useState(state.taxType || 'Personal');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [onedriveId, setOnedriveId] = useState('');
  const [fileName, setFileName] = useState('');
  const [clientEmail, setClientEmail] = useState(state.clientEmail || '');
  const [clientName, setClientName] = useState(state.clientName || '');
  
  // Tracking link returned from Python API
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);

  // MSAL & OneDrive state
  const [account, setAccount] = useState(null);
  const [driveItems, setDriveItems] = useState([]);
  const [currentPath, setCurrentPath] = useState([{ id: 'root', name: 'Root' }]);
  const [showPicker, setShowPicker] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [requiresInteraction, setRequiresInteraction] = useState(false);

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

  const fetchDriveItems = async (accessToken, folderId = 'root') => {
    setLoadingFiles(true);
    try {
      const url = folderId === 'root' 
        ? 'https://graph.microsoft.com/v1.0/me/drive/root/children?$top=200'
        : `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children?$top=200`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error('Failed to fetch from Graph API');
      const data = await response.json();
      
      const items = data.value || [];
      items.sort((a, b) => {
        if (a.folder && !b.folder) return -1;
        if (!a.folder && b.folder) return 1;
        return a.name.localeCompare(b.name);
      });
      setDriveItems(items);
    } catch (err) { 
      console.error(err); 
      alert("Could not load OneDrive files. You may need to grant permissions."); 
    } finally { 
      setLoadingFiles(false); 
    }
  };

  const handleFolderClick = async (folder) => {
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({ scopes: ['Files.ReadWrite.All'], account });
      setCurrentPath(prev => [...prev, { id: folder.id, name: folder.name }]);
      fetchDriveItems(tokenResponse.accessToken, folder.id);
    } catch (err) {
      console.warn("Silent token failed", err);
      setRequiresInteraction(true);
    }
  };

  const handleBreadcrumbClick = async (idx) => {
    const target = currentPath[idx];
    const newPath = currentPath.slice(0, idx + 1);
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({ scopes: ['Files.ReadWrite.All'], account });
      setCurrentPath(newPath);
      fetchDriveItems(tokenResponse.accessToken, target.id);
    } catch (err) {
      console.warn("Silent token failed", err);
      setRequiresInteraction(true);
    }
  };

  const handleBrowseOneDrive = async () => {
    if (!account) {
      alert("Please sign in first (via the header) to browse OneDrive.");
      return;
    }
    setShowPicker(true);
    setLoadingFiles(true);
    setRequiresInteraction(false);
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({ scopes: ['Files.ReadWrite.All'], account });
      setCurrentPath([{ id: 'root', name: 'Root' }]);
      fetchDriveItems(tokenResponse.accessToken, 'root');
    } catch (silentError) {
      console.warn("Silent token failed, likely due to Safari ITP. Prompting user for interaction.", silentError);
      setRequiresInteraction(true);
      setLoadingFiles(false);
    }
  };

  const handleExplicitAuth = async () => {
    try {
      const tokenResponse = await msalInstance.acquireTokenPopup({ scopes: ['Files.ReadWrite.All'] });
      setAccount(tokenResponse.account);
      setRequiresInteraction(false);
      const targetId = currentPath[currentPath.length - 1]?.id || 'root';
      fetchDriveItems(tokenResponse.accessToken, targetId);
    } catch (err) {
      console.error("Popup auth failed", err);
      alert("Authorization failed or popup blocked. Please allow popups for this site.");
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

    setLoading(true);

    try {
      // 1. Get Graph API Token for creating the link
      let graphToken;
      try {
        graphToken = await msalInstance.acquireTokenSilent({ scopes: ['Files.ReadWrite.All'], account });
      } catch (e) {
        throw new Error("Unable to acquire OneDrive permissions. Please use 'Browse OneDrive' to authorize first.");
      }

      // 2. Generate Anonymous View Link via MS Graph
      const linkResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${onedriveId}/createLink`, {
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
        setGeneratedLink(result.link);
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

  // Generates the native deep-link structure for Outlook execution
  const buildOutlookMailto = () => {
    const subject = encodeURIComponent(`Action Required: Review & Sign Your ${taxYear} Tax Return Draft`);
    const emailBody = encodeURIComponent(
      `Hello ${clientName},\n\n` +
      `Our team has completed the draft configuration for your ${taxYear} tax return.\n\n` +
      `Please use our secure client portal link below to review the draft layout, supply your authorization signature, and complete processing fees:\n` +
      `${generatedLink}\n\n` +
      `Best regards,\nTax Preparation Team`
    );

    return `mailto:${clientEmail}?subject=${subject}&body=${emailBody}`;
  };

  return (
    <div className="container py-5 position-relative" style={{ minHeight: '100vh' }}>
      <DataPageHeader
        title="Staff Document Handoff"
        description="Generate secure access links for client document review and e-signature."
        account={account}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <div className="card shadow-sm mx-auto mb-4" style={{ maxWidth: '800px', marginTop: '30px' }}>
        <div className="card-header bg-white pt-4 pb-2 border-bottom-0">
          <h2 className="h4 mb-0">{clientName ? `${clientName}'s Tax Return Draft Document is Ready for Review` : 'Staff Document Handoff (Phase 1)'}</h2>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleRegisterDocument}>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold">Client Name</label>
                <input type="text" className="form-control" value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="John Doe" />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Client Email</label>
                <input type="email" className="form-control" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required placeholder="john@example.com" />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Tax Type</label>
                <select className="form-select" value={taxType} onChange={(e) => setTaxType(e.target.value)}>
                  <option value="Personal">Personal Tax (Paid)</option>
                  <option value="CVITP">CVITP Tax (Volunteer)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Tax Year</label>
                <input type="number" className="form-control" value={taxYear} onChange={(e) => setTaxYear(e.target.value)} required />
              </div>
            </div>

            <hr className="my-4" />
            
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="h5 mb-0 fw-bold text-secondary">OneDrive Document Selection</h4>
              <button type="button" className="btn btn-outline-success btn-sm d-flex align-items-center gap-1" onClick={handleBrowseOneDrive}>
                ☁️ Browse OneDrive
              </button>
            </div>

            {showPicker && (
              <div className="card mb-4 border-success">
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center py-2">
                  <h5 className="mb-0 fs-6">Select a File from OneDrive</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowPicker(false)} aria-label="Close"></button>
                </div>
                <div className="card-body bg-light">
                  {!requiresInteraction && (
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb mb-3 border-bottom pb-2">
                        {currentPath.map((crumb, idx) => (
                          <li key={crumb.id} className={`breadcrumb-item ${idx === currentPath.length - 1 ? 'active' : ''}`}>
                            {idx < currentPath.length - 1 ? (
                              <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={() => handleBreadcrumbClick(idx)}>
                                {crumb.name}
                              </button>
                            ) : (
                              crumb.name
                            )}
                          </li>
                        ))}
                      </ol>
                    </nav>
                  )}

                  {loadingFiles ? (
                    <div className="text-center py-3">
                      <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : requiresInteraction ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-3">Your browser requires explicit permission to connect to Microsoft OneDrive.</p>
                      <button type="button" className="btn btn-primary" onClick={handleExplicitAuth}>
                        🔐 Authorize OneDrive
                      </button>
                    </div>
                  ) : (
                    <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {driveItems.length === 0 ? (
                        <div className="text-center text-muted py-3">Folder is empty.</div>
                      ) : (
                        driveItems.map(item => {
                          const isFolder = !!item.folder;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                              onClick={() => {
                                if (isFolder) {
                                  handleFolderClick(item);
                                } else {
                                  setOnedriveId(item.id);
                                  setFileName(item.name);
                                  setShowPicker(false);
                                }
                              }}
                            >
                              <div className="d-flex align-items-center gap-2">
                                <span className="fs-5">{isFolder ? '📁' : '📄'}</span>
                                <span className="fw-medium">{item.name}</span>
                              </div>
                              <small className="text-muted">
                                {isFolder ? `${item.folder.childCount} items` : new Date(item.lastModifiedDateTime).toLocaleDateString()}
                              </small>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="row g-3 mb-4">
              <div className="col-md-12">
                <label className="form-label fw-bold">OneDrive Item ID</label>
                <input type="text" className="form-control" value={onedriveId} onChange={(e) => setOnedriveId(e.target.value)} required placeholder="Pasted from OneDrive File Details..." />
              </div>
              <div className="col-md-12">
                <label className="form-label fw-bold">File Name (Optional)</label>
                <input type="text" className="form-control" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder={clientName ? `${clientName} tax return ${taxYear}.pdf` : "T1_Summary_Final.pdf"} />
              </div>
            </div>

            <div className="d-grid">
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Registering...</>
                ) : 'Generate Portal Access Link'}
              </button>
            </div>
          </form>

          {/* Action Zone: Triggers only when link generation completes successfully */}
          {generatedLink && (
            <div className="alert alert-success mt-4 d-flex flex-column gap-3">
              <div>
                <h5 className="alert-heading fw-bold mb-2">Link Ready!</h5>
                <code className="bg-white p-2 d-block rounded border text-break">{generatedLink}</code>
              </div>
              <a href={buildOutlookMailto()} className="btn btn-success fw-bold d-flex align-items-center justify-content-center gap-2">
                Launch Outlook & Compose Message
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffTaxHandoffDashboard;