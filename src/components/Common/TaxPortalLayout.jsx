import React from 'react';
import DataPageHeader from './DataPageHeader';
import EmailDraftModal from './EmailDraftModal';

const TaxPortalLayout = ({ 
  title, 
  description, 
  taxEntries, 
  portalState, 
  isFluid = false,
  children 
}) => {
  const {
    account, msalInstance, isInitialized, 
    dialNumber, setDialNumber, 
    refreshTrigger, 
    isDialerOpen, setIsDialerOpen,
    handleLogin, handleLogout,
    emailModalConfig, setEmailModalConfig
  } = portalState;

  const content = (
    <>
      <DataPageHeader
        title={title}
        description={description}
        account={account}
        onLogin={handleLogin}
        onLogout={handleLogout}
        msalInstance={msalInstance}
        isInitialized={isInitialized}
        taxEntries={taxEntries}
        dialNumber={dialNumber}
        setDialNumber={setDialNumber}
        refreshTrigger={refreshTrigger}
        isDialerOpen={isDialerOpen}
        setIsDialerOpen={setIsDialerOpen}
      />
      {children}
      
      {emailModalConfig && (
        <EmailDraftModal 
          customerData={emailModalConfig.customer}
          action={emailModalConfig.action}
          taxType={emailModalConfig.taxType}
          customData={emailModalConfig.customData}
          msalInstance={msalInstance}
          account={account}
          onClose={() => setEmailModalConfig(null)}
        />
      )}
    </>
  );

  return (
    <div 
      className={`container${isFluid ? '-fluid py-4' : ' py-5'} position-relative page-with-dialer ${isDialerOpen ? 'dialer-open' : ''}`} 
      style={{ 
        minHeight: '100vh',
        transition: 'padding-right 0.3s ease',
        backgroundColor: isFluid ? '#f8f9fa' : 'transparent'
      }}
    >
      {isFluid ? <div className="container">{content}</div> : content}
    </div>
  );
};

export default TaxPortalLayout;