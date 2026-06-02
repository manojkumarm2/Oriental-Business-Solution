import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ESignDetailsModal from '../components/Common/ESignDetailsModal';
import { loginRequest, getApiUrl, getRawDateString, getUsersEmail, isAdminRole } from '../authConfig';
import { calculateAssigneeStats } from '../utils/StatsHelper';
import { useTaxPortal } from '../utils/useTaxPortal';
import TaxPortalLayout from '../components/Common/TaxPortalLayout';
import TaxPortalToolbar from '../components/Common/TaxPortalToolbar';

import * as XLSX from 'xlsx';

const assignedToOptions = getUsersEmail();

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
  notes: '',
  familyDetails: '',
  history: '',
  status: 'Pending',
  assignedTo: '',
  otherComments: '',
  draftStatus: '',
  receivedDate: '',
};

const statusOptions = ['Open', 'Pending', 'Review', 'Draft Sent', 'eSigned', 'Payment Pending', 'Completed'];
// update duedate option as today to next 4 days in yyyy-mm-dd format
const dueDateOptions = [];
for (let i = 0; i < 5; i++) {
  const date = new Date();
  date.setDate(date.getDate() + i);
  dueDateOptions.push(date.toISOString().split('T')[0]);
}

const getStatusBadgeClass = (status) => {
  const map = {
    Open: 'bg-secondary',
    Pending: 'bg-warning text-dark',
    Review: 'bg-primary text-white',
    'Draft Sent': 'bg-info text-dark',
    'eSigned': 'bg-success',
    'Payment Pending': 'bg-danger',
    Completed: 'bg-success',
  };
  return `badge badge-status ${map[status] || 'bg-secondary'}`;
};

const getId = (record) => record._id || record.id;

const getDueDateStyle = (dueDate) => {
  if (!dueDate) return {};
  try {
    const dueDateObj = new Date(dueDate);
    const today = new Date();
    const dueDateStr = dueDateObj.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    if (dueDateStr === todayStr) {
      return { backgroundColor: '#fff3cd', fontWeight: 'bold' }; // Current date - yellow
    } else if (dueDateStr < todayStr) {
      return { backgroundColor: '#f8d7da', fontWeight: 'bold' }; // Past date - red
    }
  } catch {}
  return {};
};

const compareDueDates = (a, b) => {
  const aDate = a.dueDate;
  const bDate = b.dueDate;
  const aStatus = a.status;
  const bStatus = b.status;


  // 1. Handle N/A and Empty values (Push to bottom)
  const isAInvalid = !aDate || aDate === 'N/A' || aStatus === 'Completed';
  const isBInvalid = !bDate || bDate === 'N/A' || bStatus === 'Completed';

  if (isAInvalid && isBInvalid) return 0;
  if (isAInvalid) return 1;
  if (isBInvalid) return -1;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const parseDate = (dateStr) => {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    const dateA = parseDate(aDate);
    const dateB = parseDate(bDate);

    // Final fallback if parsing fails mid-stream
    if (!dateA) return 1;
    if (!dateB) return -1;

    // 2. Sort by chronological order (Ascending)
    // If you want "Closest to today" regardless of past/future, use Math.abs()
    // For standard deadline sorting (overdue first), use a simple subtraction:
    return dateA.getTime() - dateB.getTime();

  } catch (error) {
    return 0;
  }
};

