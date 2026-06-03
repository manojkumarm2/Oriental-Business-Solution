import React, { useEffect, useMemo, useState, useRef } from 'react';
import { loginRequest, getApiUrl } from '../../authConfig';

// --- CVITP NETWORK CARRIER TELEMETRY EXTRACTION UTILITY ---
const extractPurePhoneNumber = (incomingCallObj) => {
  if (!incomingCallObj) return "";

  try {
    const callCore = incomingCallObj._callCommon || incomingCallObj._call || incomingCallObj;
    if (callCore) {
      const pMap = callCore._mriToRemoteParticipantMap || callCore.mriToRemoteParticipantMap;
      if (pMap && typeof pMap.keys === 'function') {
        const participantKeys = Array.from(pMap.keys());
        const phoneKey = participantKeys.find(key => key.startsWith('4:'));
        if (phoneKey) {
          return phoneKey.replace("4:", ""); 
        }
      }

      const pList = callCore._remoteParticipants || callCore.remoteParticipants;
      if (pList && pList.length > 0) {
        const foundParticipant = pList.find(p => p.identifier?.phoneNumber || p.identifier?.rawId?.startsWith('4:'));
        if (foundParticipant) {
          const rawId = foundParticipant.identifier.phoneNumber || foundParticipant.identifier.rawId;
          return rawId.replace("4:", "");
        }
      }
    }

    const info = incomingCallObj.callerInfo;
    const identifierObj = info?.identifier || incomingCallObj.identifier;

    if (identifierObj?.phoneNumber) {
      return identifierObj.phoneNumber.replace("4:8:acs:", "").replace("4:", "");
    }

    const rawId = identifierObj?.rawId || "";
    if (rawId && !rawId.includes("communicationUser")) {
      return rawId.replace("4:8:acs:", "").replace("4:", "");
    }

    if (info?.displayName && !info.displayName.includes("acs:")) {
      return info.displayName;
    }
  } catch (err) {
    console.warn("Telemetry parsing exception dropped:", err);
  }

  return "Internal VoIP Line"; 
};

