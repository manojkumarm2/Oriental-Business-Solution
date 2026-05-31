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

// Generate a secure upload link without sending email - returns the upload URL
export const generateSecureUploadLink = async (msalInstance, account, customerData, taxType = 'Personal') => {
    if (!account) {
        throw new Error('Please sign in first to generate upload link.');
    }

    showLoadingOverlay();

    try {
        const tokenResponse = await msalInstance.acquireTokenSilent({ scopes: ['Files.ReadWrite.All'], account });
        const accessToken = tokenResponse.accessToken;

        // 1. Determine parent folder name by taxType
        let parentFolderName = 'Personal Tax Documents';
        if (taxType === 'Corporate') parentFolderName = 'Corporate Documents';
        else if (taxType === 'CVITP') parentFolderName = 'CVITP Documents';

    // 2. Try to find parent folder in own drive
    let parentFolderId = null;
    let parentFolder = null;
    
    // Search in own drive root
    let resp = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null`, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (!resp.ok) throw new Error('Failed to list root folders');
    let data = await resp.json();
    parentFolder = (data.value || []).find(f => f.name === parentFolderName);
    if (parentFolder) {
        parentFolderId = parentFolder.id;
    } else {
        // 3. If not found, check sharedWithMe
        resp = await fetch('https://graph.microsoft.com/v1.0/me/drive/sharedWithMe', {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        if (!resp.ok) throw new Error('Failed to list shared folders');
        data = await resp.json();
        // Find shared folder with matching name
        parentFolder = (data.value || []).find(f => f.name === parentFolderName && f.remoteItem && f.remoteItem.folder);
        if (parentFolder && parentFolder.remoteItem) {
            parentFolderId = parentFolder.remoteItem.id;
        }
    }
    
    // 4. If still not found, create in own drive
    if (!parentFolderId) {
        resp = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: parentFolderName,
                folder: {},
                '@microsoft.graph.conflictBehavior': 'rename'
            })
        });
        if (!resp.ok) throw new Error('Failed to create parent folder');
        data = await resp.json();
        parentFolderId = data.id;
    }

    // 5. Find or create customer folder under parent
    const customerFolderName = (customerData.name || customerData.businessNumber || customerData.corporateName || 'Unknown_Customer').replace(/[\\/:*?"<>|]/g, '_');
    let customerFolderId = null;
    let childrenResp = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}/children?$filter=folder ne null`, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (!childrenResp.ok) throw new Error('Failed to list customer folders');
    let childrenData = await childrenResp.json();
    let customerFolder = (childrenData.value || []).find(f => f.name === customerFolderName);
    if (customerFolder) {
        customerFolderId = customerFolder.id;
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
    let dateChildrenResp = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${customerFolderId}/children?$filter=folder ne null`, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (!dateChildrenResp.ok) throw new Error('Failed to list date folders');
    let dateChildrenData = await dateChildrenResp.json();
    let dateFolder = (dateChildrenData.value || []).find(f => f.name === dateStr);
    if (dateFolder) {
        dateFolderId = dateFolder.id;
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
};