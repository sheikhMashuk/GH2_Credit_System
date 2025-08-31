import React from 'react';
import CreditsList from '../components/CreditsList';

const CreditsPage: React.FC = () => {
  return (
    <div className="credits-page">
      <div className="page-header" style={{ 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderBottom: '1px solid #dee2e6' 
      }}>
        <h1>Green Hydrogen Credits</h1>
        <p>View all credits stored on IPFS with blockchain verification</p>
      </div>
      
      <CreditsList />
    </div>
  );
};

export default CreditsPage;
