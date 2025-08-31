import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import RoleSelectionModal from '../components/RoleSelectionModal';

const WelcomePage: React.FC = () => {
  const { account, user, connectWallet, signUp, isConnecting } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  const handleRoleSelection = async (role: 'PRODUCER' | 'BUYER', name: string) => {
    await signUp(name, role);
    setShowRoleModal(false);
  };

  // Show role selection modal when wallet is connected but no user exists
  React.useEffect(() => {
    if (account && !user) {
      setShowRoleModal(true);
    }
  }, [account, user]);

  if (user) {
    // User is logged in, redirect to appropriate dashboard
    return null; // This will be handled by routing
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Green Hydrogen Marketplace
            </h1>
            <p className="text-gray-600">
              Trade verified green hydrogen credits on the blockchain
            </p>
          </div>

          {!account ? (
            <div className="space-y-4">
              <p className="text-gray-700">
                Connect your wallet to get started
              </p>
              <button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-green-600 font-medium">
                Wallet Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </p>
              <p className="text-gray-600">
                Setting up your account...
              </p>
            </div>
          )}
        </div>
      </div>

      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSelectRole={handleRoleSelection}
      />
    </div>
  );
};

export default WelcomePage;
