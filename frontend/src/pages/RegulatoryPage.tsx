import React from 'react';
import { useAuth } from '../context/AuthContext';
import RegulatoryLogin from '../components/RegulatoryLogin';
import RegulatoryDashboard from '../components/RegulatoryDashboard';

const RegulatoryPage: React.FC = () => {
  const { user } = useAuth();

  // Show login if not authenticated or not regulatory authority
  if (!user || user.role !== 'REGULATORY_AUTHORITY') {
    return <RegulatoryLogin />;
  }

  // Show dashboard if authenticated as regulatory authority
  return <RegulatoryDashboard />;
};

export default RegulatoryPage;
