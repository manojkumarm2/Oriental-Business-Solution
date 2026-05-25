import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../../Assets/nav-logo.png';

const DataPageHeader = ({ title, description, account, onLogin, onLogout }) => {
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

        <div className="action-block d-flex align-items-start justify-content-end">
          {account ? (
            <button className="btn btn-outline-secondary btn-sm" onClick={onLogout}>
              Logout {displayUserName}
            </button>
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
    </header>
  );
};

export default DataPageHeader;
