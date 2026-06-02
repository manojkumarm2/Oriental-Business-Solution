import { useState, useEffect, useMemo } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../authConfig';

export const useTaxPortal = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [dialNumber, setDialNumber] = useState("+1");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [emailModalConfig, setEmailModalConfig] = useState(null);

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
        if (isMounted) setError('Failed to initialize authentication.');
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    };
    initializeMsal();
    return () => { isMounted = false; };
  }, [msalInstance]);

  const handleLogin = async () => {
    if (!isInitialized) {
      setError('Authentication is still initializing. Please wait.');
      return;
    }
    if (!process.env.REACT_APP_MSAL_CLIENT_ID || process.env.REACT_APP_MSAL_CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
      setError('Please configure REACT_APP_MSAL_CLIENT_ID in your .env file with your Azure AD application client id.');
      return;
    }
    setError('');
    setMessage('');
    try { await msalInstance.loginRedirect(loginRequest); } catch (e) { setError(e.message || 'Microsoft sign-in failed.'); }
  };

  const handleLogout = async () => {
    try { await msalInstance.logoutRedirect({ account }); } catch (e) { setError(e.message || 'Logout failed.'); }
  };

  return {
    msalInstance, account, isInitialized,
    error, setError, message, setMessage,
    handleLogin, handleLogout,
    dialNumber, setDialNumber,
    refreshTrigger, setRefreshTrigger,
    isDialerOpen, setIsDialerOpen,
    emailModalConfig, setEmailModalConfig
  };
};