import React, { useEffect, useMemo, useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import DataPageHeader from '../components/Common/DataPageHeader';
import { msalConfig, loginRequest, getApiUrl, getRawDateString, getUsersEmail, isAdminRole } from '../authConfig';
import EmailDraftModal from '../components/Common/EmailDraftModal';

import * as XLSX from 'xlsx';

const assignedToOptions = getUsersEmail();

const statusOptions = ['Open', 'Pending', 'Review', 'Draft Sent', 'eSigned', 'Payment Pending', 'Completed'];
const hstPeriodOptions = ['Monthly', 'Quarterly', 'Annually'];
const paymentStatusOptions = ['Unpaid', 'Paid', 'Partially Paid'];
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

const initialCorporateCustomer = {
  businessName: '',
  contactName: '',
  businessNumber: '',
  address: '',
  email: '',
  yearEnd: '',
  todoList: '',
  details: '',
  mobile: '',
  dateFiled: '',
  corporateIncomeTax: '',
  status: 'Pending',
  invoiceAmount: '',
  invoiceStatus: '',
  paymentStatus: '',
  notes: '',
  payrollStatus: '',
  payrollAccount: '',
  payrollDateFiled: '',
  payrollAvailable: 'No',
  payrollDueDate: '',
  hstPeriod: '',
  hstDueDate: '',
  hstStatus: '',
  hstDateFiled: '',
  hstInvoiceStatus: '',
  hstNotes: '',
  hstAvailable: 'No',
  assignedTo: '',
  dueDate: '',
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
      return { backgroundColor: '#fff3cd', fontWeight: 'bold' };
    }
    if (dueDateStr < todayStr) {
      return { backgroundColor: '#f8d7da', fontWeight: 'bold' };
    }
  } catch {
    return {};
  }
  return {};
};

const compareDueDates = (a, b, key = 'dueDate') => {
  const aDate = a[key];
  const bDate = b[key];

  if (!aDate && !bDate) return 0;
  if (!aDate) return 1;
  if (!bDate) return -1;

  const parsedA = new Date(aDate);
  const parsedB = new Date(bDate);
  if (isNaN(parsedA.getTime()) || isNaN(parsedB.getTime())) return 0;

  return parsedA.getTime() - parsedB.getTime();
};

