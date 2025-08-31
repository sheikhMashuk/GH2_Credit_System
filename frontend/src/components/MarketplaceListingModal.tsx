import React, { useState } from 'react';
import { X, DollarSign, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiService } from '../utils/api';

interface MarketplaceListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any;
  onListingCreated: () => void;
  totalAvailableCredits?: number;
}

const MarketplaceListingModal: React.FC<MarketplaceListingModalProps> = ({
  isOpen,
  onClose,
  submission,
  onListingCreated,
  totalAvailableCredits
}) => {
  const [creditsToSell, setCreditsToSell] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Fixed price: 1 credit = 0.001 ETH
  const FIXED_PRICE_PER_CREDIT_ETH = 0.001;

  if (!isOpen) return null;

  // Use totalAvailableCredits when submission is null (bulk listing mode)
  const availableCredits = totalAvailableCredits || submission?.credits || 0;
  const isSubmissionMode = !!submission;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!creditsToSell) {
      toast.error('Please enter credits to sell');
      return;
    }

    const creditsNum = parseFloat(creditsToSell);

    if (creditsNum <= 0 || creditsNum > availableCredits) {
      toast.error(`Credits to sell must be between 1 and ${availableCredits}`);
      return;
    }

    setIsLoading(true);
    try {
      await ApiService.createMarketplaceListing({
        creditId: isSubmissionMode ? submission.creditId : 'bulk',
        pricePerCredit: FIXED_PRICE_PER_CREDIT_ETH,
        creditsToSell: creditsNum
      });
      
      toast.success('Marketplace listing created successfully!');
      onListingCreated();
      onClose();
      setCreditsToSell('');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to create marketplace listing');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Create Marketplace Listing</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">
            {isSubmissionMode ? 'Credit Details' : 'Available Credits'}
          </h3>
          <div className="text-sm text-gray-600">
            {isSubmissionMode ? (
              <>
                <p><strong>Credit ID:</strong> {submission.creditId}</p>
                <p><strong>Available Credits:</strong> {submission.credits}</p>
                <p><strong>Location:</strong> {submission.productionData?.location}</p>
                <p><strong>Production Date:</strong> {new Date(submission.productionData?.productionDate).toLocaleDateString()}</p>
              </>
            ) : (
              <>
                <p><strong>Total Available Credits:</strong> {totalAvailableCredits}</p>
                <p className="text-green-600 mt-1">You can list any amount of your available credits for sale.</p>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="inline w-4 h-4 mr-1" />
              Credits to Sell
            </label>
            <input
              type="number"
              value={creditsToSell}
              onChange={(e) => setCreditsToSell(e.target.value)}
              max={availableCredits}
              min="1"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter credits to sell"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum: {availableCredits} credits
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="inline w-4 h-4 mr-1" />
              Fixed Price per Credit
            </label>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
              <strong>{FIXED_PRICE_PER_CREDIT_ETH} ETH</strong> per credit (Fixed Rate)
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Price is fixed at 1 credit = 0.001 ETH on Sepolia testnet
            </p>
          </div>

          {creditsToSell && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>Total Listing Value:</strong> {(FIXED_PRICE_PER_CREDIT_ETH * parseFloat(creditsToSell)).toFixed(6)} ETH
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarketplaceListingModal;
