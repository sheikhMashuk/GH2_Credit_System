import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BlockchainUtils } from '../utils/blockchain';

const Header: React.FC = () => {
  const { account, user, disconnect } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/marketplace', label: 'Marketplace' },
    { path: '/regulatory', label: 'Regulatory Authority' },
  ];

  // Add role-specific navigation
  if (user?.role === 'PRODUCER') {
    navLinks.push({ path: '/producer', label: 'Producer Dashboard' });
  }
  
  if (user?.role === 'VERIFIER') {
    navLinks.push({ path: '/verifier', label: 'Verifier Dashboard' });
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-green-600 p-2 rounded-lg">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Green Hydrogen
                </h1>
                <p className="text-xs text-gray-500">Credit Marketplace</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {user.role === 'REGULATORY_AUTHORITY' ? (
                      user.role
                    ) : (
                      `${account ? BlockchainUtils.shortenAddress(account) + ' • ' : ''}${user.role}`
                    )}
                  </p>
                </div>
                
                {/* User Avatar */}
                <div className="bg-primary-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-primary-600" />
                </div>

                {/* Disconnect/Logout Button */}
                <button
                  onClick={disconnect}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title={user.role === 'REGULATORY_AUTHORITY' ? 'Logout' : 'Disconnect Wallet'}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : account ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {BlockchainUtils.shortenAddress(account)}
                  </p>
                  <p className="text-xs text-red-500">Not registered</p>
                </div>
                <button
                  onClick={disconnect}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Disconnect Wallet"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Connect wallet to get started
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-4 py-2 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
