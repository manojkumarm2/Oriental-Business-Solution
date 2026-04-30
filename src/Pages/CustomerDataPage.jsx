import React, { useEffect, useMemo, useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import Logo from '../Assets/nav-logo.png';

const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_MSAL_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/c4ea64ee-34b6-4a18-9339-8aff143c12d4',
    redirectUri: `${window.location.origin}/customerData`,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
};

const loginRequest = {
  scopes: ['User.Read'],
};

const initialNewCustomer = {
  name: '',
  spouse: '',
  address: '',
  city: '',
  mobile: '',
  email: '',
  invoiceDate: '',
  filingDate: '',
  draftSentDate: '',
  invoiceNo: '',
  invoiceAmount: '',
  paymentReceived: '',
  dueDate: '',
  updatedBy: '',
  latestComment: '',
  familyDetails: '',
  history: '',
  status: 'Pending',
};

const statusOptions = ['Open', 'Pending', 'Draft Sent', 'Payment Pending', 'Completed'];

const getId = (record) => record._id || record.id;

const CustomerDataPage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [account, setAccount] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [sortKey, setSortKey] = useState('dueDate');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [newCustomer, setNewCustomer] = useState(initialNewCustomer);
  const [editValues, setEditValues] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [pageIndex, setPageIndex] = useState(0);

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
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('MSAL Initialization Error:', err);
        if (isMounted) setError('Failed to initialize authentication.');
      }
    };

    initializeMsal();

    return () => {
      isMounted = false;
    };
  }, [msalInstance]);

  useEffect(() => {
    if (account) {
      fetchCustomers();
    }
  }, [account]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const response = await fetch('/api/customers', {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load customer list.');
      }
      const data = await response.json();
      setCustomers(data || []);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Could not verify your session. Please sign in again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!isInitialized) {
      setError('Authentication is still initializing. Please wait.');
      return;
    }

    setError('');
    setMessage('');

    if (!process.env.REACT_APP_MSAL_CLIENT_ID || process.env.REACT_APP_MSAL_CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
      setError('Please configure REACT_APP_MSAL_CLIENT_ID in your .env file with your Azure AD application client id.');
      return;
    }

    try {
      await msalInstance.loginRedirect(loginRequest);
    } catch (loginError) {
      setError(loginError.message || 'Microsoft sign-in failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await msalInstance.logoutPopup({ account });
      setAccount(null);
      setCustomers([]);
      setError('');
      setMessage('');
    } catch (logoutError) {
      setError(logoutError.message || 'Logout failed.');
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleAddCustomer = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!newCustomer.name || !newCustomer.mobile) {
      setError('Customer name and mobile number are required.');
      return;
    }

    // Calculate due date as 3 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateString = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Prepare customer data with due date and updated by
    const customerData = {
      ...newCustomer,
      dueDate: dueDateString,
      updatedBy: account?.username || account?.name || 'Unknown',
    };

    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Unable to add customer.');
      }
      const created = await response.json();
      setCustomers((prev) => [created, ...prev]);
      setNewCustomer(initialNewCustomer);
      setShowAddModal(false);
      setMessage('Customer added successfully.');
    } catch (saveError) {
      console.error(saveError);
      setError('Could not verify your session. Please sign in again.');
    }
  };

  const handleUpdateCustomer = async (record) => {
    const id = getId(record);
    const currentEdit = editValues[id] || {};
    const updates = {
      name: currentEdit.name ?? record.name,
      spouse: currentEdit.spouse ?? record.spouse,
      address: currentEdit.address ?? record.address,
      city: currentEdit.city ?? record.city,
      mobile: currentEdit.mobile ?? record.mobile,
      email: currentEdit.email ?? record.email,
      invoiceDate: currentEdit.invoiceDate ?? record.invoiceDate,
      filingDate: currentEdit.filingDate ?? record.filingDate,
      draftSentDate: currentEdit.draftSentDate ?? record.draftSentDate,
      invoiceNo: currentEdit.invoiceNo ?? record.invoiceNo,
      invoiceAmount: currentEdit.invoiceAmount ?? record.invoiceAmount,
      paymentReceived: currentEdit.paymentReceived ?? record.paymentReceived,
      dueDate: currentEdit.dueDate ?? record.dueDate,
      status: currentEdit.status ?? record.status,
      latestComment: currentEdit.latestComment ?? record.latestComment,
      dob: currentEdit.dob ?? record.dob,
      workStatus: currentEdit.workStatus ?? record.workStatus,
      updatedBy: account?.username || account?.name || 'Unknown',
    };

    setSavingId(id);
    setError('');
    setMessage('');

    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Unable to update customer.');
      }
      const updated = await response.json();
      setCustomers((prev) => prev.map((item) => (getId(item) === id ? updated : item)));
      setMessage('Customer record updated.');
    } catch (updateError) {
      console.error(updateError);
      setError('Could not verify your session. Please sign in again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleRowExpand = (recordId, record) => {
    setExpandedId(expandedId === recordId ? null : recordId);
    setEditValues((prev) => ({
      ...prev,
      [recordId]: {
        name: record.name || '',
        spouse: record.spouse || '',
        address: record.address || '',
        city: record.city || '',
        mobile: record.mobile || '',
        email: record.email || '',
        invoiceDate: record.invoiceDate || '',
        invoiceNo: record.invoiceNo || '',
        invoiceAmount: record.invoiceAmount || '',
        paymentReceived: record.paymentReceived || '',
        filingDate: record.filingDate || '',
        draftSentDate: record.draftSentDate || '',
        dueDate: record.dueDate || '',
        status: record.status || '',
        latestComment: record.latestComment || '',
        dob: record.dob || '',
        workStatus: record.workStatus || '',
      },
    }));
  };

  const handleOpenAddModal = () => {
    setError('');
    setMessage('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setNewCustomer(initialNewCustomer);
  };

  const filteredData = customers.filter((record) => {
    const value = `${record.name} ${record.spouse} ${record.mobile} ${record.status} ${record.dob} ${record.workStatus} ${record.updatedBy} ${record.latestComment}`.toLowerCase();
    const statusMatch = filterStatus ? record.status === filterStatus : true;
    return statusMatch && value.includes(searchText.toLowerCase());
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = typeof a[sortKey] === 'string' ? a[sortKey].toLowerCase() : a[sortKey];
    const bVal = typeof b[sortKey] === 'string' ? b[sortKey].toLowerCase() : b[sortKey];
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const pageData = sortedData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  useEffect(() => {
    setPageIndex(0);
  }, [pageSize, filterStatus, searchText, customers.length]);

  return (
    <div className="container py-5" style={{ minHeight: '100vh' }}>
      <header className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3 border-bottom pb-3">
        <div className="d-flex align-items-center gap-3">
          <img src={Logo} alt="OBS_logo" className="align-text-top" style={{ width: '280px', height: '85px' }} />
          <div>
            <h1 className="mb-1">Customer Data</h1>
            <p className="text-muted mb-0">Use your Microsoft organization account to access the customer portal.</p>
          </div>
        </div>
        <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-2">
          {account ? (
            <>
              <div className="text-end text-sm-start">
                <div className="text-muted">Logged in as</div>
                <strong>{account.username || account.name || 'User'}</strong>
              </div>
              <button className="btn btn-outline-secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleLogin}>
              Sign in with Microsoft
            </button>
          )}
        </div>
      </header>
      {(error || message) && (
        <div className="mb-3">
          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
        </div>
      )}

      {account ? (
        <>
          <div className="d-flex justify-content-end mb-4">
            <button className="btn btn-success" onClick={handleOpenAddModal}>
              Add Customer
            </button>
          </div>

          {showAddModal && (
            <div
              className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1050 }}
              onClick={handleCloseAddModal}
            >
              <div
                className="bg-white rounded shadow-lg p-4"
                style={{ width: '95%', maxWidth: '760px', maxHeight: '90vh', overflowY: 'auto' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0">Add New Customer</h4>
                  <button className="btn btn-sm btn-outline-secondary" onClick={handleCloseAddModal}>
                    Close
                  </button>
                </div>
                <form onSubmit={handleAddCustomer}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Customer Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Spouse Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustomer.spouse}
                        onChange={(e) => setNewCustomer({ ...newCustomer, spouse: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Mobile Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newCustomer.mobile}
                        onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustomer.city}
                        onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Invoice Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newCustomer.invoiceDate}
                        onChange={(e) => setNewCustomer({ ...newCustomer, invoiceDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Filing Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newCustomer.filingDate}
                        onChange={(e) => setNewCustomer({ ...newCustomer, filingDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Draft Sent Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newCustomer.draftSentDate}
                        onChange={(e) => setNewCustomer({ ...newCustomer, draftSentDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Invoice Amount</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustomer.invoiceAmount}
                        onChange={(e) => setNewCustomer({ ...newCustomer, invoiceAmount: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Payment Received</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustomer.paymentReceived}
                        onChange={(e) => setNewCustomer({ ...newCustomer, paymentReceived: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">DOB</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newCustomer.dob}
                        onChange={(e) => setNewCustomer({ ...newCustomer, dob: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Work Status</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustomer.workStatus}
                        onChange={(e) => setNewCustomer({ ...newCustomer, workStatus: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={newCustomer.status}
                        onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value })}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Comment</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={newCustomer.latestComment}
                        onChange={(e) => setNewCustomer({ ...newCustomer, latestComment: e.target.value })}
                      />
                    </div>
                    <div className="col-12 text-end">
                      <button type="submit" className="btn btn-success">
                        Add Customer
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="row mb-3 align-items-center">
            <div className="col-md-4 mb-3 mb-md-0">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, spouse, mobile..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="col-md-3 mb-3 mb-md-0">
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-3 mb-md-0">
              <select className="form-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}>
                <option value={25}>25 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            <div className="col-md-2 text-md-end">
              <button className="btn btn-outline-secondary" onClick={fetchCustomers} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh list'}
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered align-middle" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead className="table-light">
                <tr>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name {sortKey === 'name' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                  <th onClick={() => handleSort('mobile')} style={{ cursor: 'pointer' }}>Mobile {sortKey === 'mobile' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                  <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status {sortKey === 'status' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                  <th onClick={() => handleSort('dueDate')} style={{ cursor: 'pointer' }}>Due Date {sortKey === 'dueDate' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                  <th>Updated By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((record) => {
                  const recordId = getId(record);
                  const rowEdit = editValues[recordId] || {
                    status: record.status,
                    latestComment: record.latestComment,
                  };

                  return (
                    <React.Fragment key={recordId}>
                      <tr>
                        <td>{record.name}</td>
                        <td>{record.mobile}</td>
                        <td>{record.status}</td>
                        <td style={{ 
                          backgroundColor: record.dueDate && new Date(record.dueDate).toDateString() === new Date().toDateString() ? '#fff3cd' : 'transparent',
                          fontWeight: record.dueDate && new Date(record.dueDate).toDateString() === new Date().toDateString() ? 'bold' : 'normal'
                        }}>
                          {record.status === 'Completed' ? 'N/A' : (record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'N/A')}
                        </td>
                        <td>{record.updatedBy || 'N/A'}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleRowExpand(recordId, record)}
                          >
                            {expandedId === recordId ? 'Collapse' : 'Update'}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setExpandedId(recordId === expandedId ? null : recordId)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                      {expandedId === recordId && (
                        <tr className="table-secondary">
                          <td colSpan="6">
                            <div className="p-3">
                              <div className="row gy-3">
                                <div className="col-md-4">
                                  <h6>Contact</h6>
                                  <p><strong>Email:</strong> {record.email || 'N/A'}</p>
                                  <p><strong>Address:</strong> {record.address || 'N/A'}</p>
                                  <p><strong>City:</strong> {record.city || 'N/A'}</p>
                                </div>
                                <div className="col-md-4">
                                  <h6>Invoice</h6>
                                  <p><strong>Date:</strong> {record.invoiceDate ? new Date(record.invoiceDate).toLocaleDateString() : 'N/A'}</p>
                                  <p><strong>Filing Date:</strong> {record.filingDate ? new Date(record.filingDate).toLocaleDateString() : 'N/A'}</p>
                                  <p><strong>Draft Sent Date:</strong> {record.draftSentDate ? new Date(record.draftSentDate).toLocaleDateString() : 'N/A'}</p>
                                  <p><strong>Invoice No:</strong> {record.invoiceNo || 'N/A'}</p>
                                  <p><strong>Amount:</strong> {record.invoiceAmount || 'N/A'}</p>
                                </div>
                                <div className="col-md-4">
                                  <h6>Payment</h6>
                                  <p><strong>Received:</strong> {record.paymentReceived || 'N/A'}</p>
                                  <p><strong>Status:</strong> {record.status || 'N/A'}</p>
                                  <p><strong>Due Date:</strong> {record.status === 'Completed' ? 'N/A' : (record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'N/A')}</p>
                                  <p><strong>Created:</strong> {record.createdAt ? new Date(record.createdAt).toLocaleString() : 'N/A'}</p>
                                </div>
                                <div className="col-12">
                                  <h6>Notes</h6>
                                  <p>{record.familyDetails || record.history || 'No additional notes.'}</p>
                                </div>
                                <div className="col-12">
                                  <h6>Edit Customer Details</h6>
                                  <div className="row g-3">
                                    <div className="col-md-6">
                                      <label className="form-label">Status</label>
                                      <select
                                        className="form-select"
                                        value={rowEdit.status}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              status: e.target.value,
                                            },
                                          }))
                                        }
                                      >
                                        {statusOptions.map((status) => (
                                          <option key={status} value={status}>{status}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="col-md-6">
                                      <label className="form-label">Due Date</label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={rowEdit.dueDate}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              dueDate: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-12">
                                      <label className="form-label">Latest Comment</label>
                                      <textarea
                                        className="form-control"
                                        rows="3"
                                        value={rowEdit.latestComment}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              latestComment: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">Name</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={rowEdit.name}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              name: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">Spouse</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={rowEdit.spouse}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              spouse: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">Mobile</label>
                                      <input
                                        type="tel"
                                        className="form-control"
                                        value={rowEdit.mobile}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              mobile: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">Email</label>
                                      <input
                                        type="email"
                                        className="form-control"
                                        value={rowEdit.email}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              email: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">Address</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={rowEdit.address}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              address: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">City</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={rowEdit.city}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              city: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">Invoice Date</label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={rowEdit.invoiceDate}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              invoiceDate: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">Filing Date</label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={rowEdit.filingDate}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              filingDate: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">Draft Sent Date</label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={rowEdit.draftSentDate}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              draftSentDate: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">Invoice No.</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={rowEdit.invoiceNo}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              invoiceNo: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">Invoice Amount</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={rowEdit.invoiceAmount}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              invoiceAmount: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">Payment Received</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={rowEdit.paymentReceived}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              paymentReceived: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">DOB</label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={rowEdit.dob}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              dob: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">Work Status</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={rowEdit.workStatus}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [recordId]: {
                                              ...prev[recordId],
                                              workStatus: e.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="text-end mt-3">
                                    <button
                                      className="btn btn-success"
                                      onClick={() => handleUpdateCustomer(record)}
                                      disabled={savingId === recordId}
                                    >
                                      {savingId === recordId ? 'Saving...' : 'Save Changes'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {sortedData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No customers match your search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-3">
            <div className="text-muted">
              Showing {sortedData.length === 0 ? 0 : pageIndex * pageSize + 1} - {Math.min(sortedData.length, (pageIndex + 1) * pageSize)} of {sortedData.length}
            </div>
            <div className="btn-group" role="group">
              <button
                className="btn btn-outline-secondary"
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              >
                Previous
              </button>
              <button
                className="btn btn-outline-secondary"
                disabled={pageIndex >= totalPages - 1}
                onClick={() => setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="alert alert-info">
          Please sign in with your Microsoft organization account to view the customer table.
        </div>
      )}
    </div>
  );
};

export default CustomerDataPage;
