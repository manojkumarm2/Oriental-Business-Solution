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

  const msalInstance = useMemo(() => new PublicClientApplication(msalConfig), []);

  // Dialpad/Call state
  const [dialNumber, setDialNumber] = useState("+1");
  const [calling, setCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callHistory, setCallHistory] = useState([]); // {number, type, time, status}
  const [incomingCall, setIncomingCall] = useState(null);
  
  const callAgentRef = useRef(null);
  const callRef = useRef(null);
  const ringtoneRef = useRef(null);
  const timerRef = useRef(null);
  const syncTimerRef = useRef(null); // Persistent single reference token for the sync loop

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
        setCallHistory((prev) => [
          { number, type, time: new Date().toLocaleString(), status: "Disconnected" },
          ...prev
        ]);
      }
    });
  };

  // Outgoing call
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
      setCallHistory((prev) => [
        { number, type: "outgoing", time: new Date().toLocaleString(), status: "Started" },
        ...prev
      ]);
      attachCallStateHandler(call, number, "outgoing");
    } catch (err) {
      setCallStatus("Error: " + err.message);
      setCalling(false);
    }
  };

  // Accept incoming call
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
      setCallHistory((prev) => [
        { number: callerId, type: "incoming", time: new Date().toLocaleString(), status: "Connected" },
        ...prev
      ]);
      attachCallStateHandler(activeCall, callerId, "incoming");
    } catch (err) {
      console.error("Accept call error:", err);
      setCallStatus("Error answering: " + err.message);
      setIncomingCall(null);
      stopRingtone();
      setCalling(false);
    }
  };

  // Decline incoming call via programmatic Accept-and-Destroy (Handset Drop workaround)
  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    stopRingtone();

    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    try {
      console.log("Attempting UI-only carrier hangup sequence...");
      const activeCall = await incomingCall.accept();
      callRef.current = activeCall;

      setIncomingCall(null);

      if (activeCall.state === 'Connecting' || activeCall.state === 'Incoming') {
        await new Promise(resolve => setTimeout(resolve, 800)); 
      }

      if (callRef.current) {
         await callRef.current.hangUp({ forEveryone: true });
         console.log("UI-only decline hangup executed successfully.");
      }
    } catch (err) {
      console.error("UI-only decline hangup execution failed:", err);
    }

    setCalling(false);
    setCallStatus("");
  };

  const handleHangUp = async () => {
    if (callRef.current) {
      try {
        await callRef.current.hangUp({ forEveryone: true });
      } catch (err) {
        console.error("Hangup error:", err);
      }
    }
    setCalling(false);
    setCallStatus("");
  };

  // 🏁 UNIFIED ENGINE HOOK: Handles registration, UI notifications, and Background Sync Polling perfectly
  useEffect(() => {
    let disposed = false;

    const incomingCallHandler = (args) => {
      if (disposed) return;

      console.log("🔔 INCOMING CALL RECEIVED:", args);
      const call = args.incomingCall;
      setIncomingCall(call);

      // Extract details for standard UI elements
      const identifier = call.callerInfo?.identifier;
      const displayId = identifier?.phoneNumber || identifier?.rawId || call.callerInfo?.displayName || "Unknown Caller";
      
      // Extract uniform phone lookup string key from displayName
      const callerPhoneKey = call.callerInfo?.displayName || "";

      stopRingtone();
      ringtoneRef.current.play().catch((err) => console.warn("Audio play error:", err));

      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification("Incoming Call - Oriental Biz", {
          body: `Call from ${displayId}`,
        });
        notification.onclick = () => { window.focus(); notification.close(); };
      }

      // 🛠️ Initiate the status polling loop right here inside the same handler!
      if (call && call.state !== 'Disconnected' && call.state !== 'Connected' && callerPhoneKey) {
        
        if (syncTimerRef.current) {
          console.log("🧹 Clearing old sync timer instance.");
          clearInterval(syncTimerRef.current);
          syncTimerRef.current = null;
        }
        
        console.log(`🚀 Sync loop started successfully for phone: ${callerPhoneKey}`);
        
        syncTimerRef.current = setInterval(async () => {
          if (!call || call.state === 'Disconnected') {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
            return;
          }

          try {
            const tokenResponse = await msalInstance.acquireTokenSilent({
              ...loginRequest,
              account,
            });

            const encodedPhone = encodeURIComponent(callerPhoneKey);
            const response = await fetch(getApiUrl(`/api/call-status/${encodedPhone}`), {
              headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
            });

            if (response.ok) {
              const data = await response.json();
              
              // Silent UI wipe for Agent B if Agent A connected to the call
              if (data.is_answered) {
                console.log(`⚡ Call handled by Agent A. Performing SILENT local panel clear.`);
                if (syncTimerRef.current) {
                  clearInterval(syncTimerRef.current);
                  syncTimerRef.current = null;
                }
                stopRingtone();
                setIncomingCall(null);
                setCalling(false);
                setCallStatus("");
              }
            }
          } catch (err) {
            console.warn("Status poll connection pause:", err);
          }
        }, 1500);
      }

      // Local caller cleanup if they hang up before anyone answers
      call.on('callEnded', (endedArgs) => {
        console.log(`📞 Incoming call ended. Clean cleanup executed.`, endedArgs?.callEndReason);
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current);
          syncTimerRef.current = null;
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
        if (typeof msalInstance.initialize === 'function') {
          await msalInstance.initialize();
        }
        const tokenResponse = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account,
        });

        const response = await fetch(getApiUrl('/api/acs/token'), {
          headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
        });

        if (!response.ok) throw new Error("Failed to fetch ACS token from server");

        const data = await response.json();
        if (disposed) return;
        console.log("Frontend ACS User ID:", data.acsUserId);

        if (!window.__acsCallClient) {
          window.__acsCallClient = new CallClient();
        }

        if (!window.__acsAgentPromise) {
          window.__acsAgentPromise = (async () => {
            try {
              const deviceManager = await window.__acsCallClient.getDeviceManager();
              await deviceManager.askDevicePermission({ audio: true });
            } catch (permErr) {
              console.warn("Microphone permission issue:", permErr);
            }
            return await window.__acsCallClient.createCallAgent(new AzureCommunicationTokenCredential(data.token), {
              displayName: account?.name || "Oriental Biz User"
            });
          })();
        }

        window.__acsCallAgent = await window.__acsAgentPromise;
        if (disposed) return;
        callAgentRef.current = window.__acsCallAgent;

        // Register our unifed multi-purpose event listener handle
        window.__acsCallAgent.on('incomingCall', incomingCallHandler);
      } catch (err) {
        setCallStatus("Azure setup error: " + err.message);
      }
    }
    
    setupAgent();
    
    return () => {
      disposed = true;
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      if (window.__acsCallAgent) {
        window.__acsCallAgent.off('incomingCall', incomingCallHandler);
      }
    };
  }, [account, msalInstance, isInitialized]);

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
      } catch (e) {
        console.error("Mute toggle failed", e);
      }
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
        } else {
          console.warn("Cannot toggle hold. Call state is currently:", call.state);
        }
      } catch (e) {
        console.error("Hold toggle failed", e);
      }
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
      setError(loginError.message || 'Microsoft sign-in failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await msalInstance.logoutRedirect({ account });
    } catch (logoutError) {
      setError(logoutError.message || 'Logout failed.');
    }
  };

  return (
    <div className="container py-5 position-relative" style={{ minHeight: '100vh' }}>
      <DataPageHeader
        title="CVITP Desk"
        description="Use your Oriental Biz account to access the CVITP phone agent."
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
        <div className="row justify-content-center mt-4">
          <div className="col-12 col-md-6 col-lg-5">
            {incomingCall && (
              <div className="alert alert-warning mb-3 shadow">
                <strong>Incoming call</strong> from {incomingCall.callerInfo?.displayName || "Unknown"}
                <div className="mt-2 d-flex gap-2">
                  <button className="btn btn-success" onClick={handleAcceptCall}>Accept</button>
                  <button className="btn btn-danger" onClick={handleDeclineCall}>Decline</button>
                </div>
              </div>
            )}
            
            <div className="card shadow-sm p-3 mb-3 border-0">
              <h5 className="mb-3">Dialpad</h5>
              <div className="mb-2">
                <input
                  type="tel"
                  className="form-control form-control-lg mb-3"
                  value={dialNumber}
                  onChange={e => setDialNumber(e.target.value.startsWith('+') ? e.target.value : '+1' + e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Enter phone number"
                />
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map((n) => (
                    <button key={n} className="btn btn-light border flex-grow-1 fs-5 py-2" style={{width: '30%'}} onClick={() => setDialNumber(dialNumber + n)}>{n}</button>
                  ))}
                </div>
                {calling ? (
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex gap-2">
                      <button className={`btn w-50 ${isMuted ? 'btn-warning' : 'btn-outline-secondary'}`} onClick={handleToggleMute}>
                        {isMuted ? 'Unmute' : 'Mute'}
                      </button>
                      <button className={`btn w-50 ${isOnHold ? 'btn-warning' : 'btn-outline-secondary'}`} onClick={handleToggleHold}>
                        {isOnHold ? 'Resume' : 'Hold'}
                      </button>
                    </div>
                    <button className="btn btn-danger btn-lg w-100" onClick={handleHangUp}>
                      Hang Up
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-success btn-lg w-100" onClick={handleCall} disabled={!dialNumber}>
                    Call
                  </button>
                )}
                <button className="btn btn-outline-danger w-100 mt-2" onClick={() => setDialNumber('+1')}>Clear</button>
              </div>
              {callStatus && (
                <div className="alert alert-info mt-2 d-flex justify-content-between align-items-center">
                  <span>{callStatus}</span>
                  {calling && callDuration > 0 && <span className="badge bg-secondary fs-6">{formatDuration(callDuration)}</span>}
                </div>
              )}
            </div>
            
            <div className="card shadow-sm p-3 border-0 mt-4">
              <h6 className="mb-3">Call History</h6>
              <ul className="list-group list-group-flush">
                {callHistory.length === 0 && <li className="list-group-item text-muted px-0">No calls yet</li>}
                {callHistory.map((c, i) => (
                  <li key={i} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <span>
                      {c.type === 'outgoing' ? '📤' : '📥'} {c.number} <span className="text-muted small">({c.type})</span>
                    </span>
                    <span className="small text-end">{c.status} <br/><span className="text-muted">{c.time}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info mt-4">
          Please sign in with your Oriental Biz account to use the CVITP dialpad.
        </div>
      )}
    </div>
  );
};

export default CvitpPage;