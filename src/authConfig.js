export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_MSAL_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/c4ea64ee-34b6-4a18-9339-8aff143c12d4',
    redirectUri: `${window.location.origin}/customerData`,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
};

export const loginRequest = {
  scopes: [`api://${process.env.REACT_APP_MSAL_CLIENT_ID}/access_as_user`],
};

export const getApiUrl = (path) => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    if (isLocal && process.env.REACT_APP_LOCAL_API_HOST) {
      return `${process.env.REACT_APP_LOCAL_API_HOST.replace(/\/$/, '')}${path}`;
    }
  }
  return path;
};

export const getRawDateString = (value) => {
  if (!value) return '';
  try {
    const date = new Date(value);
    return date.toISOString().split('T')[0];
  } catch {
    return value;
  }
};

export const getUsersEmail = () => {
  const userEmails = process.env.REACT_APP_USER_EMAILS ? process.env.REACT_APP_USER_EMAILS.split(',').map(e => e.trim()) : [];
  return userEmails;
};

export const isAdminRole = (email) => {
  const adminEmails = process.env.REACT_APP_ADMIN_EMAILS ? process.env.REACT_APP_ADMIN_EMAILS.split(',').map(e => e.trim()) : [];
  return adminEmails.includes(email?.toLowerCase()) ? true : false;
};
