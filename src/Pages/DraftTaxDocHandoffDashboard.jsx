import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest, getApiUrl } from '../authConfig';
import DataPageHeader from '../components/Common/DataPageHeader';

const DraftTaxDocHandoffDashboard = () => {
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
    <div className="bg-light min-vh-100 pb-5">
      <DataPageHeader
        title="Draft Doc handoff"
        description="Generate secure access links for client document review and e-signature."
        account={account}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <div className="container mt-4">
        <div className="card shadow-sm mx-auto" style={{ maxWidth: '900px' }}>
          <div className="card-header bg-white py-3 border-bottom d-flex align-items-center">
            <h2 className="h5 mb-0 fw-bold text-primary">
              {clientName ? `Tax Return Handoff: ${clientName}` : 'Draft Doc Send-Off Form'}
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
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 className="mb-0 text-secondary fs-6 text-uppercase fw-semibold">Document Selection</h5>
                <button type="button" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" onClick={handleBrowseOneDrive}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.923 1.277-3.642 3.14-4.148.151-1.121.75-2.127 1.266-2.828zM10.5 8.5a.5.5 0 0 0-1 0v1.793L8.354 9.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L10.5 10.293V8.5z"/>
                  </svg>
                  Browse OneDrive
                </button>
              </div>

              {showPicker && (
                <div className="card mb-4 border shadow-sm">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                    <h6 className="mb-0 fw-bold text-dark">Select a File</h6>
                    <button type="button" className="btn-close" onClick={() => setShowPicker(false)} aria-label="Close"></button>
                  </div>
                  <div className="card-body p-0">
                    {!requiresInteraction && (
                      <div className="px-3 py-2 border-bottom bg-white">
                        <nav aria-label="breadcrumb">
                          <ol className="breadcrumb mb-0">
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
                      </div>
                    )}

                    {loadingFiles ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : requiresInteraction ? (
                      <div className="text-center py-5 px-3">
                        <p className="text-muted mb-3">Your browser requires explicit permission to connect to Microsoft OneDrive.</p>
                        <button type="button" className="btn btn-primary" onClick={handleExplicitAuth}>
                          Authorize OneDrive
                        </button>
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light sticky-top" style={{ zIndex: 1 }}>
                            <tr>
                              <th scope="col" className="border-0 ps-3">Name</th>
                              <th scope="col" className="border-0 text-end">Modified</th>
                              <th scope="col" className="border-0 text-end pe-3">Size/Items</th>
                            </tr>
                          </thead>
                          <tbody>
                            {driveItems.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="text-center text-muted py-4">This folder is empty.</td>
                              </tr>
                            ) : (
                              driveItems.map(item => {
                                const isFolder = !!item.folder;
                                return (
                                  <tr 
                                    key={item.id} 
                                    onClick={() => {
                                      if (isFolder) {
                                        handleFolderClick(item);
                                      } else {
                                        setOnedriveId(item.id);
                                        setFileName(item.name);
                                        setShowPicker(false);
                                      }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <td className="ps-3 border-bottom-0">
                                      <div className="d-flex align-items-center gap-2">
                                        <span className="fs-5">{isFolder ? '📁' : '📄'}</span>
                                        <span className={`fw-medium ${isFolder ? 'text-primary' : 'text-dark'}`}>
                                          {item.name}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="text-end text-muted small border-bottom-0">
                                      {new Date(item.lastModifiedDateTime).toLocaleDateString()}
                                    </td>
                                    <td className="text-end text-muted small pe-3 border-bottom-0">
                                      {isFolder ? `${item.folder.childCount} items` : `${Math.round(item.size / 1024)} KB`}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                         <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => { setFileName(''); setOnedriveId(''); }}>
                            Clear Selection
                         </button>
                      </div>
                   ) : (
                      <div className="p-4 bg-light border border-dashed rounded text-center text-muted">
                        No document selected. Click "Browse OneDrive" to choose a file.
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
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Registering Document...</>
                  ) : 'Generate Portal Access Link'}
                </button>
              </div>
            </form>

            {/* Action Zone: Triggers only when link generation completes successfully */}
            {generatedLink && (
              <div className="alert alert-success mt-5 d-flex flex-column gap-3 shadow-sm border-0">
                <div>
                  <h5 className="alert-heading fw-bold mb-2 d-flex align-items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-success" viewBox="0 0 16 16">
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    </svg>
                    Link Ready!
                  </h5>
                  <code className="bg-white p-3 d-block rounded border text-break fs-6 text-dark">{generatedLink}</code>
                </div>
                <a href={buildOutlookMailto()} className="btn btn-success fw-bold d-flex align-items-center justify-content-center gap-2 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
                  </svg>
                  Launch Outlook & Compose Message
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftTaxDocHandoffDashboard;