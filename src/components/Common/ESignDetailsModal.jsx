import React from 'react';

const ESignDetailsModal = ({ details, onClose }) => {
  if (!details) return null;

  // Handle both array and single object for backward compatibility
  const detailsArray = Array.isArray(details) ? details : [details];

  const customerName = detailsArray.length > 0
    ? (detailsArray[0].customerName || detailsArray[0].name || 'N/A')
    : 'N/A';

  const handleExportPDF = (item) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <title>${item.tax_year || ''} E-Sign Audit Log - ${customerName}</title>
    <style>
      body { font-family: monospace; white-space: pre; padding: 40px; font-size: 14px; line-height: 1.5; color: #000; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>====================================================================
ELECTRONIC CONSENT AUDIT LOG - ORIENTAL BUSINESS SOLUTIONS INC.
====================================================================
Document Type:       Form T183 (Information Return for Electronic Filing)
Tax Module Track:    Tax Workflow
Target Tax Year:     ${item.tax_year || 'N/A'}
OneDrive File Ref:   ${item.file_name || 'N/A'}

Client Name:         ${customerName}
Client Email:        ${item.email || 'N/A'}
Secure Portal Token: ${item.portal_token || 'N/A'}

Execution Metadata:
------------------
CRA EFILE Date:      ${item.consent_date || (item.consent_timestamp ? item.consent_timestamp.split(' ')[0] : 'N/A')}
CRA EFILE Time:      ${item.consent_time || (item.consent_timestamp ? item.consent_timestamp.split(' ')[1] + ' ' + item.consent_timestamp.split(' ')[2] : 'N/A')}
Public IP Address:   ${item.public_ip || 'N/A'}
Resolved Location:   ${item.resolved_location || item.client_location || 'N/A'}
Device Platform:     ${item.device_platform || 'N/A'}
Browser Engine:      ${item.browser_engine || 'N/A'}

Legal Declaration (Form T183 Part F Compliance):
-----------------------------------------------
By checking the authorization box and clicking "Confirm", the user 
explicitly declares that the information given in their electronic return 
is correct and complete, and that they select EFILE transmission.

[Electronic Confirmation - SECURELY LOGGED]
Authorized By:       ${item.typed_name || customerName}
Consent Status:      VERIFIED / ${item.agreed_to_file ? 'Agreed to File' : 'Did Not Agree'}
====================================================================</body>
  <script>
    window.onload = function() {
      window.print();
      // Automatically close the popup window after the user closes the print dialog
      setTimeout(() => { window.close(); }, 100);
    }
  </script>
</html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1550 }}>
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content border-0 shadow">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">
                📊 eSign Details - {customerName}
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {detailsArray.length === 0 ? (
                <p>No e-sign details available.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Action</th>
                        <th>Tax Year</th>
                        <th>File Name</th>
                        <th>Status</th>
                        <th>Agreed</th>
                        <th>Consent Timestamp</th>
                        <th>Typed Name</th>
                        <th>IP Address</th>
                        <th>Location</th>
                        <th>Platform</th>
                        <th>Browser Engine</th>
                        <th>Link</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsArray.map((item, index) => (
                        <tr key={item.id || index}>
                          <td>
                            <button className="btn btn-sm btn-outline-primary text-nowrap" onClick={() => handleExportPDF(item)}>Export Report</button>
                          </td>
                          <td>{item.tax_year || 'N/A'}</td>
                          <td style={{ maxWidth: '150px' }} className="text-truncate" title={item.file_name}>{item.file_name || 'N/A'}</td>
                          <td>
                            <span className="badge bg-secondary">{item.status || 'N/A'}</span>
                          </td>
                          <td>{item.agreed_to_file ? 'Yes' : 'No'}</td>
                          <td>{item.consent_timestamp || 'N/A'}</td>
                          <td>{item.typed_name || 'N/A'}</td>
                          <td>{item.public_ip || 'N/A'}</td>
                          <td>{item.resolved_location || item.client_location || 'N/A'}</td>
                          <td>{item.device_platform || 'N/A'}</td>
                          <td style={{ maxWidth: '150px' }} className="text-truncate" title={item.browser_engine}>{item.browser_engine || 'N/A'}</td>
                          <td>
                            {item.shared_link ? (
                              <a
                                href={item.shared_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-decoration-none"
                              >
                                Link
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>{item.createdAt || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer bg-light border-0">
              <button type="button" className="btn btn-secondary px-4" onClick={onClose}>Close Dashboard</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1540 }}></div>
    </>
  );
};

export default ESignDetailsModal;
