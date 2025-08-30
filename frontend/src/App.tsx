import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import ProducerDashboard from './pages/ProducerDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import Marketplace from './pages/Marketplace';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/producer" element={<ProducerDashboard />} />
            <Route path="/verifier" element={<VerifierDashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
