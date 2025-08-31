import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import ProducerDashboard from './pages/ProducerDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import Marketplace from './pages/Marketplace';
import TransactionHistory from './pages/TransactionHistory';
import RegulatoryPage from './pages/RegulatoryPage';
import CreditsPage from './pages/CreditsPage';
import RoleSelectionModal from './components/RoleSelectionModal';

const AppContent: React.FC = () => {
  const { needsRoleSelection, signUp } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);

  React.useEffect(() => {
    console.log('App - needsRoleSelection changed:', needsRoleSelection);
    console.log('App - Setting showRoleModal to:', needsRoleSelection);
    setShowRoleModal(needsRoleSelection);
  }, [needsRoleSelection]);

  // Debug current state
  console.log('App render - needsRoleSelection:', needsRoleSelection, 'showRoleModal:', showRoleModal);

  const handleRoleSelection = async (role: 'PRODUCER' | 'BUYER', name: string) => {
    console.log('App - Role selected:', role, 'Name:', name);
    await signUp(name, role);
    setShowRoleModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/producer" element={<ProducerDashboard />} />
          <Route path="/verifier" element={<VerifierDashboard />} />
          <Route path="/buyer" element={<BuyerDashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/regulatory" element={<RegulatoryPage />} />
          <Route path="/credits" element={<CreditsPage />} />
        </Routes>
      </main>
      
      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => {
          console.log('App - Role selection modal closed');
          setShowRoleModal(false);
        }}
        onSelectRole={handleRoleSelection}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
