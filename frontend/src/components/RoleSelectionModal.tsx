import React, { useState } from 'react';
import { User, ShoppingCart, X } from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'PRODUCER' | 'BUYER', name: string) => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
}) => {
  const [selectedRole, setSelectedRole] = useState<'PRODUCER' | 'BUYER'>('PRODUCER');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    console.log('RoleSelectionModal - Submitting role:', selectedRole, 'name:', name.trim());
    onSelectRole(selectedRole, name.trim());
  };

  console.log('RoleSelectionModal - Rendering with isOpen:', isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome to Green Hydrogen Marketplace
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Please select your role and provide your name to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Your Role
            </label>
            <div className="grid grid-cols-1 gap-3">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedRole === 'PRODUCER'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRole('PRODUCER')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedRole === 'PRODUCER' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <User className={`h-5 w-5 ${
                      selectedRole === 'PRODUCER' ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Producer</h3>
                    <p className="text-sm text-gray-500">
                      Generate and sell green hydrogen credits
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedRole === 'BUYER'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRole('BUYER')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedRole === 'BUYER' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <ShoppingCart className={`h-5 w-5 ${
                      selectedRole === 'BUYER' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Buyer</h3>
                    <p className="text-sm text-gray-500">
                      Purchase green hydrogen credits from marketplace
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your name"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            disabled={!name.trim()}
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