const PersonalTaxDataPage = () => {
  const portalState = useTaxPortal();
  const { account, msalInstance, isInitialized, error, setError, message, setMessage, setDialNumber, setIsDialerOpen, setRefreshTrigger, setEmailModalConfig } = portalState;

  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [sortKey, setSortKey] = useState('dueDate');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('nonCompleted');
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [filterDueDate, setFilterDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [newCustomer, setNewCustomer] = useState(initialNewCustomer);
  const [editValues, setEditValues] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [eSignDetails, setESignDetails] = useState(null);

  const fetchEsignDetails = async (entry) => {
    try {
        const tokenResponse = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
        const response = await fetch(getApiUrl(`/api/staff/esign-details/Personal/${entry.id || entry._id}`), {
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
  const [pageSize, setPageSize] = useState(25);
  const [pageIndex, setPageIndex] = useState(0);

  // --- DYNAMIC ASSIGNEE WORKLOAD STATS ---
  const assigneeStats = useMemo(() => {
    return calculateAssigneeStats(customers);
  }, [customers]);

  useEffect(() => {
    if (account && isInitialized) {
      fetchCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, isInitialized]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (typeof msalInstance.initialize === 'function') {
        await msalInstance.initialize();
      }
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const response = await fetch(getApiUrl('/api/customers'), {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load customer list.');
      }
      const data = await response.json();
      setCustomers(data || []);
      setRefreshTrigger(prev => prev + 1);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Could not verify your session. Please sign in again.');
    } finally {
      setLoading(false);
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
      if (typeof msalInstance.initialize === 'function') {
        await msalInstance.initialize();
      }
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const response = await fetch(getApiUrl('/api/customers'), {
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

  const handleAssignedToChange = async (record, assignedTo) => {
    const id = getId(record);
    setSavingId(id);
    setError('');
    setMessage('');

    try {
      if (typeof msalInstance.initialize === 'function') {
        await msalInstance.initialize();
      }
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const response = await fetch(getApiUrl(`/api/customers/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
        body: JSON.stringify({
          assignedTo,
          updatedBy: account?.username || account?.name || 'Unknown',
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Unable to update assignment.');
      }

      const updated = await response.json();
      setCustomers((prev) => prev.map((item) => (getId(item) === id ? updated : item)));
      setMessage('Assignment updated.');
    } catch (updateError) {
      console.error(updateError);
      setError('Could not verify your session. Please sign in again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateCustomer = async (record) => {
    const id = getId(record);
    const currentEdit = editValues[id] || {};
    const status = currentEdit.status || record.status;
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
      status: status,
      notes: status === 'Completed' ? '' : currentEdit.notes ?? record.notes,
      dob: currentEdit.dob ?? record.dob,
      workStatus: currentEdit.workStatus ?? record.workStatus,
      assignedTo: currentEdit.assignedTo ?? record.assignedTo,
      otherComments: currentEdit.otherComments ?? record.otherComments,
      draftStatus: currentEdit.draftStatus ?? record.draftStatus,
      receivedDate: currentEdit.receivedDate ?? record.receivedDate,
      familyDetails: currentEdit.familyDetails ?? record.familyDetails,
      history: currentEdit.history ?? record.history,
      updatedBy: account?.username || account?.name || 'Unknown',
    };

    setSavingId(id);
    setError('');
    setMessage('');

    try {
      if (typeof msalInstance.initialize === 'function') {
        await msalInstance.initialize();
      }
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const response = await fetch(getApiUrl(`/api/customers/${id}`), {
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

  const handleDeleteCustomer = async (record) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    const id = getId(record);
    setSavingId(id);
    setError('');
    setMessage('');

    try {
      if (typeof msalInstance.initialize === 'function') {
        await msalInstance.initialize();
      }
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const response = await fetch(getApiUrl(`/api/customers/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Unable to delete customer.');
      }

      setCustomers((prev) => prev.filter((item) => getId(item) !== id));
      setExpandedId(null);
      setMessage('Customer record deleted.');
    } catch (deleteError) {
      console.error(deleteError);
      setError('Could not verify your session or delete record. Please sign in again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleRowExpand = (recordId, record) => {
    setExpandedId(expandedId === recordId ? null : recordId);
    const status = record.status;
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
        status: status,
        notes: status === 'Completed' ? '' : record.notes || '',
        dob: record.dob || '',
        workStatus: record.workStatus || '',
        assignedTo: record.assignedTo || '',
        otherComments: record.otherComments || '',
        draftStatus: record.draftStatus || '',
        receivedDate: record.receivedDate || '',
        familyDetails: record.familyDetails || '',
        history: record.history || '',
      },
    }));
  };

  const renderPersonalExpandedForm = (record, recordId, rowEdit) => {
    const isAdmin = isAdminRole(account?.username);

    return (
      <div className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Edit Customer Details</h6>
          <div className="d-flex gap-2">
            {isAdmin && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteCustomer(record)}
                disabled={savingId === recordId}
              >
                Delete
              </button>
            )}
            <button
              className="btn btn-success btn-sm"
              onClick={() => handleUpdateCustomer(record)}
              disabled={savingId === recordId}
            >
              {savingId === recordId ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
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
            value={getRawDateString(rowEdit.dueDate)}
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
        <div className="col-md-6">
          <label className="form-label">Assigned To</label>
          <select
            className="form-select"
            value={rowEdit.assignedTo || ''}
            onChange={(e) =>
              setEditValues((prev) => ({
                ...prev,
                [recordId]: {
                  ...prev[recordId],
                  assignedTo: e.target.value,
                },
              }))
            }
          >
            <option value="">Unassigned</option>
            {assignedToOptions.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Draft Status</label>
          <input
            type="text"
            className="form-control"
            value={rowEdit.draftStatus || ''}
            onChange={(e) =>
              setEditValues((prev) => ({
                ...prev,
                [recordId]: {
                  ...prev[recordId],
                  draftStatus: e.target.value,
                },
              }))
            }
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Received Date</label>
          <input
            type="date"
            className="form-control"
            value={rowEdit.receivedDate || ''}
            onChange={(e) =>
              setEditValues((prev) => ({
                ...prev,
                [recordId]: {
                  ...prev[recordId],
                  receivedDate: e.target.value,
                },
              }))
            }
          />
        </div>
        <div className="col-12">
          <label className="form-label">Notes</label>
          <textarea
            className="form-control"
            rows="3"
            value={rowEdit.notes}
            onChange={(e) =>
              setEditValues((prev) => ({
                ...prev,
                [recordId]: {
                  ...prev[recordId],
                  notes: e.target.value,
                },
              }))
            }
          />
        </div>
        <div className="col-12">
          <label className="form-label">Other Comments</label>
          <textarea
            className="form-control"
            rows="3"
            value={rowEdit.otherComments || ''}
            onChange={(e) =>
              setEditValues((prev) => ({
                ...prev,
                [recordId]: {
                  ...prev[recordId],
                  otherComments: e.target.value,
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
      <div className="text-end mt-3 d-flex gap-2 justify-content-end">
        {isAdmin && (
          <button
            className="btn btn-danger"
            onClick={() => handleDeleteCustomer(record)}
            disabled={savingId === recordId}
          >
            Delete
          </button>
        )}
        <button
          className="btn btn-success"
          onClick={() => handleUpdateCustomer(record)}
          disabled={savingId === recordId}
        >
          {savingId === recordId ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      </div>
    );
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
    const assignedMatch = filterAssignedTo ? record.assignedTo === filterAssignedTo : true;
    const dueDateMatch = filterDueDate ? record.dueDate === filterDueDate : true;
    const value = `${record.name} ${record.spouse} ${record.mobile} ${record.status} ${record.dob} ${record.workStatus} ${record.updatedBy} ${record.notes} ${record.assignedTo}`.toLowerCase();
    const statusMatch = filterStatus === 'nonCompleted'
      ? record.status !== 'Completed'
      : filterStatus
      ? record.status === filterStatus
      : true;
    return statusMatch && assignedMatch && dueDateMatch && value.includes(searchText.toLowerCase());
  });

  const sortedData = [...filteredData].sort((a, b) => {
    // Special handling for dueDate
    if (sortKey === 'dueDate') {
      const comparison = compareDueDates(a, b);
      return sortAsc ? comparison : -comparison;
    }
    
    // Default sorting for other fields
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

  const handleExportToExcel = () => {
    const exportData = sortedData.map((record) => ({
      'Name': record.name || '',
      'Spouse': record.spouse || '',
      'Mobile': record.mobile || '',
      'Email': record.email || '',
      'Address': record.address || '',
      'City': record.city || '',
      'Status': record.status || '',
      'Due Date': record.dueDate ? getRawDateString(record.dueDate) : 'N/A',
      'Assigned To': record.assignedTo || '',
      'Draft Status': record.draftStatus || '',
      'Received Date': record.receivedDate ? getRawDateString(record.receivedDate) : '',
      'Invoice Date': record.invoiceDate ? getRawDateString(record.invoiceDate) : '',
      'Filing Date': record.filingDate ? getRawDateString(record.filingDate) : '',
      'Draft Sent Date': record.draftSentDate ? getRawDateString(record.draftSentDate) : '',
      'Invoice No.': record.invoiceNo || '',
      'Invoice Amount': record.invoiceAmount || '',
      'Payment Received': record.paymentReceived || '',
      'DOB': record.dob ? getRawDateString(record.dob) : '',
      'Work Status': record.workStatus || '',
      'Notes': record.notes || '',
      'Other Comments': record.otherComments || '',
      'Family Details': record.familyDetails || '',
      'History': record.history || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Personal Tax Data');
    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
    XLSX.writeFile(workbook, `Personal_Tax_Data_${timestamp}.xlsx`);
  };

  return (
    <TaxPortalLayout
      title="Personal Tax"
      description="Use your Oriental Biz account to access the personal tax portal."
      taxEntries={customers}
      portalState={portalState}
    >
      {(error || message) && (
        <div className="mb-3">
          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
        </div>
      )}

      {account ? (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card data-summary-card h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <small className="text-muted">Non-completed records</small>
                    <h4 className="mb-0">{customers.filter((item) => item.status !== 'Completed').length}</h4>
                  </div>
                  <span className="badge bg-warning text-dark">Open / Incomplete</span>
                </div>
                <p className="mb-0 text-muted">Only non-completed records are displayed in the table.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card data-summary-card h-100 p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <small className="text-muted">Completed</small>
                    <h4 className="mb-0">{`${customers.filter((item) => item.status === 'Completed').length} / ${customers.length}`}</h4>
                  </div>
                  <span className="badge bg-success">Done</span>
                </div>
                <p className="mb-0 text-muted">Completed records out of total loaded customers.</p>
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
                    <div className="col-md-6">
                      <label className="form-label">Assigned To</label>
                      <select
                        className="form-select"
                        value={newCustomer.assignedTo}
                        onChange={(e) => setNewCustomer({ ...newCustomer, assignedTo: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {assignedToOptions.map((email) => (
                          <option key={email} value={email}>
                            {email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Draft Status</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustomer.draftStatus}
                        onChange={(e) => setNewCustomer({ ...newCustomer, draftStatus: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Received Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newCustomer.receivedDate}
                        onChange={(e) => setNewCustomer({ ...newCustomer, receivedDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Invoice No.</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustomer.invoiceNo}
                        onChange={(e) => setNewCustomer({ ...newCustomer, invoiceNo: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={newCustomer.notes}
                        onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Other Comments</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={newCustomer.otherComments}
                        onChange={(e) => setNewCustomer({ ...newCustomer, otherComments: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Family Details</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={newCustomer.familyDetails}
                        onChange={(e) => setNewCustomer({ ...newCustomer, familyDetails: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">History</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={newCustomer.history}
                        onChange={(e) => setNewCustomer({ ...newCustomer, history: e.target.value })}
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

          <TaxPortalToolbar
            searchPlaceholder="Search name, spouse, mobile..."
            searchText={searchText}
            onSearchChange={setSearchText}
            statusOptions={statusOptions}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            assignedToOptions={assignedToOptions}
            filterAssignedTo={filterAssignedTo}
            onFilterAssignedToChange={setFilterAssignedTo}
            dueDateOptions={dueDateOptions}
            filterDueDate={filterDueDate}
            onFilterDueDateChange={setFilterDueDate}
            pageSize={pageSize}
            onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
            onAdd={handleOpenAddModal}
            addLabel="➕ Add Customer"
            onExport={handleExportToExcel}
            disableExport={sortedData.length === 0}
            onRefresh={fetchCustomers}
            isRefreshing={loading}
          />

          <div className="position-relative" style={{ minHeight: '350px' }}>
            {(loading || savingId) && (
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white" style={{ zIndex: 10, opacity: 0.8, borderRadius: '8px' }}>
                <div className="text-center">
                  <div className="spinner-border text-primary mb-2" role="status" aria-hidden="true"></div>
                  <div className="fw-bold text-secondary">{savingId ? 'Saving changes...' : 'Loading records...'}</div>
                </div>
              </div>
            )}

          <div className="d-block d-md-none">
            {pageData.length === 0 && !loading ? (
              <div className="card mb-3 mobile-record-card">
                <div className="card-body text-center py-4">
                  <p className="mb-0 text-muted">No customers match your search or filter.</p>
                </div>
              </div>
            ) : (
              pageData.map((record) => {
                const recordId = getId(record);
                const rowEdit = editValues[recordId] || {
                  status: record.status,
                  notes: record.notes,
                  assignedTo: record.assignedTo,
                  draftStatus: record.draftStatus,
                  receivedDate: record.receivedDate,
                  otherComments: record.otherComments
                };
                return (
                  <div key={recordId} className="card mb-3 mobile-record-card shadow-sm">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="mb-1">{record.name}</h5>
                          <div className="small text-muted">
                            {record.mobile ? (
                              <button className="btn btn-link btn-sm p-0 text-decoration-none text-start" onClick={() => { setDialNumber(record.mobile); setIsDialerOpen(true); }}>
                                📞 {record.mobile}
                              </button>
                            ) : 'No mobile'}
                          </div>
                        </div>
                        <div className="dropdown">
                          <button className="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-boundary="window">
                            Actions
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                            <li>
                              <button className="dropdown-item" onClick={() => handleRowExpand(recordId, record)}>
                                {expandedId === recordId ? 'Hide' : '✏️ Edit Details'}
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item" onClick={() => navigate('/esign-request', { state: { customerId: recordId, clientName: record.name, clientEmail: record.email, taxType: 'Personal' } })}>
                                ✍️ Request eSign
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item" onClick={() => fetchEsignDetails(record)}>
                                📊 eSign Details
                              </button>
                            </li>

                            <li>

                              <button className="dropdown-item" onClick={() => setEmailModalConfig({ customer: record, action: 'requestDocument', taxType: 'Personal' })}>

                                📂 Request Document

                              </button>

                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <span className={getStatusBadgeClass(record.status)}>{record.status || 'Unknown'}</span>
                        <span className="badge bg-light text-dark">
                          {record.status === 'Completed' ? 'Completed' : `Due ${record.dueDate ? getRawDateString(record.dueDate) : 'N/A'}`}
                        </span>
                      </div>
                      <div className="mb-3">
                        <select
                          className="form-select form-select-sm"
                          value={record.assignedTo || ''}
                          disabled={savingId === recordId}
                          onChange={(e) => handleAssignedToChange(record, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {assignedToOptions.map((email) => (
                            <option key={email} value={email}>
                              {email}
                            </option>
                          ))}
                        </select>
                      </div>
                      {expandedId === recordId && (
                        <div className="bg-light rounded-3 p-3">
                          {renderPersonalExpandedForm(record, recordId, rowEdit)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="table-responsive d-none d-md-block" style={{ minHeight: '350px' }}>
            <table className="table table-modern table-hover align-middle shadow-sm">
              <colgroup>
                <col style={{ width: '26%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr className="text-muted small text-uppercase">
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name {sortKey === 'name' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                  <th className="d-none d-md-table-cell" onClick={() => handleSort('mobile')} style={{ cursor: 'pointer' }}>Mobile {sortKey === 'mobile' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                  <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status {sortKey === 'status' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                  <th onClick={() => handleSort('dueDate')} style={{ cursor: 'pointer' }}>Due Date {sortKey === 'dueDate' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                  <th className="d-none d-md-table-cell" onClick={() => handleSort('assignedTo')} style={{ cursor: 'pointer' }}>Assigned To {sortKey === 'assignedTo' ? (sortAsc ? '▲' : '▼') : '↕'}</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((record) => {
                  const recordId = getId(record);
                  const rowEdit = editValues[recordId] || {
                    status: record.status,
                    notes: record.notes,
                    assignedTo: record.assignedTo,
                    draftStatus: record.draftStatus,
                    receivedDate: record.receivedDate,
                    otherComments: record.otherComments
                  };

                  return (
                    <React.Fragment key={recordId}>
                      <tr>
                        <td>{record.name}</td>
                        <td className="d-none d-md-table-cell">
                          {record.mobile ? (
                            <button className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => { setDialNumber(record.mobile); setIsDialerOpen(true); }}>
                              📞 {record.mobile}
                            </button>
                          ) : 'N/A'}
                        </td>
                        <td><span className={getStatusBadgeClass(record.status)}>{record.status || 'Unknown'}</span></td>
                        <td style={record.status === 'Completed' ? {} : getDueDateStyle(record.dueDate)}>
                          {record.status === 'Completed' ? 'N/A' : (record.dueDate ? getRawDateString(record.dueDate) : 'N/A')}
                        </td>
                        <td className="d-none d-md-table-cell">
                          <select
                            className="form-select form-select-sm"
                            value={record.assignedTo || ''}
                            disabled={savingId === recordId}
                            onChange={(e) => handleAssignedToChange(record, e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {assignedToOptions.map((email) => (
                              <option key={email} value={email}>
                                {email}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-boundary="window">
                              Actions
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <button className="dropdown-item" onClick={() => handleRowExpand(recordId, record)}>
                                  {expandedId === recordId ? 'Collapse Details' : '✏️ Edit Details'}
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => navigate('/esign-request', { state: { customerId: recordId, clientName: record.name, clientEmail: record.email, taxType: 'Personal' } })}>
                                  ✍️ Request eSign
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => fetchEsignDetails(record)}>
                                  📊 eSign Details
                                </button>
                              </li>

                              <li>

                                <button className="dropdown-item" onClick={() => setEmailModalConfig({ customer: record, action: 'requestDocument', taxType: 'Personal' })}>

                                  📂 Request Document

                                </button>

                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                      {expandedId === recordId && (
                        <tr className="table-secondary">
                          <td colSpan="6">
                            {renderPersonalExpandedForm(record, recordId, rowEdit)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {sortedData.length === 0 && !loading && (
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
          </div>
        </>
      ) : (
        <div className="alert alert-info">
          Please sign in with your Oriental Biz account to view the customer table.
        </div>
      )}

      <ESignDetailsModal details={eSignDetails} onClose={() => setESignDetails(null)} />

    </TaxPortalLayout>
  );
};

export default PersonalTaxDataPage;
