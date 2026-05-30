// taxType: 'Personal', 'Corporate', 'CVITP'
export const requestDocumentFlow = async (msalInstance, account, customerData, taxType = 'Personal') => {
    if (!account) {
        alert('Please sign in first (via the header) to request a document.');
        return;
    }

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
        let foundInShared = false;
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
                foundInShared = true;
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
        // List children of parent
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
        // Check if date folder exists
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
        const uploadUrl = linkData.link.webUrl;

        const email = customerData.email || '';
        const subject = encodeURIComponent('Please upload your documents');
        const bodyText =
            'Hi ' + customerFolderName + ',\n\n' +
            'Please use the following link to securely upload your documents:\n\n' +
            uploadUrl + '\n\n' +
            'Thank you.';
        const body = encodeURIComponent(bodyText);
        window.location.href = 'mailto:' + email + '?subject=' + subject + '&body=' + body;

    } catch (error) {
        console.error('Error in Request Document flow:', error);
        alert('Error: ' + error.message);
    }
};