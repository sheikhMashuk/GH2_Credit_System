import React, { useState } from 'react';
import { ShoppingCart, Loader, Calendar, MapPin, Scale, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { MarketplaceListing } from '../types';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../utils/api';

interface CreditCardProps {
  listing: MarketplaceListing;
  onPurchaseSuccess?: () => void;
}

const CreditCard: React.FC<CreditCardProps> = ({ listing, onPurchaseSuccess }) => {
  const { account, user } = useAuth();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!account || !user) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (listing.producer.walletAddress.toLowerCase() === account.toLowerCase()) {
      toast.error('You cannot purchase your own credit');
      return;
    }

    setIsPurchasing(true);

    try {
      // Use fixed credit price: 1 credit = 0.001 ETH
      const FIXED_PRICE_PER_CREDIT_ETH = 0.001;
      const totalPriceETH = listing.credits * FIXED_PRICE_PER_CREDIT_ETH;
      const priceInWei = (totalPriceETH * 1e18).toString(); // Convert ETH to wei

      // Trigger MetaMask payment transaction
      const { ethereum } = window as any;
      if (!ethereum) {
        toast.error('MetaMask not found. Please install MetaMask.');
        return;
      }

      // Simplified gas estimation without ethers dependency
      // Use MetaMask's built-in gas estimation
      let gasLimit = '0x5208'; // Default 21000 for ETH transfer
      let gasPrice = '0x4A817C800'; // Default 20 gwei
      
      try {
        // Get current gas price from MetaMask
        const currentGasPrice = await ethereum.request({
          method: 'eth_gasPrice'
        });
        
        // Use 80% of current gas price for optimization
        const gasPriceBigInt = BigInt(currentGasPrice);
        const optimizedGasPrice = (gasPriceBigInt * BigInt(80)) / BigInt(100);
        gasPrice = `0x${optimizedGasPrice.toString(16)}`;
        
        // Estimate gas for the transaction
        const estimatedGas = await ethereum.request({
          method: 'eth_estimateGas',
          params: [{
            to: listing.producer.walletAddress,
            from: account,
            value: `0x${BigInt(priceInWei).toString(16)}`
          }]
        });
        
        // Add 10% buffer to estimated gas
        const gasLimitBigInt = (BigInt(estimatedGas) * BigInt(110)) / BigInt(100);
        gasLimit = `0x${gasLimitBigInt.toString(16)}`;
        
      } catch (gasError) {
        console.warn('Gas estimation failed, using defaults:', gasError);
      }

      // Request payment through MetaMask with optimized gas
      const transactionParameters = {
        to: listing.producer.walletAddress,
        from: account,
        value: `0x${BigInt(priceInWei).toString(16)}`,
        gas: gasLimit,
        gasPrice: gasPrice,
      };

      console.log('Initiating MetaMask payment:', {
        credits: listing.credits,
        priceETH: totalPriceETH,
        priceWei: priceInWei,
        to: listing.producer.walletAddress
      });

      // Show MetaMask payment prompt
      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      console.log('Payment transaction sent:', txHash);
      toast.success('Payment sent! Waiting for confirmation...');

      // Wait for transaction confirmation (simplified)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Send purchase request to backend with transaction hash and payment amount
      await ApiService.purchaseCredits({
        listingId: listing.id,
        quantity: listing.credits,
        transactionHash: txHash,
        paymentAmount: totalPriceETH.toString()
      });

      toast.success('Credit purchased successfully with ETH payment!');
      onPurchaseSuccess?.();
    } catch (error: any) {
      console.error('Purchase error:', error);
      
      if (error.code === 4001) {
        toast.error('Payment cancelled by user');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Only buyers can purchase credits.');
      } else if (error.response?.status === 404) {
        toast.error('Listing not found or no longer available.');
      } else if (error.response?.status === 400) {
        toast.error('Insufficient credits available.');
      } else {
        toast.error('Purchase failed. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleViewDetails = () => {
    console.log('View credit details:', listing);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Green Hydrogen Credit #{listing.creditId}
          </h3>
          <p className="text-sm text-gray-600">
            Credit ID: {listing.creditId}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {(listing.credits * 0.001).toFixed(3)} ETH
          </div>
          <p className="text-xs text-gray-500">
            ≈ ${(listing.credits * 0.001 * 2000).toFixed(2)} USD
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Production: {formatDate(listing.productionDate)}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span>Location: {listing.location}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Scale className="w-4 h-4 mr-2" />
          <span>Quantity: {listing.quantity} kg H₂</span>
        </div>
      </div>

      <div className="border-t pt-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Producer:</span>
          <span className="font-medium">{listing.producer.name}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Available Credits:</span>
          <span className="font-medium">{listing.credits} credits</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Total Value:</span>
          <span className="font-medium text-green-600">{(listing.credits * 0.001).toFixed(3)} ETH</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handlePurchase}
          disabled={isPurchasing || listing.status !== 'ACTIVE'}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isPurchasing ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Purchasing...
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              {listing.status === 'ACTIVE' ? 'Purchase' : 'Sold'}
            </>
          )}
        </button>
        
        <button
          onClick={handleViewDetails}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="View Details"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 pt-3 border-t">
        <div className="text-xs text-gray-500 space-y-1">
          <div>Listed: {formatDate(listing.listedAt)}</div>
          <div>Status: <span className={`font-medium ${listing.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'}`}>{listing.status}</span></div>
        </div>
      </div>
    </div>
  );
};

export default CreditCard;
