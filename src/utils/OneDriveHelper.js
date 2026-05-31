// UI Helpers for global loading spinner
const showLoadingOverlay = (message = "Generating secure upload link. Please wait...") => {
    const loaderId = 'global-spinner-overlay';
    if (document.getElementById(loaderId)) return;
    
    const loader = document.createElement('div');
    loader.id = loaderId;
    loader.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(255, 255, 255, 0.8); z-index: 99999; display: flex; flex-direction: column; justify-content: center; align-items: center;';
    loader.innerHTML = `
        <div style="border: 4px solid rgba(0, 0, 0, 0.1); width: 50px; height: 50px; border-radius: 50%; border-left-color: #0056b3; animation: spin-overlay 1s linear infinite;"></div>
        <p style="margin-top: 15px; font-family: sans-serif; color: #333; font-weight: 500; font-size: 16px;">${message}</p>
        <style>@keyframes spin-overlay { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;
    document.body.appendChild(loader);
};

const hideLoadingOverlay = () => {
    const loader = document.getElementById('global-spinner-overlay');
    if (loader) loader.remove();
};

const pendingRequests = new Map();

// Generate a secure upload link without sending email - returns the upload URL
export const generateSecureUploadLink = async (msalInstance, account, customerData, taxType = 'personal') => {
    if (!account) {
        throw new Error('Please sign in first to generate upload link.');
    }

    // Prevent duplicate concurrent executions (e.g., from React StrictMode double-invoking useEffect)
    const customerId = customerData.id || customerData._id || customerData.name || 'unknown';
    const requestKey = `${account.username}_${taxType}_${customerId}`;

    if (pendingRequests.has(requestKey)) {
        return pendingRequests.get(requestKey);
    }

    const executionPromise = (async () => {
        showLoadingOverlay();

    try {
        const tokenResponse = await msalInstance.acquireTokenSilent({ scopes: ['Files.ReadWrite.All'], account });
        const accessToken = tokenResponse.accessToken;

        // 1. Determine folder names
        const rootFolderName = `${(account.username || account.name).replace(/[\\/:*?"<>|]/g, '_')}_Requested_Docs`;
        let subFolderName = 'Personal_Tax_Docs';
        if (taxType.toLowerCase() === 'corporate') subFolderName = 'Corporate_Tax_Docs';
        else if (taxType.toLowerCase() === 'cvitp') subFolderName = 'Cvitp_Tax_Docs';

    // 2. Try to find root folder in own drive
    let rootFolderId = null;
    
    // Search in own drive root by direct path
    let resp = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(rootFolderName)}`, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (resp.ok) {
        const data = await resp.json();
        rootFolderId = data.id;
    } else {
        resp = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: rootFolderName,
                folder: {},
                '@microsoft.graph.conflictBehavior': 'rename'
            })
        });
        if (!resp.ok) throw new Error('Failed to create root folder');
        const data = await resp.json();
        rootFolderId = data.id;
    }

    // 4.5. Find or create taxType subfolder under root folder
    let parentFolderId = null;
    let parentChildrenResp = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${rootFolderId}:/${encodeURIComponent(subFolderName)}`, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (parentChildrenResp.ok) {
        const parentChildrenData = await parentChildrenResp.json();
        parentFolderId = parentChildrenData.id;
    } else {
        let createParentResp = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${rootFolderId}/children`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: subFolderName,
                folder: {},
                '@microsoft.graph.conflictBehavior': 'rename'
            })
        });
        if (!createParentResp.ok) throw new Error('Failed to create subfolder');
        let createParentData = await createParentResp.json();
        parentFolderId = createParentData.id;
    }

    // 5. Find or create customer folder under parent
    const customerFolderName = (customerData.name || customerData.businessNumber || customerData.corporateName || 'Unknown_Customer').replace(/[\\/:*?"<>|]/g, '_');
    let customerFolderId = null;
    let childrenResp = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}:/${encodeURIComponent(customerFolderName)}`, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (childrenResp.ok) {
        const childrenData = await childrenResp.json();
        customerFolderId = childrenData.id;
    } else {
        // Create customer folder
        let createCustomerResp = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}/children`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: customerFolderName,
                folder: {},
                '@microsoft.graph.conflictBehavior': 'rename'
            })
        });
        if (!createCustomerResp.ok) throw new Error('Failed to create customer folder');
        let createCustomerData = await createCustomerResp.json();
        customerFolderId = createCustomerData.id;
    }

    // 6. Create/check date subfolder (YYYY-MM-DD) under customer folder
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    let dateFolderId = null;
    let dateChildrenResp = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${customerFolderId}:/${encodeURIComponent(dateStr)}`, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (dateChildrenResp.ok) {
        const dateChildrenData = await dateChildrenResp.json();
        dateFolderId = dateChildrenData.id;
    } else {
        // Create date folder
        let createDateResp = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${customerFolderId}/children`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: dateStr,
                folder: {},
                '@microsoft.graph.conflictBehavior': 'rename'
            })
        });
        if (!createDateResp.ok) throw new Error('Failed to create date folder');
        let createDateData = await createDateResp.json();
        dateFolderId = createDateData.id;
    }

    // 7. Create sharing link for date subfolder
    const linkResponse = await fetch('https://graph.microsoft.com/v1.0/me/drive/items/' + dateFolderId + '/createLink', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'edit', scope: 'anonymous' })
    });
    if (!linkResponse.ok) {
        const errData = await linkResponse.json();
        throw new Error(errData.error?.message || 'Failed to create public sharing link. Ensure your organization allows anonymous edit links.');
    }
    const linkData = await linkResponse.json();
    return linkData.link.webUrl;
    } finally {
        hideLoadingOverlay();
    }
    })();

    pendingRequests.set(requestKey, executionPromise);
    
    try {
        return await executionPromise;
    } finally {
        pendingRequests.delete(requestKey);
    }
};