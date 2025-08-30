import React, { useState } from 'react';
import { Wallet, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const WalletConnect: React.FC = () => {
  const { account, user, isConnecting, connectWallet, signUp } = useAuth();
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Auto-signup when wallet is connected but user doesn't exist
  React.useEffect(() => {
    const autoSignUp = async () => {
      if (account && !user && !isSigningUp) {
        setIsSigningUp(true);
        try {
          await signUp(); // No name required - backend will auto-generate
        } catch (error) {
          console.error('Auto sign up error:', error);
        } finally {
          setIsSigningUp(false);
        }
      }
    };

    autoSignUp();
  }, [account, user, signUp, isSigningUp]);

  // If wallet is connected and user exists, show success state
  if (account && user) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Welcome, {user.name}!
        </h3>
        <p className="text-gray-600 mb-4">
          Your wallet is connected and you're ready to use the marketplace.
        </p>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">
            Role: <span className="font-medium text-gray-900">{user.role}</span>
          </p>
        </div>
      </div>
    );
  }

  // If wallet is connected but user doesn't exist, show auto-signup loading state
  if (account && !user) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="h-8 w-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Setting Up Your Account
        </h3>
        <p className="text-gray-600 mb-6">
          Your wallet is connected. We're creating your account automatically...
        </p>

        <div className="flex items-center justify-center space-x-2">
          <Loader className="h-5 w-5 animate-spin text-primary-600" />
          <span className="text-primary-600 font-medium">Creating Account...</span>
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> You'll be registered as a Producer by default. 
            Contact an admin to become a Verifier if needed.
          </p>
        </div>
      </div>
    );
  }

  // If wallet is not connected, show connect button
  return (
    <div className="card max-w-md mx-auto text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Wallet className="h-8 w-8 text-gray-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Connect Your Wallet
      </h3>
      
      <p className="text-gray-600 mb-6">
        Connect your MetaMask wallet to access the Green Hydrogen Credit Marketplace.
      </p>

      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="btn-primary w-full flex items-center justify-center space-x-2"
      >
        {isConnecting ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            <span>Connect MetaMask</span>
          </>
        )}
      </button>

      <div className="mt-6 space-y-3">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>Requirements:</strong>
          </p>
          <ul className="text-sm text-yellow-700 mt-1 space-y-1">
            <li>• MetaMask browser extension installed</li>
            <li>• Connected to Ethereum Sepolia Testnet</li>
            <li>• Some test ETH for transactions</li>
          </ul>
        </div>

        <div className="text-xs text-gray-500">
          Don't have MetaMask? 
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 ml-1"
          >
            Download it here
          </a>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
