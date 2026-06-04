import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTaxPortal } from '../../utils/useTaxPortal';
import TaxPortalLayout from '../Common/TaxPortalLayout';
import { getApiUrl, loginRequest } from '../../authConfig';
import './FaxDashboard.css';

const FaxDashboard = () => {
  const portalState = useTaxPortal();
  const { account, msalInstance, isInitialized } = portalState;
  const [faxes, setFaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (account && isInitialized) {
      fetchFaxes();
    }
  }, [account, isInitialized]);

  const fetchFaxes = async () => {
    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      const token = tokenResponse.accessToken;
      
      const response = await fetch(getApiUrl('/api/faxes'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load fax logs. Make sure you have admin access.');
      }

      const data = await response.json();
      setFaxes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TaxPortalLayout title="Fax Dashboard" description="View sent and received faxes" portalState={portalState}>
        <div className="p-4 text-center mt-4">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="mt-2 text-muted fw-bold">Loading fax dashboard...</div>
        </div>
      </TaxPortalLayout>
    );
  }

  if (error) {
    return (
      <TaxPortalLayout title="Fax Dashboard" description="View sent and received faxes" portalState={portalState}>
        <div className="p-4 text-danger fw-bold border border-danger rounded bg-danger-subtle mt-3">Error: {error}</div>
      </TaxPortalLayout>
    );
  }

  return (
    <TaxPortalLayout title="Fax Dashboard" description="View sent and received faxes" portalState={portalState}>
      <div className="fax-dashboard-container mt-3 shadow-sm">
        <div className="header-actions mb-4 d-flex justify-content-between align-items-center">
          <h2 className="fs-4 text-secondary fw-bold mb-0">Fax Transmission Dashboard</h2>
          <div className="d-flex gap-2">
            <button onClick={fetchFaxes} className="btn btn-outline-primary shadow-sm">
              🔄 Refresh
            </button>
            <Link to="/send-fax" className="btn btn-primary fw-bold shadow-sm">
              ➕ Send Fax
            </Link>
          </div>
        </div>

      <div className="table-responsive">
        <table className="fax-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Direction</th>
              <th>Sender</th>
              <th>From Number</th>
              <th>To Number</th>
              <th>Status</th>
              <th>Document</th>
            </tr>
          </thead>
          <tbody>
            {faxes.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">No faxes found.</td>
              </tr>
            ) : (
              faxes.map((fax) => (
                <tr key={fax.fax_id}>
                  <td>{new Date(fax.date_time).toLocaleString()}</td>
                  <td>
                    <span className={`badge dir-${fax.direction?.toLowerCase()}`}>
                      {fax.direction?.toUpperCase() || 'OUTBOUND'}
                    </span>
                  </td>
                  <td>
                    <div>{fax.name}</div>
                    <div className="text-sm text-gray">{fax.email}</div>
                  </td>
                  <td>{fax.from_number || 'N/A'}</td>
                  <td>{fax.to_number}</td>
                  <td>
                    <span className={`badge status-${fax.status?.toLowerCase()}`}>
                      {fax.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td>
                    {fax.document_link ? (
                      <a 
                        href={fax.document_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-link"
                      >
                        View PDF
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </TaxPortalLayout>
  );
};

export default FaxDashboard;
