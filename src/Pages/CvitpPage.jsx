import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import DataPageHeader from '../components/Common/DataPageHeader';
import ESignDetailsModal from '../components/Common/ESignDetailsModal';
import { msalConfig, loginRequest, getApiUrl } from '../authConfig';
import { calculateAssigneeStats } from '../utils/StatsHelper';
import EmailDraftModal from '../components/Common/EmailDraftModal';
import CvitpCommunicationsHub from '../components/Cvitp/CvitpCommunicationsHub';

const CvitpPage = () => {
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // --- CVITP TAX CLINIC DATABASE STATE ---
  const [taxEntries, setTaxEntries] = useState([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [eSignDetails, setESignDetails] = useState(null);
  const [emailModalConfig, setEmailModalConfig] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [sortKey, setSortKey] = useState('receivedDate');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchEsignDetails = async (entry) => {
    try {
        const tokenResponse = await msalInstance.acquireTokenSilent({ ...loginRequest, account});

        const response = await fetch(getApiUrl(`/api/staff/esign-details/CVITP/${entry.id || entry._id}`), {
            headers: { 'Authorization': `Bearer ${tokenResponse.accessToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            setESignDetails(data);
        } else {
            const errorData = await response.json();
            alert(`Could not fetch e-sign details: ${errorData.error || 'Not found'}`);
        }
    } catch (error) {
        console.error('Error fetching e-sign details:', error);
        alert('An error occurred while fetching e-sign details.');
    }
  };
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  
  const [newCustomer, setNewCustomer] = useState({
    name: '', mobile: '', email: '', status: 'Pending', assignedTo: '', coin: '', receivedDate: '', filledDate: '', yearsOfFiling: []
  });

  const msalInstance = useMemo(() => new PublicClientApplication(msalConfig), []);

  // Parse valid user emails from env for dropdown selections safely
  const agentEmails = useMemo(() => {
    const rawEnv = process.env.REACT_APP_USER_EMAILS || '';
    return rawEnv.split(',').map(email => email.trim()).filter(Boolean);
  }, []);

  // --- PERSISTENT DB DIALPAD & HISTORY TERMINAL STATE ---
  const [dialNumber, setDialNumber] = useState("+1");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- DYNAMIC YEARS OF FILING OPTIONS (LAST 10 YEARS) ---
  const last10Years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());
  }, []);

  // --- CVITP CORE MANAGEMENT PIPELINES ---
  const fetchCvitpEntries = async (currentAccount) => {
    const activeAccount = currentAccount || account;
    if (!activeAccount) return;
    setIsLoadingEntries(true);
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({ ...loginRequest, account: activeAccount });
      
      const response = await fetch(getApiUrl('/api/cvitp'), {
        headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTaxEntries(data);
      }

      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error collecting CVITP datasets:", err);
    } finally {
      setIsLoadingEntries(false);
    }
  };


  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingEntryId(null);
    setNewCustomer({ name: '', mobile: '', email: '', status: 'Pending', assignedTo: '', coin: '', receivedDate: '', filledDate: '', yearsOfFiling: [] });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (entry) => {
    setIsEditMode(true);
    setEditingEntryId(entry.id);
    setNewCustomer({
      name: entry.name || '',
      mobile: entry.mobile || '',
      email: entry.email || '',
      status: entry.status || 'Pending',
      assignedTo: entry.assignedTo || '',
      coin: entry.coin || '',
      receivedDate: entry.receivedDate || '',
      filledDate: entry.filledDate || '',
      yearsOfFiling: entry.yearsOfFiling ? entry.yearsOfFiling.split(',').map(s => s.trim()) : []
    });
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
      const endpoint = isEditMode ? `/api/cvitp/${editingEntryId}` : '/api/cvitp';
      const method = isEditMode ? 'PUT' : 'POST';

      const payload = { ...newCustomer, yearsOfFiling: newCustomer.yearsOfFiling.join(', ') };

      const response = await fetch(getApiUrl(endpoint), {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenResponse.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setMessage(isEditMode ? "CVITP Tax Record updated successfully." : "CVITP Tax Record generated successfully.");
        setShowAddModal(false);
        setNewCustomer({ name: '', mobile: '', email: '', status: 'Pending', assignedTo: '', coin: '', receivedDate: '', filledDate: '', yearsOfFiling: [] });
        fetchCvitpEntries();
      } else {
        const data = await response.json();
        setError(data.message || "Operation failed execution.");
      }
    } catch (err) {
      setError("Network error processing customer records.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEntries = useMemo(() => {
    if (!searchText) return taxEntries;
    const lowerSearch = searchText.toLowerCase();
    return taxEntries.filter(entry => {
      const matchStr = `${entry.name || ''} ${entry.mobile || ''} ${entry.email || ''} ${entry.assignedTo || ''} ${entry.status || ''}`.toLowerCase();
      return matchStr.includes(lowerSearch);
    });
  }, [taxEntries, searchText]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      let aVal = a[sortKey] || '';
      let bVal = b[sortKey] || '';
      
      if (sortKey === 'receivedDate' || sortKey === 'filledDate') {
        const dateA = new Date(aVal);
        const dateB = new Date(bVal);
        if (!isNaN(dateA) && !isNaN(dateB)) return sortAsc ? dateA - dateB : dateB - dateA;
      }
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredEntries, sortKey, sortAsc]);

  // --- DYNAMIC ASSIGNEE WORKLOAD STATS ---
  const assigneeStats = useMemo(() => {
    return calculateAssigneeStats(taxEntries);
  }, [taxEntries]);


  const exportToCSV = () => {
    if (taxEntries.length === 0) return;
    const headers = ["ID", "Name", "Mobile", "Email", "Status", "Assigned To", "Coin Reference", "Received Date", "Filed Date", "Years of Filing", "Created At"];
    const rows = taxEntries.map(entry => [
      entry.id, entry.name, entry.mobile, entry.email || '', entry.status, entry.assignedTo, entry.coin, entry.receivedDate, entry.filledDate, entry.yearsOfFiling || '', entry.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CVITP_Clinic_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- MSAL & LIFECYCLE ---
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
            fetchCvitpEntries(response.account);
          } else {
            const currentAccounts = msalInstance.getAllAccounts();
            if (currentAccounts.length > 0) {
              setAccount(currentAccounts[0]);
              fetchCvitpEntries(currentAccounts[0]);
            }
          }
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('MSAL Initialization Error:', err);
        if (isMounted) setError('Failed to initialize authentication.');
      }
    };
    initializeMsal();
    return () => { isMounted = false; };
  }, [msalInstance]);

  const handleLogin = async () => {
    try { await msalInstance.loginRedirect(loginRequest); } catch (e) { setError(e.message); }
  };

  const handleLogout = async () => {
    try { await msalInstance.logoutRedirect({ account }); } catch (e) { setError(e.message); }
  };

  return (
    <div className="container-fluid py-4" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <DataPageHeader
          title="CVITP Clinic Desk"
          description="Manage community tax clinic records and client queues seamlessly."
          account={account}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />

        {(error || message) && (
          <div className="mt-3">
            {error && <div className="alert alert-danger alert-dismissible fade show">{error}<button type="button" className="btn-close" onClick={() => setError('')}></button></div>}
            {message && <div className="alert alert-success alert-dismissible fade show">{message}<button type="button" className="btn-close" onClick={() => setMessage('')}></button></div>}
          </div>
        )}

        {account ? (
          <>
            {/* --- SUMMARY CARDS --- */}
            <div className="row g-3 mb-4 mt-2">
              <div className="col-md-4">
                <div className="card data-summary-card shadow-sm h-100 p-3 border-0">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <small className="text-muted fw-bold">Non-Completed</small>
                      <h4 className="mb-0 fw-bold">{taxEntries.filter(item => item.status !== 'Completed').length}</h4>
                    </div>
                    <span className="badge bg-warning-subtle text-warning border border-warning">Open</span>
                  </div>
                  <p className="mb-0 text-muted small">Records actively being processed.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card data-summary-card shadow-sm h-100 p-3 border-0">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <small className="text-muted fw-bold">Completed</small>
                      <h4 className="mb-0 fw-bold">{taxEntries.filter(item => item.status === 'Completed').length} / {taxEntries.length}</h4>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success">Done</span>
                  </div>
                  <p className="mb-0 text-muted small">Completed CVITP tax returns.</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card data-summary-card shadow-sm h-100 p-3 border-0 d-flex flex-column">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <small className="text-muted fw-bold">Assignment Overview</small>
                    <span className="badge bg-info-subtle text-info border border-info">Team Queue</span>
                  </div>
                  <div className="d-flex justify-content-between text-muted mb-1" style={{ fontSize: '10px' }}>
                    <span>REPRESENTATIVE</span>
                    <span>PENDING / TOTAL</span>
                  </div>
                  <div className="flex-grow-1 overflow-auto pe-1" style={{ maxHeight: '75px' }}>
                    {assigneeStats.map(([assignee, counts]) => (
                      <div key={assignee} className="d-flex justify-content-between align-items-center small mb-1">
                        <span className="text-truncate fw-medium me-2" style={{ maxWidth: '160px' }} title={assignee}>{assignee}</span>
                        <span className="fw-bold">{counts.pending} <span className="text-muted fw-normal">/ {counts.total}</span></span>
                      </div>
                    ))}
                    {assigneeStats.length === 0 && <span className="text-muted small">No assignments yet.</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Toolbar Action Elements */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
              <div className="d-flex gap-2">
                <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm" onClick={handleOpenAddModal}>
                  ➕ Add Customer
                </button>
                <button className="btn btn-outline-secondary d-flex align-items-center gap-2 shadow-sm" onClick={exportToCSV} disabled={taxEntries.length === 0}>
                  📥 Export Report
                </button>
              </div>
              <button className="btn btn-sm btn-outline-primary" onClick={() => fetchCvitpEntries()} disabled={isLoadingEntries}>
                {isLoadingEntries ? '🔄 Refreshing...' : '🔄 Refresh Data'}
              </button>
            </div>

            <div className="row mb-3">
              <div className="col-md-6 col-lg-5">
                <div className="input-group shadow-sm rounded-pill overflow-hidden">
                  <span className="input-group-text bg-white border-end-0">🔎</span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search name, mobile, email..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              {/* Left Column: Data Grid Dashboard */}
              <div className="col-12 col-xl-8 mb-4">
                <div className="card border-0 shadow-sm position-relative">
                  {(isLoadingEntries || isSaving) && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white" style={{ zIndex: 10, opacity: 0.8, borderRadius: 'inherit' }}>
                      <div className="text-center">
                        <div className="spinner-border text-primary mb-2" role="status" aria-hidden="true"></div>
                        <div className="fw-bold text-secondary">{isSaving ? 'Saving changes...' : 'Loading records...'}</div>
                      </div>
                    </div>
                  )}
                  <div className="card-header bg-white border-0 pt-3">
                    <h5 className="card-title mb-0 text-secondary fw-bold">CVITP Status Matrix</h5>
                  </div>

                  {/* Mobile Card View */}
              <div className="d-block d-md-none p-3 bg-light">
                    {filteredEntries.length === 0 && !isLoadingEntries ? (
                      <div className="card mb-3 mobile-record-card shadow-sm border-0">
                        <div className="card-body text-center py-4">
                          <p className="mb-0 text-muted">No matching records found.</p>
                        </div>
                      </div>
                    ) : (
                      filteredEntries.map((entry) => (
                    <div key={entry.id} className="card mb-3 mobile-record-card shadow-sm border-0">
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-1 fw-bold text-dark">{entry.name}</h6>
                                <div className="mt-1">
                                  <button className="btn btn-link btn-sm p-0 text-decoration-none d-block text-start" onClick={() => setDialNumber(entry.mobile)}>📞 {entry.mobile}</button>
                                  {entry.email && <div className="text-muted small mt-1" style={{fontSize: '11px'}}>✉️ {entry.email}</div>}
                                </div>
                              </div>
                              <div className="dropdown">
                                <button className="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-boundary="window">Actions</button>
                                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                  <li><button className="dropdown-item" onClick={() => handleOpenEditModal(entry)}>✏️ Edit Details</button></li>
                                  <li><button className="dropdown-item" onClick={() => setEmailModalConfig({ customer: entry, action: 'requestDetails', taxType: 'CVITP' })}>📋 Request Details</button></li>
                                  <li><button className="dropdown-item" onClick={() => navigate('/esign-request', { state: { customerId: entry.id, clientName: entry.name, clientEmail: entry.email || '', taxType: 'CVITP' } })}>✍️ Request eSign</button></li>
                                  <li><button className="dropdown-item" onClick={() => fetchEsignDetails(entry)}>📊 eSign Details</button></li>
                                  <li><button className="dropdown-item" onClick={() => setEmailModalConfig({ customer: entry, action: 'requestDocument', taxType: 'CVITP' })}>📂 Request Document</button></li>
                                </ul>
                              </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <div className="small">📥 <span className="text-muted">{entry.receivedDate || '-'}</span></div>
                              <div className="small">✅ <span className="text-success fw-bold">{entry.filledDate || '-'}</span></div>
                              <div className="small">🗓️ <span className="text-muted">{entry.yearsOfFiling || '-'}</span></div>
                            </div>
                            <div className="small text-muted mb-2" style={{fontSize: '11px'}}>Updated: {new Date(entry.updatedAt).toLocaleDateString()}</div>
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                              <span className={`badge px-2 py-1 fs-7 fw-bold ${entry.status === 'Completed' || entry.status === 'eSigned' ? 'bg-success-subtle text-success border border-success' : entry.status === 'Processing' ? 'bg-warning-subtle text-warning border border-warning' : entry.status === 'Draft Sent' ? 'bg-primary-subtle text-primary border border-primary' : entry.status === 'Cancelled' ? 'bg-secondary-subtle text-secondary border' : 'bg-danger-subtle text-danger border border-danger'}`}>{entry.status}</span>
                              <span className="text-dark small fw-medium text-truncate" style={{maxWidth: '120px'}} title={entry.assignedTo}>{entry.assignedTo || <span className="text-muted fst-italic">Unassigned</span>}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="table-responsive d-none d-md-block" style={{ minHeight: '350px' }}>
                    <table className="table table-modern table-hover align-middle shadow-sm">
                      <colgroup>
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                      </colgroup>
                      <thead>
                        <tr className="text-muted small text-uppercase">
                          <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name & Contact {sortKey === 'name' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                          <th onClick={() => handleSort('receivedDate')} style={{ cursor: 'pointer' }}>Dates (Recv / Filed) {sortKey === 'receivedDate' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                          <th onClick={() => handleSort('yearsOfFiling')} style={{ cursor: 'pointer' }}>Years of Filing {sortKey === 'yearsOfFiling' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                          <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status {sortKey === 'status' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                          <th onClick={() => handleSort('assignedTo')} style={{ cursor: 'pointer' }}>Assigned To {sortKey === 'assignedTo' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxEntries.length === 0 && !isLoadingEntries ? (
                          <tr><td colSpan="6" className="text-center py-5 text-muted">No operational clinic registrations indexed.</td></tr>
                        ) : sortedEntries.length === 0 && !isLoadingEntries ? (
                          <tr><td colSpan="6" className="text-center py-5 text-muted">No matching records found.</td></tr>
                        ) : (
                          sortedEntries.map((entry) => (
                            <tr key={entry.id}>
                              
                              <td>
                                <div className="fw-bold text-dark">{entry.name}</div>
                                <div className="mt-1">
                                  <button className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => setDialNumber(entry.mobile)}>
                                    📞 {entry.mobile}
                                  </button>
                                  {entry.email && (
                                    <div className="text-muted small mt-1" style={{ fontSize: '11px' }}>
                                      ✉️ {entry.email}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="small">📥 <span className="text-muted">{entry.receivedDate || '-'}</span></div>
                                <div className="small">✅ <span className="text-success fw-bold">{entry.filledDate || '-'}</span></div>
                                <div className="text-muted small mt-1" style={{fontSize: '11px'}}>Updated: {new Date(entry.updatedAt).toLocaleDateString()}</div>
                              </td>
                              <td>
                                <span className="text-dark small fw-medium">{entry.yearsOfFiling || '-'}</span>
                              </td>
                              <td>
                                <span className={`badge px-2 py-1 fs-7 fw-bold ${
                                  entry.status === 'Completed' ? 'bg-success-subtle text-success border border-success' : 
                                  entry.status === 'eSigned' ? 'bg-success-subtle text-success border border-success' : 
                                  entry.status === 'Processing' ? 'bg-warning-subtle text-warning border border-warning' :
                                  entry.status === 'Draft Sent' ? 'bg-primary-subtle text-primary border border-primary' :
                                  entry.status === 'Cancelled' ? 'bg-secondary-subtle text-secondary border' :
                                  'bg-danger-subtle text-danger border border-danger'
                                }`}>
                                  {entry.status}
                                </span>
                              </td>
                              <td>
                                <span className="text-dark small fw-medium">{entry.assignedTo || <span className="text-muted italic">Unassigned</span>}</span>
                              </td>
                              <td>
                                <div className="dropdown">
                                  <button 
                                    className="btn btn-link fw-bold text-decoration-none p-0 d-flex align-items-center gap-1 dropdown-toggle"
                                    type="button" 
                                    data-bs-toggle="dropdown" 
                                    aria-expanded="false"
                                    data-bs-boundary="window"
                                    title={`Actions for entry #${entry.id}`}
                                  >
                                    Actions
                                  </button>
                                  <ul className="dropdown-menu shadow-sm">
                                    <li>
                                      <button className="dropdown-item" onClick={() => handleOpenEditModal(entry)}>
                                        ✏️ Edit Details
                                      </button>
                                    </li>
                                    <li>
                                      <button className="dropdown-item" onClick={() => setEmailModalConfig({ customer: entry, action: 'requestDetails', taxType: 'CVITP' })}>
                                        📋 Request Details
                                      </button>
                                    </li>
                                    <li>
                                      <button className="dropdown-item" onClick={() => navigate('/esign-request', { state: { customerId: entry.id, clientName: entry.name, clientEmail: entry.email || '', taxType: 'CVITP' } })}>
                                        ✍️ Request eSign
                                      </button>
                                    </li>
                                    <li>
                                      <button className="dropdown-item" onClick={() => fetchEsignDetails(entry)}>
                                        📊 eSign Details
                                      </button>
                                    </li>

                                    <li>

                                      <button className="dropdown-item" onClick={() => setEmailModalConfig({ customer: entry, action: 'requestDocument', taxType: 'CVITP' })}>

                                        📂 Request Document

                                      </button>

                                    </li>
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Tabbed Communications Hub Panel Layout */}
              <div className="col-12 col-xl-4 position-relative">
            <CvitpCommunicationsHub 
              account={account}
              msalInstance={msalInstance}
              isInitialized={isInitialized}
              taxEntries={taxEntries}
              dialNumber={dialNumber}
              setDialNumber={setDialNumber}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>

            {/* --- CUSTOMER ADD/EDIT BACKDROP MODAL --- */}
            {showAddModal && (
              <>
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1550 }}>
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow">
                      <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title fw-bold">
                          {isEditMode ? `✏️ Edit CVITP Registration (#${editingEntryId})` : "➕ Index New CVITP Registration"}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
                      </div>
                      <form onSubmit={handleFormSubmit}>
                        <div className="modal-body p-4">
                          <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">Taxpayer Full Name</label>
                            <input type="text" className="form-control" required value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="John Doe" />
                          </div>
                          <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">Mobile Number</label>
                            <input type="tel" className="form-control" required value={newCustomer.mobile} onChange={e => setNewCustomer({...newCustomer, mobile: e.target.value})} placeholder="+19055551234" />
                          </div>
                          <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">Email Address</label>
                            <input type="email" className="form-control" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} placeholder="john@example.com" />
                          </div>
                          <div className="row">
                            <div className="col-12 mb-3">
                              <label className="form-label small fw-bold text-muted">Years of Filing <span className="fw-normal text-secondary">(Hold Ctrl/Cmd to select multiple)</span></label>
                              <select 
                                multiple 
                                className="form-select" 
                                value={newCustomer.yearsOfFiling} 
                                onChange={e => {
                                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                                  setNewCustomer({...newCustomer, yearsOfFiling: selected});
                                }}
                                size={4}
                              >
                                {last10Years.map(year => <option key={year} value={year}>{year}</option>)}
                              </select>
                            </div>
                            <div className="col-6 mb-3">
                              <label className="form-label small fw-bold text-muted">Coin ID Reference (Export Only)</label>
                              <input type="text" className="form-control" value={newCustomer.coin} onChange={e => setNewCustomer({...newCustomer, coin: e.target.value})} placeholder="C-99" />
                            </div>
                            <div className="col-6 mb-3">
                              <label className="form-label small fw-bold text-muted">Status</label>
                              <select className="form-select" value={newCustomer.status} onChange={e => setNewCustomer({...newCustomer, status: e.target.value})}>
                                <option value="Pending">Pending</option>
                                <option value="Draft Sent">Draft Sent</option>
                                <option value="Processing">Processing</option>
                                <option value="eSigned">eSigned</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-6 mb-3">
                              <label className="form-label small fw-bold text-muted">Received Date</label>
                              <input type="date" className="form-control" value={newCustomer.receivedDate} onChange={e => setNewCustomer({...newCustomer, receivedDate: e.target.value})} />
                            </div>
                            <div className="col-6 mb-3">
                              <label className="form-label small fw-bold text-muted">Filed Date</label>
                              <input type="date" className="form-control" value={newCustomer.filledDate} onChange={e => setNewCustomer({...newCustomer, filledDate: e.target.value})} />
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">Assigned Representative</label>
                            <select 
                              className="form-select" 
                              value={newCustomer.assignedTo} 
                              onChange={e => setNewCustomer({...newCustomer, assignedTo: e.target.value})}
                            >
                              <option value="">Unassigned</option>
                              {agentEmails.map((email) => (
                                <option key={email} value={email}>{email}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="modal-footer bg-light border-0">
                          <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                          <button type="submit" className="btn btn-primary px-4 fw-bold" disabled={isSaving}>
                            {isSaving ? "Saving..." : (isEditMode ? "Save Changes" : "Commit Record")}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="modal-backdrop fade show" style={{ zIndex: 1540 }}></div>
              </>
            )}

            <ESignDetailsModal details={eSignDetails} onClose={() => setESignDetails(null)} />
            
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
          </>
        ) : (
          <div className="alert alert-info mt-4 border-0 p-4 shadow-sm">
            <h5 className="fw-bold">🔐 Access Control Boundary</h5>
            Please sign in with your corporate credentials to connect your client terminal matrix interface safely.
          </div>
        )}
      </div>
    </div>
  );
};

export default CvitpPage;