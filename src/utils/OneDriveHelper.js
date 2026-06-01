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
        // finally logics (e.g., hide loading) can go here if needed
    }
    })();

    pendingRequests.set(requestKey, executionPromise);
    
    try {
        return await executionPromise;
    } finally {
        pendingRequests.delete(requestKey);
    }
};