import React, { useState } from 'react';
import { loginRequest, getApiUrl } from '../authConfig';
import { useTaxPortal } from '../utils/useTaxPortal';
import TaxPortalLayout from '../components/Common/TaxPortalLayout';
import FaxForm from '../components/Common/FaxForm';
import { Link } from 'react-router-dom';

const FaxPage = () => {
  const portalState = useTaxPortal();
  const { account, msalInstance, error, setError, message, setMessage } = portalState;

  const [loading, setLoading] = useState(false);

  const handleSendFax = async (formData, resetForm) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      let headers = {};
      if (account) {
        const tokenResponse = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account,
        });
        headers['Authorization'] = `Bearer ${tokenResponse.accessToken}`;
      }

      const response = await fetch(getApiUrl('/api/send-fax'), {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Success! Your fax has been queued and is now being transmitted.`);
        resetForm();
      } else {
        setError(`Could not send fax: ${data.detail || 'The server encountered an error.'}`);
      }
    } catch (err) {
      setError(`Connection Error: Unable to reach the fax service. Please check your internet line.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TaxPortalLayout
      title="CRA Fax Document Portal"
      description="Send tax documents and support files directly to the Canada Revenue Agency."
      portalState={portalState}
    >
      <div className="mb-3">
        <Link to="/fax-dashboard" className="text-decoration-none fw-bold text-primary">← Back to Fax Dashboard</Link>
      </div>

      {/* Alert Status Overlay Modal */}
      {(error || message) && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className={`modal-header text-white ${error ? 'bg-danger' : 'bg-success'}`}>
                <h5 className="modal-title fw-bold">
                  {error ? 'Transmission Failed' : 'Success'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setError(''); setMessage(''); }}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="fs-1 mb-3">
                  {error ? '❌' : '✅'}
                </div>
                <p className="fs-6 mb-0 text-dark">{error || message}</p>
              </div>
              <div className="modal-footer bg-light border-0 justify-content-center">
                <button type="button" className={`btn px-4 fw-bold ${error ? 'btn-danger' : 'btn-success'}`} onClick={() => { setError(''); setMessage(''); }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {account ? (
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-4 p-md-5">
                <FaxForm 
                  onSubmit={handleSendFax} 
                  initialSenderName="Ashok Manickam" 
                  initialSenderEmail="fax@orientalbiz.ca" 
                  loading={loading}
                  errorCallback={setError}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-warning border-start border-warning border-4 shadow-sm">
          Access Denied: Please log in using your user account to access the secure document transmission system.
        </div>
      )}
    </TaxPortalLayout>
  );
};

export default FaxPage;