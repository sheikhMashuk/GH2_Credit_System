import React, { useState } from 'react';
import { Wallet, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const WalletConnect: React.FC = () => {
  const { account, user, isConnecting, connectWallet, signUp } = useAuth();
  const [name, setName] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSigningUp(true);
    try {
      await signUp(name.trim());
      setName('');
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setIsSigningUp(false);
    }
  };

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

  // If wallet is connected but user doesn't exist, show sign up form
  if (account && !user) {
    return (
      <div className="card max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Complete Your Registration
          </h3>
          <p className="text-gray-600">
            Your wallet is connected. Please enter your name to create your account.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Enter your full name"
              required
              disabled={isSigningUp}
            />
          </div>

          <button
            type="submit"
            disabled={isSigningUp || !name.trim()}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {isSigningUp ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
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
