import React, { useState } from 'react';
import { ShoppingCart, Loader, Calendar, MapPin, Scale, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { MarketplaceListing } from '../types';
import { useAuth } from '../context/AuthContext';
import { BlockchainUtils } from '../utils/blockchain';

interface CreditCardProps {
  listing: MarketplaceListing;
  onPurchaseSuccess?: () => void;
}

const CreditCard: React.FC<CreditCardProps> = ({ listing, onPurchaseSuccess }) => {
  const { account, signer } = useAuth();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!account || !signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (listing.producer.toLowerCase() === account.toLowerCase()) {
      toast.error('You cannot purchase your own credit');
      return;
    }

    setIsPurchasing(true);

    try {
      const contract = BlockchainUtils.getContract(signer);
      
      // Get current gas price
      const gasPrice = await BlockchainUtils.getGasPrice(signer.provider!);
      
      // Call buyCredit function
      const tx = await contract.buyCredit(listing.tokenId, {
        value: listing.priceInWei,
        gasPrice: gasPrice.mul(110).div(100), // 10% buffer
      });

      toast.loading('Transaction submitted. Waiting for confirmation...', {
        duration: 0,
        id: 'purchase-tx'
      });

      const receipt = await tx.wait();
      
      toast.dismiss('purchase-tx');
      toast.success('Credit purchased successfully!');
      
      console.log('Purchase successful:', {
        tokenId: listing.tokenId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      });

      // Call success callback
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
      }

    } catch (error: any) {
      console.error('Purchase failed:', error);
      toast.dismiss('purchase-tx');
      
      if (error.code === 4001) {
        toast.error('Transaction cancelled by user');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient MATIC balance');
      } else {
        toast.error('Purchase failed. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const getAttributeValue = (traitType: string): string => {
    const attribute = listing.metadata.attributes?.find(
      attr => attr.trait_type === traitType
    );
    return attribute?.value || 'N/A';
  };

  return (
    <div className="card-hover animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {listing.metadata.name || `Green Hydrogen Credit #${listing.tokenId}`}
          </h3>
          <p className="text-sm text-gray-600">
            Token ID: {listing.tokenId}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
          {parseFloat(listing.price).toFixed(4)} ETH
        </div>
        <p className="text-xs text-gray-500">
          ~${(parseFloat(listing.price) * 2500).toFixed(2)} USD
        </p>
        </div>
      </div>

      {/* Credit Details */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Production: {getAttributeValue('Production Date')}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Scale className="h-4 w-4" />
          <span>Quantity: {getAttributeValue('Quantity (kg)')} kg</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>Location: {getAttributeValue('Location')}</span>
        </div>
      </div>

      {/* Producer Info */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-500 mb-1">Producer</p>
        <p className="text-sm font-medium text-gray-900">
          {BlockchainUtils.shortenAddress(listing.producer)}
        </p>
      </div>

      {/* Verification Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-700 font-medium">
            Verified Credit
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Verified: {getAttributeValue('Verification Date')}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={handlePurchase}
          disabled={isPurchasing || !account}
          className="btn-success flex-1 flex items-center justify-center space-x-2"
        >
          {isPurchasing ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span>Purchasing...</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              <span>Buy Credit</span>
            </>
          )}
        </button>

        {listing.metadata.uri && (
          <button
            onClick={() => window.open(listing.metadata.uri, '_blank')}
            className="btn-secondary px-3"
            title="View Metadata"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>

      {!account && (
        <p className="text-xs text-red-600 mt-2 text-center">
          Connect your wallet to purchase this credit
        </p>
      )}
    </div>
  );
};

export default CreditCard;
