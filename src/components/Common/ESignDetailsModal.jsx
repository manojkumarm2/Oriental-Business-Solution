import React from 'react';

const ESignDetailsModal = ({ details, onClose }) => {
  if (!details) return null;

  // Handle both array and single object for backward compatibility
  const detailsArray = Array.isArray(details) ? details : [details];
  
  const customerName = detailsArray.length > 0 
    ? (detailsArray[0].customerName || detailsArray[0].name || 'N/A') 
    : 'N/A';

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
                        <th>Tax Year</th>
                        <th>File Name</th>
                        <th>Status</th>
                        <th>Client Location</th>
                        <th>Agreed To File</th>
                        <th>Created At</th>
                        <th>Shared Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsArray.map((item, index) => (
                        <tr key={item.id || index}>
                          <td>{item.tax_year || 'N/A'}</td>
                          <td>{item.file_name || 'N/A'}</td>
                          <td>
                            <span className="badge bg-secondary">{item.status || 'N/A'}</span>
                          </td>
                          <td>{item.client_location || 'N/A'}</td>
                          <td>{item.agreed_to_file ? 'Yes' : 'No'}</td>
                          <td>{item.createdAt || 'N/A'}</td>
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