const CvitpCommunicationsHub = ({ account, msalInstance, isInitialized, taxEntries, dialNumber, setDialNumber, refreshTrigger, isDialerOpen, setIsDialerOpen }) => {
  const [calling, setCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const [callHistory, setCallHistory] = useState([]); 
  const [showAllHistory, setShowAllHistory] = useState(false); 
  const [incomingCall, setIncomingCall] = useState(null);
  const [isRingtoneSilenced, setIsRingtoneSilenced] = useState(false); 
  
  // Tab Navigation Handling Parameter ('dialer' or 'history')
  const [activeSubTab, setActiveSubTab] = useState('dialer');

  const callAgentRef = useRef(null);
  const callRef = useRef(null);
  const ringtoneRef = useRef(null);
  const timerRef = useRef(null);
  const syncTimerRef = useRef(null);
  const callStartTimeRef = useRef(null);

  // --- 🔟 AUTOMATED 10-DIGIT LOOKUP TRANSLATOR KEY ---
  const taxpayerPhoneMap = useMemo(() => {
    const map = {};
    taxEntries.forEach(entry => {
      if (entry.mobile) {
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
    
    if (rawNumber === "Internal VoIP Line" || rawNumber === "Internal Call") {
      return "Internal Staff Representative";
    }

    const cleanDigits = rawNumber.replace(/[^0-9]/g, "");
    if (cleanDigits.length >= 10) {
      const tenDigitKey = cleanDigits.slice(-10);
      if (taxpayerPhoneMap[tenDigitKey]) {
        return taxpayerPhoneMap[tenDigitKey];
      }
    }
    return rawNumber;
  };

  const currentIncomingPhone = useMemo(() => {
    return extractPurePhoneNumber(incomingCall);
  }, [incomingCall]);

  // Computed slice for the communications sub-card layout view
  const displayedHistory = useMemo(() => {
    if (showAllHistory) return callHistory;
    return callHistory.slice(0, 5);
  }, [callHistory, showAllHistory]);

  // Group the currently displayed history by date
  const groupedHistory = useMemo(() => {
    const groups = { Today: [], Yesterday: [], Older: [] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    displayedHistory.forEach(c => {
      const parseableTime = c.time.includes(',') ? c.time : c.time.replace(' ', 'T'); 
      const recordDate = new Date(parseableTime);
      
      if (isNaN(recordDate.getTime())) {
        groups.Older.push(c);
        return;
      }
      
      recordDate.setHours(0, 0, 0, 0);
      
      if (recordDate.getTime() === today.getTime()) {
        groups.Today.push(c);
      } else if (recordDate.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(c);
      } else {
        groups.Older.push(c);
      }
    });
    return groups;
  }, [displayedHistory]);

  // Fetch Call History isolated loop
  useEffect(() => {
    const fetchHistory = async () => {
      if (!account) return;
      try {
        const tokenResponse = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
        const historyResponse = await fetch(getApiUrl('/api/cvitp/call-history'), {
          headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
        });
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setCallHistory(historyData);
        }
      } catch (err) {
        console.error("Error fetching call history:", err);
      }
    };
    fetchHistory();
  }, [account, msalInstance, refreshTrigger]);

  // Auto-switch to Dialer tab if a phone number is triggered via props
  useEffect(() => {
    if (dialNumber && dialNumber !== "+1") {
      setActiveSubTab('dialer');
    }
  }, [dialNumber]);

  const handleLogCallToDatabase = async (number, type, status, customTime = null, duration = null) => {
    if (!number || number === "Internal VoIP Line") return; 
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
      const payload = {
        number,
        type,
        status,
        time: customTime || new Date().toLocaleString()
      };
      if (duration !== null) {
        payload.duration = duration;
      }
      
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

  const handleSelectNumberFromHistory = (targetNumber) => {
    if (!targetNumber) return;
    setDialNumber(targetNumber);
    setActiveSubTab('dialer'); 
  };

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
    setIsRingtoneSilenced(false);
  };

  const handleSilenceLocalRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
    }
    setIsRingtoneSilenced(true);
  };

  const startTimer = () => {
    if (!timerRef.current) {
      callStartTimeRef.current = Date.now();
      timerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    callStartTimeRef.current = null;
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
        let finalDuration = 0;
        if (callStartTimeRef.current) {
          finalDuration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        }
        setCalling(false);
        stopTimer();
        setIsMuted(false);
        setIsOnHold(false);
        setIncomingCall(null);
        setCallStatus("");
        handleLogCallToDatabase(number, type, "Disconnected", null, finalDuration);
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
    const activeTargetPhone = currentIncomingPhone; 
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
      setCallStatus("Call connected");
      handleLogCallToDatabase(activeTargetPhone, "incoming", "Connected");
      attachCallStateHandler(activeCall, activeTargetPhone, "incoming");
    } catch (err) {
      setCallStatus("Error answering: " + err.message);
      setIncomingCall(null);
      setCalling(false);
    }
  };

  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    const activeTargetPhone = currentIncomingPhone;
    stopRingtone();
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    try {
      handleLogCallToDatabase(activeTargetPhone, "incoming", "Rejected");
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

  const handleToggleMute = async () => {
    const call = callRef.current;
    if (call) {
      try {
        if (call.isMuted) {
          await call.unmute();
          setIsMuted(false);
        } else {
          await call.mute();
          setIsMuted(true);
        }
      } catch (e) { console.error("Mute toggle failed", e); }
    }
  };

  const handleToggleHold = async () => {
    const call = callRef.current;
    if (call) {
      try {
        if (call.state === 'LocalHold') {
          await call.resume();
        } else if (call.state === 'Connected') {
          await call.hold();
        }
      } catch (e) { console.error("Hold toggle failed", e); }
    }
  };

  useEffect(() => {
    let disposed = false;
    const incomingCallHandler = async (args) => {
      if (disposed) return;
      const call = args.incomingCall;
      
      call.rawPayload = args.rawPayload || args; 
      await new Promise(resolve => setTimeout(resolve, 250));
      if (disposed) return;

      setIncomingCall(call);
      setIsRingtoneSilenced(false);
      setIsDialerOpen(true);
      
      const displayId = extractPurePhoneNumber(call);
      console.log("🚀 Extracted Identity Number for History logging loop:", displayId);

      stopRingtone();
      ringtoneRef.current.play().catch((err) => console.warn(err));

      if ("Notification" in window && Notification.permission === "granted") {
        const resolvedName = resolveCallerIdentity(displayId);
        const notificationTitle = `🚨 Incoming Clinic Call`;
        const notificationOptions = {
          body: `Taxpayer: ${resolvedName}\nLine: ${displayId}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'cvitp-incoming-call', 
          renotify: true,              
          requireInteraction: true,    
          silent: false,
          vibrate: [200, 100, 200, 100, 200]
        };

        try {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(notificationTitle, notificationOptions);
          }).catch(() => {
            const fallbackNotif = new Notification(notificationTitle, notificationOptions);
            fallbackNotif.onclick = () => { window.focus(); fallbackNotif.close(); };
          });
        } catch (err) {
          const fallbackNotif = new Notification(notificationTitle, notificationOptions);
          fallbackNotif.onclick = () => { window.focus(); fallbackNotif.close(); };
        }
      }

      if (call && call.state !== 'Disconnected' && call.state !== 'Connected' && displayId) {
        if (syncTimerRef.current) clearInterval(syncTimerRef.current);
        syncTimerRef.current = setInterval(async () => {
          if (!call || call.state === 'Disconnected') {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
            return;
          }
          try {
            const tokenResponse = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
            const response = await fetch(getApiUrl(`/api/call-status/${encodeURIComponent(displayId)}`), {
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
        if (callRef.current === null || call.state === 'Incoming') {
          handleLogCallToDatabase(displayId, "incoming", "Missed");
        }
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

        if (!window.__acsCallClient) {
          const { CallClient } = await import('@azure/communication-calling');
          window.__acsCallClient = new CallClient();
        }
        if (!window.__acsAgentPromise) {
          window.__acsAgentPromise = (async () => {
            try {
              const deviceManager = await window.__acsCallClient.getDeviceManager();
              await deviceManager.askDevicePermission({ audio: true });
            } catch (e) { console.warn(e); }
            const { AzureCommunicationTokenCredential } = await import('@azure/communication-common');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, msalInstance, isInitialized, taxpayerPhoneMap]);

  return (
    <>
      <div 
        className={`offcanvas offcanvas-end dialer-offcanvas ${isDialerOpen ? 'show' : ''}`} 
        style={{ 
          visibility: isDialerOpen ? 'visible' : 'hidden', 
          zIndex: 1045,
          boxShadow: isDialerOpen ? '-4px 0 15px rgba(0,0,0,0.08)' : 'none'
        }} tabIndex="-1">
        <div className="offcanvas-header bg-white border-bottom shadow-sm z-1">
          <h5 className="offcanvas-title fw-bold d-flex align-items-center gap-2">
            <span>📞</span> Communications Hub
          </h5>
          <button type="button" className="btn-close" onClick={() => setIsDialerOpen(false)}></button>
        </div>
        
        <div className="offcanvas-body p-0 bg-light position-relative">
          {/* --- 🔔 INLINE DRAWER BOX OVERLAY (DIALER OVERLAY PLACEMENT RESTORED) --- */}
          {incomingCall && (
            <div 
              className="card border-0 shadow-lg position-absolute w-100 top-0 start-0 h-100 bg-white"
              style={{ zIndex: 1100 }}
            >
              <div className="text-dark text-center py-3 px-2 bg-warning fw-bold">
                <div className="fs-3 mb-1">{isRingtoneSilenced ? '🔕' : '⚡'}</div>
                <h6 className="fw-black text-uppercase tracking-wider mb-0 small">
                  {isRingtoneSilenced ? "Line Ringing Silently" : "Incoming Communication Line"}
                </h6>
              </div>
              <div className="card-body p-4 d-flex flex-column justify-content-center text-center">
                <div className="mb-3">
                  <label className="text-uppercase text-muted fs-8 tracking-widest d-block mb-1 fw-bold">Resolved Identity</label>
                  <h3 className="fw-black text-dark mb-1 text-truncate px-1">
                    {resolveCallerIdentity(currentIncomingPhone)}
                  </h3>
                  <span className="badge bg-light text-muted border font-monospace px-2 py-1 fs-8">
                    {currentIncomingPhone || "PSTN Call Line"}
                  </span>
                </div>
                
                <div className="d-flex flex-column gap-2 mt-2 w-100 px-2">
                  <button 
                    className="btn btn-success btn-lg py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 fs-6" 
                    onClick={handleAcceptCall}
                    style={{ borderRadius: '10px' }}
                  >
                    📞 Connect Call Leg
                  </button>
                  
                  <button 
                    type="button"
                    className={`btn py-2 fw-bold border shadow-sm d-flex align-items-center justify-content-center gap-2 fs-7 ${
                      isRingtoneSilenced ? 'btn-light text-muted' : 'btn-outline-secondary text-dark'
                    }`}
                    onClick={handleSilenceLocalRingtone}
                    disabled={isRingtoneSilenced}
                    style={{ borderRadius: '10px' }}
                  >
                    {isRingtoneSilenced ? "🔕 Ringtone Muted" : "Mute Sound"}
                  </button>

                  <button 
                    className="btn btn-danger btn-sm py-2 fw-medium mt-1 fs-7" 
                    onClick={handleDeclineCall}
                    style={{ borderRadius: '10px' }}
                  >
                    🛑 Decline & Release Line
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab Navigation Panel wrapper header */}
          <div className="card border-0 bg-transparent overflow-hidden h-100 d-flex flex-column">
            <div className="card-header bg-white p-0 border-0 flex-shrink-0">
              <ul className="nav nav-tabs nav-justified border-bottom-0" style={{ fontSize: '14px' }}>
                <li className="nav-item">
                  <button 
                    className={`nav-item nav-link rounded-0 py-3 fw-bold border-0 ${activeSubTab === 'dialer' ? 'active bg-white text-primary border-bottom border-primary border-3' : 'text-muted bg-light'}`}
                    onClick={() => setActiveSubTab('dialer')}
                    style={activeSubTab === 'dialer' ? { borderBottom: '3px solid var(--bs-primary)' } : {}}
                  >
                    🎙️ Dialer
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-item nav-link rounded-0 py-3 fw-bold border-0 ${activeSubTab === 'history' ? 'active bg-white text-primary border-bottom border-primary border-3' : 'text-muted bg-light'}`}
                    onClick={() => setActiveSubTab('history')}
                    style={activeSubTab === 'history' ? { borderBottom: '3px solid var(--bs-primary)' } : {}}
                  >
                    📋 Call History
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body p-4 flex-grow-1 overflow-auto">
              {/* Render Tab Contents Depending on navigation parameters context */}
              {activeSubTab === 'dialer' ? (
                <div className="animate-fade-in">
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
                        <button type="button" className={`btn w-50 py-2 ${isMuted ? 'btn-warning' : 'btn-outline-secondary'}`} onClick={handleToggleMute}>{isMuted ? '🎙️ Unmute' : '🎙️ Mute'}</button>
                        <button type="button" className={`btn w-50 py-2 ${isOnHold ? 'btn-warning' : 'btn-outline-secondary'}`} onClick={handleToggleHold}>{isOnHold ? '▶️ Resume' : '⏸️ Hold'}</button>
                      </div>
                      <button type="button" className="btn btn-danger btn-lg w-100 py-2 mt-2" onClick={handleHangUp}>Disconnect Call</button>
                    </div>
                  ) : (
                    <button type="button" className="btn btn-success btn-lg w-100 py-2 fw-bold" onClick={handleCall} disabled={!dialNumber}>Initiate Call</button>
                  )}
                  
                  <button type="button" className="btn btn-sm btn-link text-muted w-100 mt-2 text-decoration-none" onClick={() => setDialNumber('+1')}>Reset Selector</button>

                  {callStatus && (
                    <div className="alert alert-dark mt-3 mb-0 d-flex justify-content-between align-items-center py-2 px-3 border-0 small">
                      <span>{callStatus}</span>
                      {calling && callDuration > 0 && <span className="badge bg-danger">{formatDuration(callDuration)}</span>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-fade-in">
                  <ul className="list-group list-group-flush" style={{ maxHeight: showAllHistory ? 'calc(100vh - 220px)' : '420px', overflowY: 'auto' }}>
                    {callHistory.length === 0 && <li className="list-group-item text-muted text-center border-0 py-4 small">No current transactions logged.</li>}
                    
                    {['Today', 'Yesterday', 'Older'].map(group => (
                      groupedHistory[group].length > 0 && (
                        <React.Fragment key={group}>
                          <li className="list-group-item bg-light text-muted fw-bold small py-1 border-0">
                            {group}
                          </li>
                          {groupedHistory[group].map((c, i) => (
                            <li key={`${group}-${i}`} className="list-group-item px-0 d-flex justify-content-between align-items-center border-0 small">
                              <div>
                                {c.type === 'outgoing' ? '📤' : '📥'}{' '}
                                <span className="fw-bold text-dark">{resolveCallerIdentity(c.number)}</span>
                                {resolveCallerIdentity(c.number) !== c.number && (
                                  <div className="text-muted" style={{ fontSize: '10px', marginLeft: '24px' }}>{c.number}</div>
                                )}
                                {/* Subtab Inline dial trigger hyperlink configuration loop map hooks */}
                                <div className="mt-1" style={{ marginLeft: '24px' }}>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-link p-0 text-decoration-none text-primary fw-medium small"
                                    onClick={() => handleSelectNumberFromHistory(c.number)}
                                    style={{ fontSize: '11px' }}
                                  >
                                    📞 Prepare Return Call
                                  </button>
                                </div>
                              </div>
                              <span className="text-muted text-end" style={{ fontSize: '11px' }}>
                                <span className={`badge px-1 py-0.5 fs-8 me-1 ${
                                  c.status === 'Connected' || c.status === 'Started' ? 'bg-success-subtle text-success' :
                                  c.status === 'Rejected' || c.status === 'Missed' ? 'bg-danger-subtle text-danger' : 'bg-light text-muted'
                                }`}>{c.status}</span>
                                <br/>
                                <span className="d-block mt-1">
                                  {group === 'Older' ? c.time : (c.time.includes(',') ? c.time.split(',')[1].trim() : (c.time.includes(' ') ? c.time.split(' ').slice(1).join(' ') : c.time))}
                                </span>
                                {c.duration !== undefined && c.duration !== null && (
                                  <span className="d-block text-primary fw-medium">⏱ {formatDuration(c.duration)}</span>
                                )}
                              </span>
                            </li>
                          ))}
                        </React.Fragment>
                      )
                    ))}
                  </ul>
                  
                  {callHistory.length > 5 && (
                    <div className="text-center mt-2 border-top pt-2">
                      <button 
                        type="button"
                        className="btn btn-link btn-sm text-decoration-none fw-bold" 
                        onClick={() => setShowAllHistory(!showAllHistory)}
                      >
                        {showAllHistory ? "🔼 Show Less" : `🔽 Show More (${callHistory.length - 5} hidden)`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CvitpCommunicationsHub;