const CorporateTaxDataPage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [account, setAccount] = useState(null);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [sortKey, setSortKey] = useState('assignedTo');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('nonCompleted');
  const [filterDueDate, setFilterDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [newRecord, setNewRecord] = useState(initialCorporateCustomer);
  const [editValues, setEditValues] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [pageIndex, setPageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('Summary'); // 'Summary', 'HST Filing', 'Payroll'
  const [emailModalConfig, setEmailModalConfig] = useState(null);

  const msalInstance = useMemo(() => new PublicClientApplication(msalConfig), []);

  useEffect(() => {
    let mounted = true;

    const initializeMsal = async () => {
      try {
        if (typeof msalInstance.initialize === 'function') {
          await msalInstance.initialize();
        }

        const response = await msalInstance.handleRedirectPromise();
        if (!mounted) return;

        if (response && response.account) {
          setAccount(response.account);
        } else {
          const currentAccounts = msalInstance.getAllAccounts();
          if (currentAccounts.length > 0) {
            setAccount(currentAccounts[0]);
          }
        }
      } catch (err) {
        console.error('MSAL Initialization Error:', err);
        if (mounted) setError('Authentication initialization failed.');
      } finally {
        if (mounted) setIsInitialized(true);
      }
    };

    initializeMsal();
    return () => {
      mounted = false;
    };
  }, [msalInstance]);

  useEffect(() => {
    if (account) {
      fetchRecords();
    }
  }, [account]);

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const response = await fetch(getApiUrl('/api/corporate'), {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load corporate customer data.');
      }
      const data = await response.json();
      setRecords(data || []);
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
      setError('Please configure REACT_APP_MSAL_CLIENT_ID in your .env file.');
      return;
    }

    try {
      await msalInstance.loginRedirect(loginRequest);
    } catch (loginError) {
      console.error(loginError);
      setError(loginError.message || 'Microsoft sign-in failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await msalInstance.logoutRedirect({ account });
    } catch (logoutError) {
      console.error(logoutError);
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

  const handleAddRecord = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!newRecord.businessName || !newRecord.mobile) {
      setError('Business name and mobile number are required.');
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateString = dueDate.toISOString().split('T')[0];

    const payload = {
      ...newRecord,
      dueDate: dueDateString,
      updatedBy: account?.username || account?.name || 'Unknown',
    };

    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const response = await fetch(getApiUrl('/api/corporate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Unable to add corporate record.');
      }

      const created = await response.json();
      setRecords((prev) => [created, ...prev]);
      setNewRecord(initialCorporateCustomer);
      setShowAddModal(false);
      setMessage('Corporate record added successfully.');
    } catch (saveError) {
      console.error(saveError);
      setError('Could not verify your session. Please sign in again.');
    }
  };

  const handleUpdateRecord = async (record) => {
    const id = getId(record);
    const currentEdit = editValues[id] || {};
    const status = currentEdit.status || record.status;
    const updates = {
      businessName: currentEdit.businessName ?? record.businessName,
      contactName: currentEdit.contactName ?? record.contactName,
      businessNumber: currentEdit.businessNumber ?? record.businessNumber,
      address: currentEdit.address ?? record.address,
      email: currentEdit.email ?? record.email,
      yearEnd: currentEdit.yearEnd ?? record.yearEnd,
      todoList: currentEdit.todoList ?? record.todoList,
      details: currentEdit.details ?? record.details,
      mobile: currentEdit.mobile ?? record.mobile,
      dateFiled: currentEdit.dateFiled ?? record.dateFiled,
      corporateIncomeTax: currentEdit.corporateIncomeTax ?? record.corporateIncomeTax,
      status: status,
      invoiceAmount: currentEdit.invoiceAmount ?? record.invoiceAmount,
      invoiceStatus: currentEdit.invoiceStatus ?? record.invoiceStatus,
      paymentStatus: currentEdit.paymentStatus ?? record.paymentStatus,
      notes: status === 'Completed' ? '' : currentEdit.notes ?? record.notes,
      payrollStatus: currentEdit.payrollStatus ?? record.payrollStatus,
      payrollAccount: currentEdit.payrollAccount ?? record.payrollAccount,
      payrollDateFiled: currentEdit.payrollDateFiled ?? record.payrollDateFiled,
      payrollAvailable: currentEdit.payrollAvailable ?? record.payrollAvailable,
      payrollDueDate: currentEdit.payrollDueDate ?? record.payrollDueDate,
      hstPeriod: currentEdit.hstPeriod ?? record.hstPeriod,
      hstDueDate: currentEdit.hstDueDate ?? record.hstDueDate,
      hstStatus: currentEdit.hstStatus ?? record.hstStatus,
      hstDateFiled: currentEdit.hstDateFiled ?? record.hstDateFiled,
      hstInvoiceStatus: currentEdit.hstInvoiceStatus ?? record.hstInvoiceStatus,
      hstNotes: currentEdit.hstNotes ?? record.hstNotes,
      hstAvailable: currentEdit.hstAvailable ?? record.hstAvailable,
      assignedTo: currentEdit.assignedTo ?? record.assignedTo,
      dueDate: currentEdit.dueDate ?? record.dueDate,
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

      const response = await fetch(getApiUrl(`/api/corporate/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Unable to update corporate record.');
      }

      const updated = await response.json();
      setRecords((prev) => prev.map((item) => (getId(item) === id ? updated : item)));
      setMessage('Corporate record updated.');
    } catch (updateError) {
      console.error(updateError);
      setError('Could not verify your session. Please sign in again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }

    const id = getId(record);
    setSavingId(id);
    setError('');
    setMessage('');

    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const response = await fetch(getApiUrl(`/api/corporate/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Unable to delete corporate record.');
      }

      setRecords((prev) => prev.filter((item) => getId(item) !== id));
      setExpandedId(null);
      setMessage('Corporate record deleted.');
    } catch (deleteError) {
      console.error(deleteError);
      setError('Could not verify your session or delete record. Please sign in again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleAssignedToChange = async (record, assignedTo) => {
    const id = getId(record);
    setSavingId(id);
    setError('');
    setMessage('');

    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const response = await fetch(getApiUrl(`/api/corporate/${id}`), {
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
      setRecords((prev) => prev.map((item) => (getId(item) === id ? updated : item)));
      setMessage('Assignment updated.');
    } catch (updateError) {
      console.error(updateError);
      setError('Could not verify your session. Please sign in again.');
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
        businessName: record.businessName || '',
        contactName: record.contactName || '',
        businessNumber: record.businessNumber || '',
        address: record.address || '',
        email: record.email || '',
        yearEnd: record.yearEnd || '',
        todoList: record.todoList || '',
        details: record.details || '',
        mobile: record.mobile || '',
        dateFiled: record.dateFiled || '',
        corporateIncomeTax: record.corporateIncomeTax || '',
        status: status,
        invoiceAmount: record.invoiceAmount || '',
        invoiceStatus: record.invoiceStatus || '',
        paymentStatus: record.paymentStatus || '',
        notes: status === 'Completed' ? '' : record.notes || '',
        payrollStatus: record.payrollStatus || '',
        payrollAccount: record.payrollAccount || '',
        payrollDateFiled: record.payrollDateFiled || '',
        payrollAvailable: record.payrollAvailable || 'No',
        payrollDueDate: record.payrollDueDate || '',
        hstPeriod: record.hstPeriod || '',
        hstDueDate: record.hstDueDate || '',
        hstStatus: record.hstStatus || '',
        hstDateFiled: record.hstDateFiled || '',
        hstInvoiceStatus: record.hstInvoiceStatus || '',
        hstNotes: record.hstNotes || '',
        hstAvailable: record.hstAvailable || 'No',
        assignedTo: record.assignedTo || '',
        dueDate: record.dueDate || '',
      },
    }));
  };

  const isAdmin = isAdminRole(account?.username);

  const renderHSTDetails = (record, recordId, hideButtons) => {
    const buttonsClass = hideButtons ? 'd-none' : '';
      return (
        <div className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Edit HST Filing Details</h6>
            <div className={`d-flex gap-2 ${buttonsClass}`}>
              <button
                className="btn btn-success btn-sm"
                onClick={() => handleUpdateRecord(record)}
                disabled={savingId === recordId}
              >
                {savingId === recordId ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Business Name</label>
              <input
                className="form-control"
                value={editValues[recordId]?.businessName || ''}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [recordId]: { ...prev[recordId], businessName: e.target.value } }))
                }
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">HST Period</label>
              <select
                className="form-control"
                value={editValues[recordId]?.hstPeriod || ''}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [recordId]: { ...prev[recordId], hstPeriod: e.target.value } }))
                }
              >
                {hstPeriodOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">HST Due Date</label>
              <input
                type="date"
                className="form-control"
                value={getRawDateString(editValues[recordId]?.hstDueDate)}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [recordId]: { ...prev[recordId], hstDueDate: e.target.value } }))
                }
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">HST Status</label>
              <select
                className="form-control"
                value={editValues[recordId]?.hstStatus || ''}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [recordId]: { ...prev[recordId], hstStatus: e.target.value } }))
                }
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">HST Date Filed</label>
              <input
                type="date"
                className="form-control"
                value={getRawDateString(editValues[recordId]?.hstDateFiled)}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [recordId]: { ...prev[recordId], hstDateFiled: e.target.value } }))
                }
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">HST Invoice Status</label>
              <select
                className="form-control"
                value={editValues[recordId]?.hstInvoiceStatus || ''}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [recordId]: { ...prev[recordId], hstInvoiceStatus: e.target.value } }))
                }
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-12">
              <label className="form-label">HST Notes</label>
              <textarea
                className="form-control"
                rows="2"
                value={editValues[recordId]?.hstNotes || ''}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [recordId]: { ...prev[recordId], hstNotes: e.target.value } }))
                }
              />
            </div>
          </div>
        </div>
      );
  };

  const renderPayrollDetails = (record, recordId, hideButtons) => {
    const buttonsClass = hideButtons ? 'd-none' : '';
        return (
        <div className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Edit Payroll Details</h6>
            <div className={`d-flex gap-2 ${buttonsClass}`}>
              <button
                className="btn btn-success btn-sm"
                onClick={() => handleUpdateRecord(record)}
                disabled={savingId === recordId}
              >
                {savingId === recordId ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Business Name</label>
              <input
                className="form-control"
                value={editValues[recordId]?.businessName || ''}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [recordId]: { ...prev[recordId], businessName: e.target.value } }))
                }
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Payroll Status</label>
              <select
                className="form-control"
                value={editValues[recordId]?.payrollStatus || ''}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [recordId]: { ...prev[recordId], payrollStatus: e.target.value } }))
                }
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Payroll Account</label>
              <input
                className="form-control"
                value={editValues[recordId]?.payrollAccount || ''}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [recordId]: { ...prev[recordId], payrollAccount: e.target.value } }))
                }
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Payroll Date Filed</label>
              <input
                type="date"
                className="form-control"
                value={getRawDateString(editValues[recordId]?.payrollDateFiled)}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [recordId]: { ...prev[recordId], payrollDateFiled: e.target.value } }))
                }
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Payroll Due Date</label>
              <input
                type="date"
                className="form-control"
                value={getRawDateString(editValues[recordId]?.payrollDueDate)}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [recordId]: { ...prev[recordId], payrollDueDate: e.target.value } }))
                }
              />
            </div>
          </div>
        </div>
      );
  };

  const renderSummaryDetails = (record, recordId) => {
        return (
      <div className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Edit Record Details</h6>
          <div className="d-flex gap-2">
            {isAdmin && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteRecord(record)}
                disabled={savingId === recordId}
              >
                Delete
              </button>
            )}
            <button
              className="btn btn-success btn-sm"
              onClick={() => handleUpdateRecord(record)}
              disabled={savingId === recordId}
            >
              {savingId === recordId ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={editValues[recordId]?.status || ''}
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
          <div className="col-md-4">
            <label className="form-label">Assigned To</label>
            <select
              className="form-select"
              value={editValues[recordId]?.assignedTo || ''}
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
          <div className="col-md-4">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-control"
              value={getRawDateString(editValues[recordId]?.dueDate)}
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
          <div className="col-md-4">
            <label className="form-label">Payroll Available</label>
            <select
              className="form-select"
              value={editValues[recordId]?.payrollAvailable || 'No'}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [recordId]: {
                    ...prev[recordId],
                    payrollAvailable: e.target.value,
                  },
                }))
              }
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">HST Available</label>
            <select
              className="form-select"
              value={editValues[recordId]?.hstAvailable || 'No'}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [recordId]: {
                    ...prev[recordId],
                    hstAvailable: e.target.value,
                  },
                }))
              }
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className="col-md-12">
            <label className="form-label">To Do List</label>
            <textarea
              className="form-control"
              rows="2"
              value={editValues[recordId]?.todoList || ''}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [recordId]: {
                    ...prev[recordId],
                    todoList: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Business Name</label>
            <input
              className="form-control"
              value={editValues[recordId]?.businessName || ''}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [recordId]: {
                    ...prev[recordId],
                    businessName: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Contact Name</label>
            <input
              className="form-control"
              value={editValues[recordId]?.contactName || ''}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [recordId]: {
                    ...prev[recordId],
                    contactName: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Business Number</label>
            <input
              className="form-control"
              value={editValues[recordId]?.businessNumber || ''}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [recordId]: {
                    ...prev[recordId],
                    businessNumber: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Mobile</label>
            <input
              type="tel"
              className="form-control"
              value={editValues[recordId]?.mobile || ''}
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
          <div className="col-md-4">
            <label className="form-label">Email</label>
            <input
              className="form-control"
              value={editValues[recordId]?.email || ''}
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
          <div className="col-md-4">
            <label className="form-label">Year End</label>
            <input
              className="form-control"
              value={editValues[recordId]?.yearEnd || ''}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [recordId]: {
                    ...prev[recordId],
                    yearEnd: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Date Filed</label>
            <input
              type="date"
              className="form-control"
              value={getRawDateString(editValues[recordId]?.dateFiled)}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [recordId]: {
                    ...prev[recordId],
                    dateFiled: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Corporate Income Tax</label>
            <input
              className="form-control"
              value={editValues[recordId]?.corporateIncomeTax || ''}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [recordId]: {
                    ...prev[recordId],
                    corporateIncomeTax: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Invoice Amount</label>
            <input
              className="form-control"
              value={editValues[recordId]?.invoiceAmount || ''}
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
          <div className="col-md-4">
            <label className="form-label">Invoice Status</label>
            <input
              className="form-control"
              value={editValues[recordId]?.invoiceStatus || ''}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [recordId]: {
                    ...prev[recordId],
                    invoiceStatus: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Payment Status</label>
            <select
              className="form-control"
              value={editValues[recordId]?.paymentStatus || ''}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [recordId]: {
                    ...prev[recordId],
                    paymentStatus: e.target.value,
                  },
                }))
              }
            >
              {paymentStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-12">
            <label className="form-label">Address</label>
            <input
              className="form-control"
              value={editValues[recordId]?.address || ''}
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
          <div className="col-md-12">
            <label className="form-label">Details</label>
            <textarea
              className="form-control"
              rows="2"
              value={editValues[recordId]?.details || ''}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [recordId]: {
                    ...prev[recordId],
                    details: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="col-md-12">
            <label className="form-label">Notes</label>
            <textarea
              className="form-control"
              rows="2"
              value={editValues[recordId]?.notes || ''}
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
        </div>
        <div className="text-end mt-3 d-flex gap-2 justify-content-end">
          <button
            className="btn btn-success"
            onClick={() => handleUpdateRecord(record)}
            disabled={savingId === recordId}
          >
            {savingId === recordId ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  };

  const renderCorporateExpandedForm = (record, recordId) => {

    if (activeTab === 'HST Filing') {
      return renderHSTDetails(record, recordId);
    }
    if (activeTab === 'Payroll') {
      return renderPayrollDetails(record, recordId);
    }
    const hstAvailable = editValues[recordId]?.hstAvailable === 'Yes' || record.hstAvailable === 'Yes' || false;
    const payrollAvailable = editValues[recordId]?.payrollAvailable === 'Yes' || record.payrollAvailable === 'Yes'  || false;
    return (
      <>
        {renderSummaryDetails(record, recordId)}
        {hstAvailable && renderHSTDetails(record, recordId, true)}
        {payrollAvailable && renderPayrollDetails(record, recordId, true)}
      </>
    );
  };

  const handleOpenAddModal = () => {
    setError('');
    setMessage('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setNewRecord(initialCorporateCustomer);
  };

  const filteredData = records.filter((record) => {
    let assignedMatch = filterAssignedTo ? record.assignedTo === filterAssignedTo : true;
    let rawValue = '';
    let tabSpecificMatch = true;
    let dueDateMatch = filterDueDate ? record.dueDate === filterDueDate : true;
    const statusMatch = filterStatus === 'nonCompleted'
      ? record.status !== 'Completed'
      : filterStatus
        ? record.status === filterStatus
        : true;
    const currentUser = account?.username?.toLowerCase();
    if (currentUser && !isAdminRole(currentUser)) {
      assignedMatch = record.assignedTo?.toLowerCase() === currentUser;
    }
    if (activeTab === 'Summary') {
      rawValue = `${record.businessName} ${record.contactName} ${record.businessNumber} ${record.mobile} ${record.status} ${record.assignedTo} ${record.details} ${record.notes}`.toLowerCase();
    } else if (activeTab === 'HST Filing') {
      rawValue = `${record.businessName} ${record.contactName} ${record.businessNumber} ${record.hstStatus} ${record.assignedTo} ${record.hstNotes}`.toLowerCase();
      tabSpecificMatch = record.hstAvailable === 'Yes';
      dueDateMatch = filterDueDate ? record.hstDueDate === filterDueDate : true;
    } else {
      rawValue = `${record.businessName} ${record.contactName} ${record.businessNumber} ${record.payrollStatus} ${record.assignedTo}`.toLowerCase();
      tabSpecificMatch = record.payrollAvailable === 'Yes';
      dueDateMatch = filterDueDate ? record.payrollDueDate === filterDueDate : true;
    }
    return statusMatch && assignedMatch && tabSpecificMatch && dueDateMatch && rawValue.includes(searchText.toLowerCase());
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const currentUser = account?.username?.toLowerCase();
    const aAssignedMatch = currentUser && a.assignedTo?.toLowerCase() === currentUser ? 0 : 1;
    const bAssignedMatch = currentUser && b.assignedTo?.toLowerCase() === currentUser ? 0 : 1;
    if (aAssignedMatch !== bAssignedMatch) {
      return aAssignedMatch - bAssignedMatch;
    }

    if (sortKey === 'dueDate' || sortKey === 'hstDueDate' || sortKey === 'payrollDueDate' || sortKey === 'payrollDateFiled') {
      const comparison = compareDueDates(a, b, sortKey);
      return sortAsc ? comparison : -comparison;
    }

    const aVal = typeof a[sortKey] === 'string' ? a[sortKey].toLowerCase() : a[sortKey] || '';
    const bVal = typeof b[sortKey] === 'string' ? b[sortKey].toLowerCase() : b[sortKey] || '';
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const pageData = sortedData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  useEffect(() => {
    setExpandedId(null);
    setPageIndex(0);
  }, [pageSize, filterAssignedTo, searchText, activeTab, records.length]);

  const handleExportToExcel = () => {
    const exportData = sortedData.map((record) => ({
      'Business Name': record.businessName || '',
      'Contact Name': record.contactName || '',
      'Business Number': record.businessNumber || '',
      'Mobile': record.mobile || '',
      'Email': record.email || '',
      'Address': record.address || '',
      'Status': record.status || '',
      'Due Date': record.dueDate ? getRawDateString(record.dueDate) : '',
      'Assigned To': record.assignedTo || '',
      'Year End': record.yearEnd || '',
      'Date Filed': record.dateFiled ? getRawDateString(record.dateFiled) : '',
      'Corporate Income Tax': record.corporateIncomeTax || '',
      'Invoice Amount': record.invoiceAmount || '',
      'Invoice Status': record.invoiceStatus || '',
      'Payment Status': record.paymentStatus || '',
      'Payroll Available': record.payrollAvailable || 'No',
      'Payroll Status': record.payrollStatus || '',
      'Payroll Account': record.payrollAccount || '',
      'Payroll Date Filed': record.payrollDateFiled ? getRawDateString(record.payrollDateFiled) : '',
      'Payroll Due Date': record.payrollDueDate ? getRawDateString(record.payrollDueDate) : '',
      'HST Available': record.hstAvailable || 'No',
      'HST Period': record.hstPeriod || '',
      'HST Status': record.hstStatus || '',
      'HST Due Date': record.hstDueDate ? getRawDateString(record.hstDueDate) : '',
      'HST Date Filed': record.hstDateFiled ? getRawDateString(record.hstDateFiled) : '',
      'HST Invoice Status': record.hstInvoiceStatus || '',
      'HST Notes': record.hstNotes || '',
      'Details': record.details || '',
      'To Do List': record.todoList || '',
      'Notes': record.notes || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Corporate Tax Data');
    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
    XLSX.writeFile(workbook, `Corporate_Tax_Data_${timestamp}.xlsx`);
  };

  return (
    <div className="container py-5 position-relative" style={{ minHeight: '100vh' }}>
      <DataPageHeader
        title="Corporate Tax"
        description="Use your Oriental Biz account to access corporate tax records."
        account={account}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

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
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <small className="text-muted">Corporate records</small>
                    <h4 className="mb-0">{records.length}</h4>
                  </div>
                  <span className="badge bg-primary">Live</span>
                </div>
                <p className="mb-0 text-muted">Current corporate customers available for review.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className="card data-summary-card h-100 p-3"
                style={{ cursor: 'pointer' }}
                onClick={() => setFilterAssignedTo(account?.username || '')}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <small className="text-muted">Assigned to me</small>
                    <h4 className="mb-0">{records.filter((item) => item.assignedTo === account?.username).length}</h4>
                  </div>
                  <span className="badge bg-info text-dark">My queue</span>
                </div>
                <p className="mb-0 text-muted">Records matched to your signed-in account.</p>
              </div>
            </div>
            <div className="col-md-4 d-flex align-items-end justify-content-end">
              <button className="btn btn-primary btn-lg px-4" onClick={handleOpenAddModal}>
                Add Corporate Record
              </button>
            </div>
          </div>

          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'Summary' ? 'active' : ''}`} onClick={() => setActiveTab('Summary')}>Summary</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'HST Filing' ? 'active' : ''}`} onClick={() => setActiveTab('HST Filing')}>HST Filing</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'Payroll' ? 'active' : ''}`} onClick={() => setActiveTab('Payroll')}>Payroll</button>
            </li>
          </ul>

          <div className="card data-summary-card mb-4 p-3">
            <div className="row g-3 align-items-center">
              <div className="col-md-5">
                <div className="input-group shadow-sm rounded-pill overflow-hidden">
                  <span className="input-group-text bg-white border-end-0">🔎</span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search business, contact, status..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="nonCompleted">Open / Incomplete</option>
                  <option value="">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <div className="input-group shadow-sm rounded-pill overflow-hidden">
                  <span className="input-group-text bg-white border-end-0">👤</span>
                  <select
                    className="form-select border-start-0"
                    value={filterAssignedTo}
                    onChange={(e) => setFilterAssignedTo(e.target.value)}
                  >
                    <option value="">All assignees</option>
                    {assignedToOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <select className="form-select" value={filterDueDate} onChange={(e) => setFilterDueDate(e.target.value)}>
                  <option value="">Upcoming Dues</option>
                  {dueDateOptions.map((date) => (
                    <option key={date} value={date}>
                      {getRawDateString(date)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <select className="form-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}>
                  <option value={25}>25 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
              <div className="col-md-2 text-md-end d-flex gap-2 justify-content-end">
                <button className="btn btn-outline-success" onClick={handleExportToExcel}>
                  Export
                </button>
                <button className="btn btn-outline-primary" onClick={fetchRecords} disabled={loading}>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

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
                  <p className="mb-0 text-muted">No corporate records found.</p>
                </div>
              </div>
            ) : (
              pageData.map((record) => {
                const recordId = getId(record);
                return (
                  <div key={recordId} className="card mb-3 mobile-record-card shadow-sm">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="mb-1">{record.businessName}</h5>
                          {activeTab === 'Summary' && <div className="small text-muted">{record.mobile || 'No mobile'}</div>}
                        </div>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          type="button"
                          onClick={() => handleRowExpand(recordId, record)}
                        >
                          {expandedId === recordId ? 'Hide' : 'Details'}
                        </button>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          <span className={getStatusBadgeClass(
                            activeTab === 'HST Filing' ? record.hstStatus :
                              activeTab === 'Payroll' ? record.payrollStatus : record.status
                          )}>
                            {activeTab === 'HST Filing' ? (record.hstStatus || 'Unknown') :
                              activeTab === 'Payroll' ? (record.payrollStatus || 'Unknown') :
                                (record.status || 'Unknown')}
                          </span>
                        </div>
                        <div>
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
                      </div>
                      {expandedId === recordId && (
                        <div className="bg-light rounded-3 p-3">
                          {renderCorporateExpandedForm(record, recordId)}
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
                <col style={{ width: '28%' }} />
                <col style={{ width: '14%' }} />
                {activeTab === 'Summary' && <col style={{ width: '14%' }} />}
                <col style={{ width: activeTab === 'Summary' ? '12%' : '14%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: activeTab === 'Summary' ? '18%' : '16%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead>
                <tr className="text-muted small text-uppercase">
                  <th onClick={() => handleSort('businessName')} style={{ cursor: 'pointer' }}>
                    Business Name
                  </th>
                  <th className="d-none d-md-table-cell" onClick={() => handleSort('contactName')} style={{ cursor: 'pointer' }}>
                    Contact Name
                  </th>
                  {activeTab === 'Summary' && (
                    <th className="d-none d-md-table-cell" onClick={() => handleSort('mobile')} style={{ cursor: 'pointer' }}>
                      Mobile
                    </th>
                  )}
                  <th onClick={() => handleSort(activeTab === 'HST Filing' ? 'hstStatus' : activeTab === 'Payroll' ? 'payrollStatus' : 'status')} style={{ cursor: 'pointer' }}>
                    Status
                  </th>
                  <th onClick={() => handleSort('assignedTo')} style={{ cursor: 'pointer' }}>
                    Assigned To
                  </th>
                  <th className="d-none d-md-table-cell" onClick={() => handleSort(activeTab === 'HST Filing' ? 'hstDueDate' : activeTab === 'Payroll' ? 'payrollDueDate' : 'dueDate')} style={{ cursor: 'pointer' }}>
                    Due Date
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={activeTab === 'Summary' ? "7" : "6"} className="text-center py-4">
                      No corporate records found.
                    </td>
                  </tr>
                ) : (
                  pageData.map((record) => {
                    const recordId = getId(record);

                    let statusField = record.status;
                    let dueDateField = record.dueDate;
                    if (activeTab === 'HST Filing') {
                      statusField = record.hstStatus;
                      dueDateField = record.hstDueDate;
                    } else if (activeTab === 'Payroll') {
                      statusField = record.payrollStatus;
                      dueDateField = record.payrollDueDate;
                    }

                    return (
                      <React.Fragment key={recordId}>
                        <tr>
                          <td>
                            <div>{record.businessName}</div>
                            {record.businessNumber && (
                              <div className="text-muted small">Business No: {record.businessNumber}</div>
                            )}
                          </td>
                          <td className="d-none d-md-table-cell">{record.contactName}</td>

                          {activeTab === 'Summary' && (
                            <td className="d-none d-md-table-cell">{record.mobile}</td>
                          )}

                          <td><span className={getStatusBadgeClass(statusField)}>{statusField || 'Unknown'}</span></td>
                          <td>
                            <select
                              className="form-select"
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
                          <td className="d-none d-md-table-cell" style={getDueDateStyle(dueDateField)}>
                            {getRawDateString(dueDateField)}
                          </td>
                          <td>
                            <div className="dropdown">
                              <button
                                className="btn btn-sm btn-outline-primary dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                data-bs-boundary="window"
                              >
                                Actions
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleRowExpand(recordId, record)}
                                  >
                                    {expandedId === recordId ? 'Hide' : '✏️ Edit Details'}
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => setEmailModalConfig({ customer: record, action: 'requestDocument', taxType: 'Corporate' })}
                                  >
                                    📂 Request Document
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                        {expandedId === recordId && (
                          <tr className="table-secondary">
                            <td colSpan={activeTab === 'Summary' ? "7" : "6"}>
                              {renderCorporateExpandedForm(record, recordId)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
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

          {showAddModal && (
            <div
              className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1050 }}
              onClick={handleCloseAddModal}
            >
              <div
                className="bg-white rounded shadow-lg p-4"
                style={{ width: '95%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0">Add Corporate Customer</h4>
                  <button className="btn btn-sm btn-outline-secondary" onClick={handleCloseAddModal}>
                    Close
                  </button>
                </div>
                <form onSubmit={handleAddRecord}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Business Name</label>
                      <input
                        className="form-control"
                        value={newRecord.businessName}
                        onChange={(e) => setNewRecord({ ...newRecord, businessName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Contact Name</label>
                      <input
                        className="form-control"
                        value={newRecord.contactName}
                        onChange={(e) => setNewRecord({ ...newRecord, contactName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Business Number</label>
                      <input
                        className="form-control"
                        value={newRecord.businessNumber}
                        onChange={(e) => setNewRecord({ ...newRecord, businessNumber: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Mobile</label>
                      <input
                        className="form-control"
                        value={newRecord.mobile}
                        onChange={(e) => setNewRecord({ ...newRecord, mobile: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        className="form-control"
                        value={newRecord.email}
                        onChange={(e) => setNewRecord({ ...newRecord, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Year End</label>
                      <input
                        className="form-control"
                        value={newRecord.yearEnd}
                        onChange={(e) => setNewRecord({ ...newRecord, yearEnd: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Date Filed</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newRecord.dateFiled}
                        onChange={(e) => setNewRecord({ ...newRecord, dateFiled: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Corporate Income Tax</label>
                      <input
                        className="form-control"
                        value={newRecord.corporateIncomeTax}
                        onChange={(e) => setNewRecord({ ...newRecord, corporateIncomeTax: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Invoice Amount</label>
                      <input
                        className="form-control"
                        value={newRecord.invoiceAmount}
                        onChange={(e) => setNewRecord({ ...newRecord, invoiceAmount: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Invoice Status</label>
                      <input
                        className="form-control"
                        value={newRecord.invoiceStatus}
                        onChange={(e) => setNewRecord({ ...newRecord, invoiceStatus: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Payment Status</label>
                      <input
                        className="form-control"
                        value={newRecord.paymentStatus}
                        onChange={(e) => setNewRecord({ ...newRecord, paymentStatus: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Assigned To</label>
                      <select
                        className="form-select"
                        value={newRecord.assignedTo}
                        onChange={(e) => setNewRecord({ ...newRecord, assignedTo: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {assignedToOptions.map((email) => (
                          <option key={email} value={email}>
                            {email}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Payroll Fields */}
                    <div className="col-md-6">
                      <label className="form-label">Payroll Status</label>
                      <input
                        className="form-control"
                        value={newRecord.payrollStatus}
                        onChange={(e) => setNewRecord({ ...newRecord, payrollStatus: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Payroll Account</label>
                      <input
                        className="form-control"
                        value={newRecord.payrollAccount}
                        onChange={(e) => setNewRecord({ ...newRecord, payrollAccount: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Payroll Date Filed</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newRecord.payrollDateFiled}
                        onChange={(e) => setNewRecord({ ...newRecord, payrollDateFiled: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Payroll Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newRecord.payrollDueDate}
                        onChange={(e) => setNewRecord({ ...newRecord, payrollDueDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Payroll Available</label>
                      <select
                        className="form-select"
                        value={newRecord.payrollAvailable}
                        onChange={(e) => setNewRecord({ ...newRecord, payrollAvailable: e.target.value })}
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    {/* HST Fields */}
                    <div className="col-md-6">
                      <label className="form-label">HST Period</label>
                      <input
                        className="form-control"
                        value={newRecord.hstPeriod}
                        onChange={(e) => setNewRecord({ ...newRecord, hstPeriod: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">HST Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newRecord.hstDueDate}
                        onChange={(e) => setNewRecord({ ...newRecord, hstDueDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">HST Status</label>
                      <input
                        className="form-control"
                        value={newRecord.hstStatus}
                        onChange={(e) => setNewRecord({ ...newRecord, hstStatus: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">HST Date Filed</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newRecord.hstDateFiled}
                        onChange={(e) => setNewRecord({ ...newRecord, hstDateFiled: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">HST Invoice Status</label>
                      <input
                        className="form-control"
                        value={newRecord.hstInvoiceStatus}
                        onChange={(e) => setNewRecord({ ...newRecord, hstInvoiceStatus: e.target.value })}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">HST Notes</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={newRecord.hstNotes}
                        onChange={(e) => setNewRecord({ ...newRecord, hstNotes: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">HST Available</label>
                      <select
                        className="form-select"
                        value={newRecord.hstAvailable}
                        onChange={(e) => setNewRecord({ ...newRecord, hstAvailable: e.target.value })}
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="col-md-12">
                      <label className="form-label">Address</label>
                      <input
                        className="form-control"
                        value={newRecord.address}
                        onChange={(e) => setNewRecord({ ...newRecord, address: e.target.value })}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Details</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={newRecord.details}
                        onChange={(e) => setNewRecord({ ...newRecord, details: e.target.value })}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">To Do List</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={newRecord.todoList}
                        onChange={(e) => setNewRecord({ ...newRecord, todoList: e.target.value })}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={newRecord.notes}
                        onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button className="btn btn-secondary" type="button" onClick={handleCloseAddModal}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit">
                      Save Corporate Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="alert alert-info">Please sign in with your Oriental Biz account to view the corporate customer portal.</div>
      )}

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

export default CorporateTaxDataPage;
