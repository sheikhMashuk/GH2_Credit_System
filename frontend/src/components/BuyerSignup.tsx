import React, { useState } from 'react';
import { Building2, Wallet, User, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiService } from '../utils/api';

interface BuyerSignupProps {
  onSuccess?: (user: any) => void;
  onCancel?: () => void;
}

const BuyerSignup: React.FC<BuyerSignupProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    walletAddress: '',
    organizationType: 'CORPORATE',
    organizationName: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const organizationTypes = [
    { value: 'CORPORATE', label: 'Corporate Entity', icon: Building2 },
    { value: 'ENERGY_COMPANY', label: 'Energy Company', icon: Building2 },
    { value: 'GOVERNMENT', label: 'Government Agency', icon: Building2 },
    { value: 'INDUSTRIAL', label: 'Industrial Manufacturer', icon: Building2 }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.walletAddress || !formData.organizationName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await ApiService.signup({
        name: formData.organizationName,
        walletAddress: formData.walletAddress,
        role: 'BUYER'
      });

      toast.success('Buyer account created successfully!');
      onSuccess?.(response.user);
    } catch (error: any) {
      console.error('Buyer signup error:', error);
      
      if (error.response?.status === 409) {
        toast.error('A user with this wallet address already exists');
      } else if (error.response?.status === 400) {
        toast.error('Invalid wallet address format');
      } else {
        toast.error('Failed to create buyer account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
          setFormData(prev => ({
            ...prev,
            walletAddress: accounts[0]
          }));
          toast.success('Wallet connected successfully');
        }
      } catch (error) {
        toast.error('Failed to connect wallet');
      }
    } else {
      toast.error('Please install MetaMask to connect your wallet');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Register as Buyer</h2>
        <p className="text-gray-600 mt-2">
          Join the marketplace to purchase green hydrogen credits
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Organization Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Type *
          </label>
          <select
            value={formData.organizationType}
            onChange={(e) => setFormData(prev => ({ ...prev, organizationType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {organizationTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Organization Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={formData.organizationName}
              onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
              placeholder="Enter your organization name"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Wallet Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wallet Address *
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.walletAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                placeholder="0x..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="button"
              onClick={connectWallet}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Connect
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating Account...
            </>
          ) : (
            <>
              Register as Buyer
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Cancel Button */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">As a Buyer, you can:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Browse available green hydrogen credits</li>
          <li>• Purchase credits for carbon offset</li>
          <li>• Track your credit portfolio</li>
          <li>• Access detailed production data</li>
        </ul>
      </div>
    </div>
  );
};

export default BuyerSignup;
