import React, { useState } from 'react';
import { Factory, Building2, Shield } from 'lucide-react';
import ProducerSignup from './ProducerSignup';
import BuyerSignup from './BuyerSignup';

interface RoleSelectionProps {
  onRoleSelected?: (role: string) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelected }) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    {
      id: 'PRODUCER',
      title: 'Green Hydrogen Producer',
      description: 'Generate and sell green hydrogen credits',
      icon: Factory,
      color: 'green',
      features: [
        'Submit production data',
        'Generate verified credits',
        'List credits on marketplace',
        'Track sales and revenue'
      ]
    },
    {
      id: 'BUYER',
      title: 'Credit Buyer',
      description: 'Purchase green hydrogen credits for carbon offsetting',
      icon: Building2,
      color: 'blue',
      features: [
        'Browse available credits',
        'Purchase verified credits',
        'Track credit portfolio',
        'Access production data'
      ]
    },
    {
      id: 'REGULATORY',
      title: 'Regulatory Authority',
      description: 'Verify and approve green hydrogen production',
      icon: Shield,
      color: 'purple',
      features: [
        'Review submissions',
        'Verify production data',
        'Approve credit generation',
        'Monitor compliance'
      ]
    }
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    onRoleSelected?.(roleId);
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

  if (selectedRole === 'PRODUCER') {
    return <ProducerSignup onCancel={handleBack} />;
  }

  if (selectedRole === 'BUYER') {
    return <BuyerSignup onCancel={handleBack} />;
  }

  if (selectedRole === 'REGULATORY') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <Shield className="mx-auto w-16 h-16 text-purple-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Regulatory Authority</h2>
          <p className="text-gray-600 mt-2">
            Please contact the system administrator for regulatory authority access.
          </p>
        </div>
        <button
          onClick={handleBack}
          className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Back to Role Selection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Join the Green Hydrogen Marketplace
        </h1>
        <p className="text-lg text-gray-600">
          Choose your role to get started
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {roles.map((role) => {
          const Icon = role.icon;
          const colorClasses = {
            green: 'border-green-200 hover:border-green-300 bg-green-50',
            blue: 'border-blue-200 hover:border-blue-300 bg-blue-50',
            purple: 'border-purple-200 hover:border-purple-300 bg-purple-50'
          };

          return (
            <div
              key={role.id}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${colorClasses[role.color as keyof typeof colorClasses]}`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <div className="text-center mb-4">
                <Icon className={`mx-auto w-12 h-12 mb-3 text-${role.color}-600`} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {role.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {role.description}
                </p>
              </div>

              <ul className="space-y-2">
                {role.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-700">
                    <div className={`w-2 h-2 bg-${role.color}-500 rounded-full mr-3`}></div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={`w-full mt-4 py-2 px-4 bg-${role.color}-600 text-white rounded-lg hover:bg-${role.color}-700 transition-colors`}>
                Get Started
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelection;
