import React, { useEffect, useMemo, useState, useRef } from 'react';
import { loginRequest, getApiUrl } from '../../authConfig';

// --- CVITP NETWORK CARRIER TELEMETRY EXTRACTION UTILITY ---
const extractPurePhoneNumber = (incomingCallObj) => {
  if (!incomingCallObj) return "";

  try {
    const info = incomingCallObj.callerInfo;
    if (info?.displayName && !info.displayName.includes("acs:")) {
      return info.displayName;
    }

    const identifierObj = info?.identifier || incomingCallObj.identifier;
    if (identifierObj?.phoneNumber) {
      return identifierObj.phoneNumber.replace("4:8:acs:", "").replace("4:", "");
    }

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

    const rawId = identifierObj?.rawId || "";
    if (rawId && !rawId.includes("communicationUser")) {
      return rawId.replace("4:8:acs:", "").replace("4:", "");
    }
  } catch (err) {
    console.warn("Telemetry parsing exception dropped:", err);
  }

  return "Unknown Line"; 
};

// Standard DTMF Frequency Grid Mapping Matrix
const DTMF_FREQUENCIES = {
  '1': { low: 697, high: 1209 }, '2': { low: 697, high: 1336 }, '3': { low: 697, high: 1477 },
  '4': { low: 770, high: 1209 }, '5': { low: 770, height: 1336 }, '6': { low: 770, high: 1477 },
  '7': { low: 852, high: 1209 }, '8': { low: 852, high: 1336 }, '9': { low: 852, high: 1477 },
  '*': { low: 941, high: 1209 }, '0': { low: 941, high: 1336 }, '#': { low: 941, high: 1477 }
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
  const [activeSubTab, setActiveSubTab] = useState('dialer');
  
  // Track active call parameters specifically for the persistent screen overlay view
  const [activeCallSessionPhone, setActiveCallSessionPhone] = useState("");
  const [isIncomingActiveOverlay, setIsIncomingActiveOverlay] = useState(false);

  const callAgentRef = useRef(null);
  const callRef = useRef(null);
  const ringtoneRef = useRef(null);
  const timerRef = useRef(null);
  const syncTimerRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const audioCtxRef = useRef(null);

  const playDtmfTone = (digit) => {
    const tones = DTMF_FREQUENCIES[digit];
    if (!tones) return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const oscLow = ctx.createOscillator();
      const oscHigh = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscLow.type = 'sine';
      oscLow.frequency.setValueAtTime(tones.low, ctx.currentTime);
      oscHigh.type = 'sine';
      oscHigh.frequency.setValueAtTime(tones.high, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      oscLow.connect(gainNode);
      oscHigh.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscLow.start();
      oscHigh.start();
      oscLow.stop(ctx.currentTime + 0.3);
      oscHigh.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("DTMF Synthesis interrupted:", e);
    }
  };

  const handleKeyPress = (digit) => {
    playDtmfTone(digit);
    setDialNumber(prev => prev + digit);
  };

  const handleBackspace = () => {
    setDialNumber(prev => {
      if (prev.startsWith('+1') && prev.length <= 2) return '+1';
      if (prev.length <= 1) return '';
      return prev.slice(0, -1);
    });
  };

  useEffect(() => {
    if (activeSubTab !== 'dialer' || !isDialerOpen || calling) return;
    const handleWindowKeyDown = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const key = e.key;
      if (DTMF_FREQUENCIES[key]) {
        e.preventDefault();
        handleKeyPress(key);
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [activeSubTab, isDialerOpen, calling]);

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

  const displayedHistory = useMemo(() => {
    if (showAllHistory) return callHistory;
    return callHistory.slice(0, 5);
  }, [callHistory, showAllHistory]);

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

  // Gracefully terminate active calls if the user performs a hard browser refresh (F5/Cmd+R)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (callRef.current && callRef.current.state !== 'Disconnected') {
        e.preventDefault();
        e.returnValue = 'You have an active call. Are you sure you want to leave? The call will be dropped.';
      }
    };

    const handleUnload = () => {
      if (callRef.current && callRef.current.state !== 'Disconnected') {
        callRef.current.hangUp({ forEveryone: true }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

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

  useEffect(() => {
    if (dialNumber && dialNumber !== "+1") {
      setActiveSubTab('dialer');
    }
  }, [dialNumber]);

  const handleLogCallToDatabase = async (number, type, status, customTime = null, duration = null) => {
    if (!number || number === "Internal VoIP Line") return; 
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
      const payload = { number, type, status, time: customTime || new Date().toLocaleString() };
      if (duration !== null) payload.duration = duration;
      
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
      if (!window.__acsCallStartTime) {
        window.__acsCallStartTime = Date.now();
      }
      callStartTimeRef.current = window.__acsCallStartTime;
      const elapsed = Math.floor((Date.now() - window.__acsCallStartTime) / 1000);
      setCallDuration(elapsed);
      timerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - window.__acsCallStartTime) / 1000));
      }, 1000);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    callStartTimeRef.current = null;
    window.__acsCallStartTime = null;
    setCallDuration(0);
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
        setIsIncomingActiveOverlay(false);
        setActiveCallSessionPhone("");
        window.__acsActiveCallNumber = null;
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
      
      // Assign parameters for the outgoing screen track overlay
      setActiveCallSessionPhone(number);
      setIsIncomingActiveOverlay(true);
      window.__acsActiveCallNumber = number;

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
      setIsIncomingActiveOverlay(false);
      setActiveCallSessionPhone("");
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
      
      // Transition from incoming setup to live conversation layout view state
      setActiveCallSessionPhone(activeTargetPhone);
      setIsIncomingActiveOverlay(true);
      window.__acsActiveCallNumber = activeTargetPhone;

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
      setIsIncomingActiveOverlay(false);
      setActiveCallSessionPhone("");
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
    setIsIncomingActiveOverlay(false);
    setActiveCallSessionPhone("");
    window.__acsActiveCallNumber = null;
    setCallStatus("");
  };

  const handleHangUp = async () => {
    if (callRef.current) {
      try { await callRef.current.hangUp({ forEveryone: true }); } catch (err) { console.error(err); }
    }
    setCalling(false);
    stopTimer();
    setIsIncomingActiveOverlay(false);
    setActiveCallSessionPhone("");
    window.__acsActiveCallNumber = null;
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
      setIsIncomingActiveOverlay(true); // Bring up fullscreen mobile interface template
      setIsRingtoneSilenced(false);
      setIsDialerOpen(true);
      
      const displayId = extractPurePhoneNumber(call);
      setActiveCallSessionPhone(displayId);
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
                setIsIncomingActiveOverlay(false);
                setActiveCallSessionPhone("");
                window.__acsActiveCallNumber = null;
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
        setIsIncomingActiveOverlay(false);
        setActiveCallSessionPhone("");
        window.__acsActiveCallNumber = null;
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

        // Check for existing active calls to resume session
        if (window.__acsCallAgent.calls && window.__acsCallAgent.calls.length > 0) {
          const activeCall = window.__acsCallAgent.calls[0];
          callRef.current = activeCall;
          setCalling(true);
          
          const number = window.__acsActiveCallNumber || extractPurePhoneNumber(activeCall);
          setActiveCallSessionPhone(number);
          setIsIncomingActiveOverlay(true);
          setCallStatus("Call status: " + activeCall.state);
          setIsMuted(activeCall.isMuted);
          
          if (activeCall.state === 'Connected') {
            startTimer();
          } else if (activeCall.state === 'LocalHold') {
            setIsOnHold(true);
          }
          
          attachCallStateHandler(activeCall, number, activeCall.direction === 'Incoming' ? 'incoming' : 'outgoing');
          setIsDialerOpen(true);
        } else if (window.__acsCallAgent.incomingCalls && window.__acsCallAgent.incomingCalls.length > 0) {
          // Recover ringing incoming call
          const incCall = window.__acsCallAgent.incomingCalls[0];
          incomingCallHandler({ incomingCall: incCall });
        }
      } catch (err) { setCallStatus("Azure setup error: " + err.message); }
    }
    setupAgent();
    return () => {
      disposed = true;
      if (syncTimerRef.current) { clearInterval(syncTimerRef.current); syncTimerRef.current = null; }
      if (window.__acsCallAgent) window.__acsCallAgent.off('incomingCall', incomingCallHandler);
    };
  }, [account, msalInstance, isInitialized, taxpayerPhoneMap]);

  const dialerKeys = [
    { key: '1', label: '—' },   { key: '2', label: 'abc' }, { key: '3', label: 'def' },
    { key: '4', label: 'ghi' }, { key: '5', label: 'jkl' }, { key: '6', label: 'mno' },
    { key: '7', label: 'pqrs' },{ key: '8', label: 'tuv' }, { key: '9', label: 'wxyz' },
    { key: '*', label: '' },    { key: '0', label: '' },    { key: '#', label: '' }
  ];

  return (
    <>
      <style>{`
        .glass-dark-canvas {
          background: #111827;
          color: #FFFFFF;
        }
        .dial-circle-btn {
          width: 68px; height: 68px;
          border-radius: 50%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          transition: background-color 0.2s ease, transform 0.1s ease;
          border: none;
        }
        .dial-circle-btn:active {
          transform: scale(0.92);
        }
        .btn-mute-style {
          background-color: #1F2937;
          color: #FFFFFF;
        }
        .btn-mute-style.silenced-active, .btn-mute-style.active-call-muted {
          background-color: #4B5563;
          color: #FBBF24;
        }
        .btn-decline-style {
          background-color: #DC2626;
          color: #FFFFFF;
        }
        .btn-accept-style {
          background-color: #16A34A;
          color: #FFFFFF;
        }
        .action-label-text {
          font-size: 12px;
          color: #9CA3AF;
          margin-top: 8px;
          display: block;
          font-weight: 400;
        }
        .profile-silhouette-circle {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background-color: #2563EB;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
        }
        .top-pill-indicator {
          width: 110px;
          height: 14px;
          background-color: #06B6D4;
          border-radius: 100px;
          margin: 0 auto;
        }
        .high-contrast-number-badge {
          background: rgba(255, 255, 255, 0.12);
          color: #E2E8F0 !important;
          border: 1px solid rgba(255, 255, 255, 0.25);
          font-size: 15px !important;
          font-weight: 500;
          letter-spacing: 0.5px;
          padding: 6px 16px !important;
          border-radius: 8px;
          display: inline-block;
          font-family: monospace;
        }
        .call-timer-ticker {
          font-size: 26px;
          font-weight: 700;
          color: #10B981;
          font-family: monospace;
          letter-spacing: 1px;
        }
      `}</style>

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
        
        <div className="offcanvas-body p-0 bg-white position-relative">
          
          {/* --- ✅ NEW PERSISTENT CALL INTERFACE OVERLAY --- */}
          {isIncomingActiveOverlay && (
            <div 
              className="position-absolute w-100 top-0 start-0 h-100 glass-dark-canvas p-4 d-flex flex-column justify-content-between text-center animate-fade-in"
              style={{ zIndex: 1200 }}
            >
              {/* Top Accent Bar Pillar Wrapper */}
              <div className="mt-4">
                <div className="top-pill-indicator"></div>
                <div className="mt-3">
                  {calling && callDuration > 0 ? (
                    <span className="text-uppercase tracking-widest text-success fw-bold font-monospace px-3 py-1 bg-success bg-opacity-10 rounded-pill" style={{ fontSize: '11px' }}>
                      🟢 Live Connection
                    </span>
                  ) : calling ? (
                    <span className="text-uppercase tracking-widest text-warning fw-bold font-monospace px-3 py-1 bg-warning bg-opacity-10 rounded-pill" style={{ fontSize: '11px' }}>
                      🟡 Handshake Routing...
                    </span>
                  ) : (
                    <span className="text-uppercase tracking-widest text-info fw-bold font-monospace px-3 py-1 bg-info bg-opacity-10 rounded-pill" style={{ fontSize: '11px' }}>
                      {isRingtoneSilenced ? "🔕 Ringing Silently" : "🚨 Incoming Line"}
                    </span>
                  )}
                </div>
              </div>

              {/* Central Identity Profile Circle Frame Frame */}
              <div className="my-auto d-flex flex-column align-items-center">
                <div className="profile-silhouette-circle mb-4">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#FFFFFF"/>
                  </svg>
                </div>
                
                {/* Resolved Contact Name Identification */}
                <h2 className="fw-bold text-white text-truncate w-100 px-3 mb-3" style={{ fontSize: '32px', letterSpacing: '-0.5px' }}>
                  {resolveCallerIdentity(activeCallSessionPhone)}
                </h2>

                {/* Live High-Contrast Variable Output Block Badge */}
                <div className="mb-3">
                  <span className="high-contrast-number-badge">
                    {activeCallSessionPhone || "Private Secure Trunk"}
                  </span>
                </div>

                {/* ⏱️ REAL-TIME TIMER TICKER INJECTION TRACK */}
                {calling && callDuration > 0 && (
                  <div className="call-timer-ticker mt-1 animate-pulse">
                    {formatDuration(callDuration)}
                  </div>
                )}

                <small className="text-muted text-uppercase tracking-widest fw-semibold mt-3" style={{ fontSize: '10px' }}>
                  Oriental Business Solutions
                </small>
              </div>

              {/* Action Handset Grid Footers */}
              <div className="mb-5 px-2">
                {calling ? (
                  /* --- ACTIVE CONVERSATION CONTROL ENGINE HUD LAYOUT --- */
                  <div className="d-flex justify-content-center align-items-center gap-4 mx-auto w-100" style={{ maxWidth: '310px' }}>
                    <div className="d-flex flex-column align-items-center">
                      <button 
                        type="button"
                        className={`dial-circle-btn shadow btn-mute-style ${isMuted ? 'active-call-muted' : ''}`}
                        onClick={handleToggleMute}
                      >
                        <span className="fs-4">{isMuted ? "🎙️" : "🎙️"}</span>
                      </button>
                      <span className="action-label-text">{isMuted ? "Unmute" : "Mute Mic"}</span>
                    </div>

                    <div className="d-flex flex-column align-items-center">
                      <button 
                        type="button"
                        className="dial-circle-btn shadow btn-decline-style"
                        onClick={handleHangUp}
                        style={{ width: '80px', height: '80px' }}
                      >
                        <span className="fs-3" style={{ transform: 'rotate(135deg)', display: 'inline-block' }}>📞</span>
                      </button>
                      <span className="action-label-text fw-bold" style={{ color: '#EF4444' }}>End Call</span>
                    </div>

                    <div className="d-flex flex-column align-items-center">
                      <button 
                        type="button"
                        className={`dial-circle-btn shadow btn-mute-style ${isOnHold ? 'active-call-muted' : ''}`}
                        onClick={handleToggleHold}
                      >
                        <span className="fs-4">{isOnHold ? "▶️" : "⏸️"}</span>
                      </button>
                      <span className="action-label-text">{isOnHold ? "Resume" : "Hold"}</span>
                    </div>
                  </div>
                ) : (
                  /* --- BASELINE INCOMING ACTION CONTROLS HUD LAYOUT --- */
                  <div className="d-flex justify-content-around align-items-center mx-auto w-100" style={{ maxWidth: '310px' }}>
                    <div className="d-flex flex-column align-items-center">
                      <button 
                        type="button"
                        className={`dial-circle-btn shadow btn-mute-style ${isRingtoneSilenced ? 'silenced-active' : ''}`}
                        onClick={handleSilenceLocalRingtone}
                        disabled={isRingtoneSilenced}
                      >
                        <span className="fs-4">🔔</span>
                      </button>
                      <span className="action-label-text">Mute Ring</span>
                    </div>

                    <div className="d-flex flex-column align-items-center">
                      <button 
                        type="button"
                        className="dial-circle-btn shadow btn-decline-style"
                        onClick={handleDeclineCall}
                      >
                        <span className="fs-4" style={{ transform: 'rotate(135deg)', display: 'inline-block' }}>📞</span>
                      </button>
                      <span className="action-label-text" style={{ color: '#EF4444' }}>Decline</span>
                    </div>

                    <div className="d-flex flex-column align-items-center">
                      <button 
                        type="button"
                        className="dial-circle-btn shadow btn-accept-style"
                        onClick={handleAcceptCall}
                      >
                        <span className="fs-4">📞</span>
                      </button>
                      <span className="action-label-text" style={{ color: '#10B981' }}>Accept</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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

            <div className="card-body p-4 flex-grow-1 overflow-auto bg-white">
              {activeSubTab === 'dialer' ? (
                <div className="animate-fade-in mx-auto d-flex flex-column justify-content-between h-100" style={{ maxWidth: '340px' }}>
                  <div className="w-100 mb-4 mt-2">
                    <div className="position-relative w-100">
                      <input
                        type="tel"
                        className="form-control form-control-lg text-start font-monospace ps-3 pe-5 border bg-white"
                        value={dialNumber}
                        readOnly
                        style={{
                          fontSize: '24px',
                          letterSpacing: '0.5px',
                          height: '64px',
                          borderRadius: '16px',
                          borderColor: '#E2E8F0',
                          color: '#1E293B'
                        }}
                      />
                      {dialNumber && dialNumber !== '+1' && (
                        <button
                          type="button"
                          className="btn border-0 position-absolute end-0 top-50 translate-middle-y me-2 text-muted fs-4 p-2"
                          onClick={handleBackspace}
                          style={{ background: 'transparent' }}
                        >
                          ⌫
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="row g-3 text-center justify-content-center mb-4">
                    {dialerKeys.map((item) => (
                      <div key={item.key} className="col-4 d-flex justify-content-center">
                        <button
                          type="button"
                          className="btn d-flex flex-column align-items-center justify-content-center border-0 p-0"
                          onClick={() => handleKeyPress(item.key)}
                          disabled={calling}
                          style={{
                            width: '76px',
                            height: '76px',
                            background: 'transparent',
                            color: '#1E293B',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span className="fs-3 fw-normal lh-1">{item.key}</span>
                          {item.label && (
                            <span 
                              className="text-uppercase text-muted tracking-wide d-block mt-0.5" 
                              style={{ fontSize: '10px', fontWeight: '500' }}
                            >
                              {item.label}
                            </span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="d-flex flex-column align-items-center justify-content-center mb-3">
                    <button
                      type="button"
                      className="btn btn-success d-flex align-items-center justify-content-center shadow"
                      onClick={handleCall}
                      disabled={!dialNumber || dialNumber === '+1'}
                      style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '50%',
                        background: '#86EFAC',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '32px'
                      }}
                    >
                      📞
                    </button>

                    {dialNumber && dialNumber !== '+1' && !calling && (
                      <button 
                        type="button" 
                        className="btn btn-link btn-sm text-muted text-decoration-none mt-3 fw-medium" 
                        onClick={() => setDialNumber('+1')}
                      >
                        Reset Number
                      </button>
                    )}
                  </div>

                  {callStatus && (
                    <div className="alert alert-dark mt-2 mb-0 d-flex justify-content-between align-items-center py-2 px-3 border-0 small w-100" style={{ borderRadius: '12px' }}>
                      <span className="fw-medium">{callStatus}</span>
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
                            <li key={`${group}-${i}`} className="list-group-item px-0 d-flex justify-content-between align-items-center border-0 small bg-white">
                              <div className="ps-2">
                                {c.type === 'outgoing' ? '📤' : '📥'}{' '}
                                <span className="fw-bold text-dark">{resolveCallerIdentity(c.number)}</span>
                                {resolveCallerIdentity(c.number) !== c.number && (
                                  <div className="text-muted" style={{ fontSize: '10px', marginLeft: '24px' }}>{c.number}</div>
                                )}
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
                              <span className="text-muted text-end pe-2" style={{ fontSize: '11px' }}>
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