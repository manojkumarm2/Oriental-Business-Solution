import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../../Assets/nav-logo.png';
import CvitpCommunicationsHub from '../Cvitp/CvitpCommunicationsHub';

const DataPageHeader = ({ title, description, account, onLogin, onLogout, msalInstance, isInitialized, taxEntries, dialNumber, setDialNumber, refreshTrigger, isDialerOpen, setIsDialerOpen }) => {
  const location = useLocation();
  const navItems = [
    { to: '/customerData', label: 'Personal Tax' },
    { to: '/corporateData', label: 'Corporate Tax' },
    { to: '/cvitp', label: 'CVITP' },
  ];

  const rawUserName = account?.username || account?.name || 'User';
  const displayUserName = rawUserName.replace(/\.com$/i, '');

  return (
    <header className="data-page-header mb-4">
      <div className="d-flex flex-column flex-xl-row align-items-start justify-content-between gap-4 mb-4">
        <div className="logo-block d-flex align-items-center justify-content-start">
          <Link to="/" className="logo-link d-inline-flex">
            <img src={Logo} alt="OBS_logo" className="img-fluid" style={{ maxWidth: '240px', height: 'auto' }} />
          </Link>
        </div>

        <div className="header-center text-center flex-fill">
          <h1 className="page-title mb-2">{title}</h1>
          <p className="text-muted mb-2">{description}</p>
          {account && (
            <div className="small text-muted">
              Logged in as <strong>{account.username || account.name || 'User'}</strong>
            </div>
          )}
        </div>

        <div className="action-block d-flex align-items-center justify-content-end gap-3">
          {account ? (
            <>
              {setIsDialerOpen && (
                <button 
                  className={`btn btn-success text-white shadow-sm d-flex align-items-center justify-content-center fw-bold dialer-btn ${isDialerOpen ? 'rounded-circle p-0 dialer-btn-open' : 'rounded-pill px-4 gap-2 dialer-btn-closed'}`} 
                  onClick={() => setIsDialerOpen(!isDialerOpen)}
                  title={isDialerOpen ? "Close Dialer" : "Open Dialer"}
                >
                  <span className={isDialerOpen ? 'dialer-icon-open' : 'dialer-icon-closed'}>📞</span>
                  {!isDialerOpen && <span>Open Dialer</span>}
                </button>
              )}
              <button className="btn btn-outline-secondary btn-sm" onClick={onLogout}>
                Logout {displayUserName}
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onLogin}>
              Sign In OrientalBiz
            </button>
          )}
        </div>
      </div>

      <nav className="header-nav">
        <div className="nav d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3" role="tablist">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link text-sm px-5 py-3 ${location.pathname === item.to ? 'active' : 'text-body-secondary'}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Sliding Communications Hub Panel Rendering Logic */}
      {setIsDialerOpen && account && (
        <CvitpCommunicationsHub 
          account={account}
          msalInstance={msalInstance}
          isInitialized={isInitialized}
          taxEntries={taxEntries || []}
          dialNumber={dialNumber}
          setDialNumber={setDialNumber}
          refreshTrigger={refreshTrigger}
          isDialerOpen={isDialerOpen}
          setIsDialerOpen={setIsDialerOpen}
        />
      )}
    </header>
  );
};

export default DataPageHeader;
