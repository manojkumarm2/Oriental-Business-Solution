import React, { useEffect, useMemo, useState, useRef } from 'react';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { CallClient } from '@azure/communication-calling';
import { PublicClientApplication } from '@azure/msal-browser';
import DataPageHeader from '../components/Common/DataPageHeader';
import { msalConfig, loginRequest, getApiUrl } from '../authConfig';

const CvitpPage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // --- CVITP TAX CLINIC DATABASE STATE ---
  const [taxEntries, setTaxEntries] = useState([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  
  const [newCustomer, setNewCustomer] = useState({
    name: '', mobile: '', status: 'Pending', assignedTo: '', coin: '', receivedDate: '', filledDate: ''
  });

  const msalInstance = useMemo(() => new PublicClientApplication(msalConfig), []);

  // Parse valid user emails from env for dropdown selections safely
  const agentEmails = useMemo(() => {
    const rawEnv = process.env.REACT_APP_USER_EMAILS || '';
    return rawEnv.split(',').map(email => email.trim()).filter(Boolean);
  }, []);

  // --- PERSISTENT DB DIALPAD & HISTORY TERMINAL STATE ---
  const [dialNumber, setDialNumber] = useState("+1");
  const [calling, setCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const [callHistory, setCallHistory] = useState([]); 
  const [showAllHistory, setShowAllHistory] = useState(false); 
  const [incomingCall, setIncomingCall] = useState(null);
  
  const callAgentRef = useRef(null);
  const callRef = useRef(null);
  const ringtoneRef = useRef(null);
  const timerRef = useRef(null);
  const syncTimerRef = useRef(null);

  // --- 🔟 AUTOMATED 10-DIGIT LOOKUP TRANSLATOR KEY ---
  const taxpayerPhoneMap = useMemo(() => {
    const map = {};
    taxEntries.forEach(entry => {
      if (entry.mobile) {
        // Strip out country codes, brackets, dashes to capture raw tail-end integers
        const digitsOnly = entry.mobile.replace(/[^0-9]/g, "");
        if (digitsOnly.length >= 10) {
          const tenDigitKey = digitsOnly.slice(-10);
          map[tenDigitKey] = entry.name;
        }
      }
    });
    return map;
  }, [taxEntries]);

  // Helper utility function to translate a history entry number to a client display name
  const resolveCallerIdentity = (rawNumber) => {
    if (!rawNumber) return "Unknown Caller";
    const cleanDigits = rawNumber.replace(/[^0-9]/g, "");
    if (cleanDigits.length >= 10) {
      const tenDigitKey = cleanDigits.slice(-10);
      if (taxpayerPhoneMap[tenDigitKey]) {
        return taxpayerPhoneMap[tenDigitKey]; // Match verified successfully!
      }
    }
    return rawNumber; // Fallback to displaying raw string index if unmapped
  };

  // Computed slice for the communications sub-card layout view
  const displayedHistory = useMemo(() => {
    if (showAllHistory) return callHistory;
    return callHistory.slice(0, 5);
  }, [callHistory, showAllHistory]);

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

      const historyResponse = await fetch(getApiUrl('/api/cvitp/call-history'), {
        headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
      });
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setCallHistory(historyData);
      }
    } catch (err) {
      console.error("Error collecting CVITP datasets:", err);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleLogCallToDatabase = async (number, type, status, customTime = null) => {
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
      const payload = {
        number,
        type,
        status,
        time: customTime || new Date().toLocaleString()
      };
      
      await fetch(getApiUrl('/api/cvitp/call-history'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenResponse.accessToken}`
        },
        body: JSON.stringify(payload)
      });
      
      const historyResponse = await fetch(getApiUrl('/api/cvitp/call-history'), {
        headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
      });
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setCallHistory(historyData);
      }
    } catch (e) {
      console.warn("Database logging failed:", e);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingEntryId(null);
    setNewCustomer({ name: '', mobile: '', status: 'Pending', assignedTo: '', coin: '', receivedDate: '', filledDate: '' });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (entry) => {
    setIsEditMode(true);
    setEditingEntryId(entry.id);
    setNewCustomer({
      name: entry.name || '',
      mobile: entry.mobile || '',
      status: entry.status || 'Pending',
      assignedTo: entry.assignedTo || '',
      coin: entry.coin || '',
      receivedDate: entry.receivedDate || '',
      filledDate: entry.filledDate || ''
    });
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
      const endpoint = isEditMode ? `/api/cvitp/${editingEntryId}` : '/api/cvitp';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(getApiUrl(endpoint), {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenResponse.accessToken}`
        },
        body: JSON.stringify(newCustomer)
      });

      if (response.ok) {
        setMessage(isEditMode ? "CVITP Tax Record updated successfully." : "CVITP Tax Record generated successfully.");
        setShowAddModal(false);
        setNewCustomer({ name: '', mobile: '', status: 'Pending', assignedTo: '', coin: '', receivedDate: '', filledDate: '' });
        fetchCvitpEntries();
      } else {
        const data = await response.json();
        setError(data.message || "Operation failed execution.");
      }
    } catch (err) {
      setError("Network error processing customer records.");
    }
  };

  const exportToCSV = () => {
    if (taxEntries.length === 0) return;
    const headers = ["ID", "Name", "Mobile", "Status", "Assigned To", "Coin Reference", "Received Date", "Filed Date", "Created At"];
    const rows = taxEntries.map(entry => [
      entry.id, entry.name, entry.mobile, entry.status, entry.assignedTo, entry.coin, entry.receivedDate, entry.filledDate, entry.createdAt
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

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    ringtoneRef.current = new Audio('/ringing.mp3');
    ringtoneRef.current.loop = true;
  }, []);

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  const startTimer = () => {
    if (!timerRef.current) {
      timerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatDuration = (sec) => {
    return `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
  };

  const attachCallStateHandler = (call, number, type) => {
    if (!call) return;
    call.on('stateChanged', () => {
      setCallStatus("Call status: " + call.state);
      if (call.state === 'Connected') {
        startTimer();
        setIsOnHold(false);
      } else if (call.state === 'LocalHold') {
        setIsOnHold(true);
      } else if (call.state === 'Disconnected') {
        setCalling(false);
        stopTimer();
        setIsMuted(false);
        setIsOnHold(false);
        setIncomingCall(null);
        setCallStatus("");
        handleLogCallToDatabase(number, type, "Disconnected");
      }
    });
  };

  const handleCall = async () => {
    setCalling(true);
    setCallStatus("Connecting...");
    try {
      setCallDuration(0);
      const agent = callAgentRef.current;
      if (!agent) throw new Error("Call agent not ready");
      let number = dialNumber.startsWith("+") ? dialNumber : "+1" + dialNumber.replace(/[^0-9]/g, "");
      if (number.length < 10) throw new Error("Enter a valid phone number");
      const call = await agent.startCall(
        [{ phoneNumber: number }],
        { alternateCallerId: { phoneNumber: "+16478475477" } }
      );
      callRef.current = call;
      setCallStatus("Call started");
      handleLogCallToDatabase(number, "outgoing", "Started");
      attachCallStateHandler(call, number, "outgoing");
    } catch (err) {
      setCallStatus("Error: " + err.message);
      setCalling(false);
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    setCallStatus("Answering call...");
    stopRingtone();
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    try {
      setCallDuration(0);
      const activeCall = await incomingCall.accept();
      callRef.current = activeCall;
      setIncomingCall(null);
      setCalling(true);
      const callerId = incomingCall.callerInfo?.displayName || "Unknown";
      setCallStatus("Call connected");
      handleLogCallToDatabase(callerId, "incoming", "Connected");
      attachCallStateHandler(activeCall, callerId, "incoming");
    } catch (err) {
      setCallStatus("Error answering: " + err.message);
      setIncomingCall(null);
      setCalling(false);
    }
  };

  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    stopRingtone();
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    try {
      const activeCall = await incomingCall.accept();
      callRef.current = activeCall;
      setIncomingCall(null);
      if (activeCall.state === 'Connecting' || activeCall.state === 'Incoming') {
        await new Promise(resolve => setTimeout(resolve, 800)); 
      }
      if (callRef.current) {
         await callRef.current.hangUp({ forEveryone: true });
      }
    } catch (err) {
      console.error(err);
    }
    setCalling(false);
    setCallStatus("");
  };

  const handleHangUp = async () => {
    if (callRef.current) {
      try { await callRef.current.hangUp({ forEveryone: true }); } catch (err) { console.error(err); }
    }
    setCalling(false);
    setCallStatus("");
  };

  useEffect(() => {
    let disposed = false;
    const incomingCallHandler = (args) => {
      if (disposed) return;
      const call = args.incomingCall;
      setIncomingCall(call);
      const identifier = call.callerInfo?.identifier;
      const displayId = identifier?.phoneNumber || identifier?.rawId || call.callerInfo?.displayName || "Unknown Caller";
      const callerPhoneKey = call.callerInfo?.displayName || "";

      stopRingtone();
      ringtoneRef.current.play().catch((err) => console.warn(err));

      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification("Incoming Call - Oriental Biz", { body: `Call from ${displayId}` });
        notification.onclick = () => { window.focus(); notification.close(); };
      }

      if (call && call.state !== 'Disconnected' && call.state !== 'Connected' && callerPhoneKey) {
        if (syncTimerRef.current) clearInterval(syncTimerRef.current);
        syncTimerRef.current = setInterval(async () => {
          if (!call || call.state === 'Disconnected') {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
            return;
          }
          try {
            const tokenResponse = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
            const response = await fetch(getApiUrl(`/api/call-status/${encodeURIComponent(callerPhoneKey)}`), {
              headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
            });
            if (response.ok) {
              const data = await response.json();
              if (data.is_answered) {
                if (syncTimerRef.current) { clearInterval(syncTimerRef.current); syncTimerRef.current = null; }
                stopRingtone();
                setIncomingCall(null);
                setCalling(false);
                setCallStatus("");
              }
            }
          } catch (err) { console.warn(err); }
        }, 1500);
      }

      call.on('callEnded', () => {
        if (syncTimerRef.current) { clearInterval(syncTimerRef.current); syncTimerRef.current = null; }
        stopRingtone();
        setIncomingCall(prev => (prev === call ? null : prev));
        setCalling(false);
        setCallStatus("");
      });
    };

    async function setupAgent() {
      if (!account || !isInitialized) return;
      try {
        const tokenResponse = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
        const response = await fetch(getApiUrl('/api/acs/token'), {
          headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
        });
        if (!response.ok) throw new Error("Token failure");
        const data = await response.json();
        if (disposed) return;

        if (!window.__acsCallClient) window.__acsCallClient = new CallClient();
        if (!window.__acsAgentPromise) {
          window.__acsAgentPromise = (async () => {
            try {
              const deviceManager = await window.__acsCallClient.getDeviceManager();
              await deviceManager.askDevicePermission({ audio: true });
            } catch (e) { console.warn(e); }
            return await window.__acsCallClient.createCallAgent(new AzureCommunicationTokenCredential(data.token), {
              displayName: account?.name || "Oriental Biz User"
            });
          })();
        }

        window.__acsCallAgent = await window.__acsAgentPromise;
        if (disposed) return;
        callAgentRef.current = window.__acsCallAgent;
        window.__acsCallAgent.on('incomingCall', incomingCallHandler);
      } catch (err) { setCallStatus("Azure setup error: " + err.message); }
    }
    setupAgent();
    return () => {
      disposed = true;
      if (syncTimerRef.current) { clearInterval(syncTimerRef.current); syncTimerRef.current = null; }
      if (window.__acsCallAgent) window.__acsCallAgent.off('incomingCall', incomingCallHandler);
    };
  }, [account, msalInstance, isInitialized]);

  const handleToggleMute = async () => {
    const call = callRef.current;
    if (call) {
      try {
        if (call.isMuted) { await call.unmute(); setIsMuted(false); } 
        else { await call.mute(); setIsMuted(true); }
      } catch (e) { console.error(e); }
    }
  };

  const handleToggleHold = async () => {
    const call = callRef.current;
    if (call) {
      try {
        if (call.state === 'LocalHold') await call.resume();
        else if (call.state === 'Connected') await call.hold();
      } catch (e) { console.error(e); }
    }
  };

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
            {/* Top Toolbar Action Elements */}
            <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
              <div className="d-flex gap-2">
                <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm" onClick={handleOpenAddModal}>
                  ➕ Add Customer
                </button>
                <button className="btn btn-outline-secondary d-flex align-items-center gap-2 shadow-sm" onClick={exportToCSV} disabled={taxEntries.length === 0}>
                  📥 Export Report
                </button>
              </div>
              <button className="btn btn-sm btn-outline-primary" onClick={() => fetchCvitpEntries()}>🔄 Refresh Data</button>
            </div>

            <div className="row">
              {/* Left Column: Data Grid Dashboard */}
              <div className="col-12 col-xl-8 mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 pt-3">
                    <h5 className="card-title mb-0 text-secondary fw-bold">CVITP Status Matrix</h5>
                  </div>
                  <div className="table-responsive" style={{ maxHeight: '620px' }}>
                    <table className="table align-middle table-hover mb-0">
                      <thead className="table-light text-uppercase fs-7 text-muted">
                        <tr>
                          <th>ID Reference</th>
                          <th>Taxpayer Name</th>
                          <th>Mobile</th>
                          <th>Dates (Recv / Filed)</th>
                          <th>Status</th>
                          <th>Assigned To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingEntries ? (
                          <tr><td colSpan="6" className="text-center py-5 text-muted">Loading taxonomy table records...</td></tr>
                        ) : taxEntries.length === 0 ? (
                          <tr><td colSpan="6" className="text-center py-5 text-muted">No operational clinic registrations indexed.</td></tr>
                        ) : (
                          taxEntries.map((entry) => (
                            <tr key={entry.id}>
                              <td>
                                <button 
                                  className="btn btn-link fw-bold text-decoration-none p-0 d-flex align-items-center gap-1"
                                  onClick={() => handleOpenEditModal(entry)}
                                  title={`Edit parameters for entry #${entry.id}`}
                                >
                                  ✏️ #{entry.id}
                                </button>
                              </td>
                              <td>
                                <div className="fw-bold text-dark">{entry.name}</div>
                                <span className="text-muted small" style={{fontSize: '11px'}}>Updated: {new Date(entry.updatedAt).toLocaleDateString()}</span>
                              </td>
                              <td>
                                <button className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => setDialNumber(entry.mobile)}>
                                  📞 {entry.mobile}
                                </button>
                              </td>
                              <td>
                                <div className="small">📥 <span className="text-muted">{entry.receivedDate || '-'}</span></div>
                                <div className="small">✅ <span className="text-success fw-bold">{entry.filledDate || '-'}</span></div>
                              </td>
                              <td>
                                <span className={`badge px-2 py-1 fs-7 fw-bold ${
                                  entry.status === 'Completed' ? 'bg-success-subtle text-success border border-success' : 
                                  entry.status === 'Processing' ? 'bg-warning-subtle text-warning border border-warning' : 
                                  entry.status === 'Cancelled' ? 'bg-secondary-subtle text-secondary border' :
                                  'bg-danger-subtle text-danger border border-danger'
                                }`}>
                                  {entry.status}
                                </span>
                              </td>
                              <td>
                                <span className="text-dark small fw-medium">{entry.assignedTo || <span className="text-muted italic">Unassigned</span>}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Communications Terminal Hub / Dial Pad */}
              <div className="col-12 col-xl-4">
                {incomingCall && (
                  <div className="alert alert-warning mb-3 shadow-sm border-0 animate-pulse p-3">
                    <div className="fw-bold text-dark mb-1">⚠️ Incoming Phone Signal</div>
                    <span className="text-muted small">Roster ID: {incomingCall.callerInfo?.displayName || "Unknown Caller"}</span>
                    <div className="mt-3 d-flex gap-2">
                      <button className="btn btn-success btn-sm flex-grow-1" onClick={handleAcceptCall}>Answer</button>
                      <button className="btn btn-danger btn-sm flex-grow-1" onClick={handleDeclineCall}>Drop</button>
                    </div>
                  </div>
                )}

                <div className="card border-0 shadow-sm p-4 mb-4 bg-white">
                  <h6 className="fw-bold text-secondary text-uppercase mb-3">Dialer Terminal</h6>
                  <input
                    type="tel"
                    className="form-control form-control-lg text-center fw-bold mb-3 bg-light border-0"
                    value={dialNumber}
                    onChange={e => setDialNumber(e.target.value)}
                  />
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map((n) => (
                      <button key={n} className="btn btn-outline-light border text-dark flex-grow-1 py-2 fs-5" style={{ width: '28%', borderRadius: '8px' }} onClick={() => setDialNumber(dialNumber + n)}>{n}</button>
                    ))}
                  </div>

                  {calling ? (
                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex gap-2">
                        <button className={`btn w-50 py-2 ${isMuted ? 'btn-warning' : 'btn-outline-secondary'}`} onClick={handleToggleMute}>{isMuted ? '🎙️ Unmute' : '🎙️ Mute'}</button>
                        <button className={`btn w-50 py-2 ${isOnHold ? 'btn-warning' : 'btn-outline-secondary'}`} onClick={handleToggleHold}>{isOnHold ? '▶️ Resume' : '⏸️ Hold'}</button>
                      </div>
                      <button className="btn btn-danger btn-lg w-100 py-2 mt-2" onClick={handleHangUp}>Disconnect Call</button>
                    </div>
                  ) : (
                    <button className="btn btn-success btn-lg w-100 py-2 fw-bold" onClick={handleCall} disabled={!dialNumber}>Initiate Call</button>
                  )}
                  
                  <button className="btn btn-sm btn-link text-muted w-100 mt-2 text-decoration-none" onClick={() => setDialNumber('+1')}>Reset Selector</button>

                  {callStatus && (
                    <div className="alert alert-dark mt-3 mb-0 d-flex justify-content-between align-items-center py-2 px-3 border-0 small">
                      <span>{callStatus}</span>
                      {calling && callDuration > 0 && <span className="badge bg-danger">{formatDuration(callDuration)}</span>}
                    </div>
                  )}
                </div>

                {/* Database-Backed Rolling History Control with Name Translator */}
                <div className="card border-0 shadow-sm p-3 bg-white">
                  <h6 className="fw-bold text-secondary text-uppercase mb-3 small">Active Session History (7 Days)</h6>
                  <ul className="list-group list-group-flush" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {callHistory.length === 0 && <li className="list-group-item text-muted text-center border-0 py-3 small">No current transactions logged.</li>}
                    {displayedHistory.map((c, i) => (
                      <li key={i} className="list-group-item px-0 d-flex justify-content-between align-items-center border-0 small">
                        <span>
                          {c.type === 'outgoing' ? '📤' : '📥'}{' '}
                          {/* Dynamically swaps 10-digit clean matches with client names */}
                          <span className="fw-bold text-dark">
                            {resolveCallerIdentity(c.number)}
                          </span>
                          {/* Include small raw phone subtitle if the number matched a database name */}
                          {resolveCallerIdentity(c.number) !== c.number && (
                            <div className="text-muted" style={{ fontSize: '10px', marginLeft: '24px' }}>{c.number}</div>
                          )}
                        </span>
                        <span className="text-muted text-end" style={{ fontSize: '11px' }}>
                          {c.status}
                          <br/>
                          {c.time.includes(',') ? c.time.split(',')[1] : c.time}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  {callHistory.length > 5 && (
                    <div className="text-center mt-2 border-top pt-2">
                      <button 
                        className="btn btn-link btn-sm text-decoration-none fw-bold" 
                        onClick={() => setShowAllHistory(!showAllHistory)}
                      >
                        {showAllHistory ? "🔼 Show Less" : `🔽 Show More (${callHistory.length - 5} hidden)`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --- MULTI-PURPOSE ADD/EDIT BACKDROP MODAL --- */}
            {showAddModal && (
              <>
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                          <div className="row">
                            <div className="col-6 mb-3">
                              <label className="form-label small fw-bold text-muted">Coin ID Reference (Export Only)</label>
                              <input type="text" className="form-control" value={newCustomer.coin} onChange={e => setNewCustomer({...newCustomer, coin: e.target.value})} placeholder="C-99" />
                            </div>
                            <div className="col-6 mb-3">
                              <label className="form-label small fw-bold text-muted">Status</label>
                              <select className="form-select" value={newCustomer.status} onChange={e => setNewCustomer({...newCustomer, status: e.target.value})}>
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
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
                          <button type="submit" className="btn btn-primary px-4 fw-bold">
                            {isEditMode ? "Save Changes" : "Commit Record"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="modal-backdrop fade show"></div>
              </>
            )}
          </>
        ) : (
          <div className="alert alert-info mt-4 border-0 p-4 shadow-sm">
            <h5 className="fw-bold">🔐 Access Control Boundary</h5>
            Please sign in using your corporate credentials to connect your client terminal matrix interface safely.
          </div>
        )}
      </div>
    </div>
  );
};

export default CvitpPage;