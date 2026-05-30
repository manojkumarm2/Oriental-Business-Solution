export const requestDocumentFlow = async (msalInstance, account, customerData) => {
    if (!account) {
        alert('Please sign in first (via the header) to request a document.');
        return;
    }

    try {
        const tokenResponse = await msalInstance.acquireTokenSilent({ scopes: ['Files.ReadWrite.All'], account });
        const accessToken = tokenResponse.accessToken;

        const customerName = customerData.name || customerData.businessName || customerData.corporateName || 'Unknown_Customer';
        
        let folderId;
        const checkFolderResponse = await fetch('https://graph.microsoft.com/v1.0/me/drive/root:/' + encodeURIComponent(customerName), {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });

        if (checkFolderResponse.status === 200) {
            const folderData = await checkFolderResponse.json();
            folderId = folderData.id;
        } else if (checkFolderResponse.status === 404) {
            const createFolderResponse = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: customerName,
                    folder: {},
                    '@microsoft.graph.conflictBehavior': 'rename'
                })
            });
            if (!createFolderResponse.ok) throw new Error('Failed to create customer folder');
            const newFolderData = await createFolderResponse.json();
            folderId = newFolderData.id;
        } else {
            throw new Error('Failed to check folder existence');
        }

        const now = new Date();
        const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        const createSubFolderResponse = await fetch('https://graph.microsoft.com/v1.0/me/drive/items/' + folderId + '/children', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Upload_' + dateStr,
                folder: {},
                '@microsoft.graph.conflictBehavior': 'rename'
            })
        });

        if (!createSubFolderResponse.ok) throw new Error('Failed to create subfolder');
        const subFolderData = await createSubFolderResponse.json();
        const subFolderId = subFolderData.id;

        const linkResponse = await fetch('https://graph.microsoft.com/v1.0/me/drive/items/' + subFolderId + '/createLink', {
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
            'Hi ' + customerName + ',\n\n' +
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