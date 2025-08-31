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
  const { account } = useAuth();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handlePurchaseClick = () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (listing.producer.walletAddress.toLowerCase() === account.toLowerCase()) {
      toast.error('You cannot purchase your own credit');
      return;
    }

    setShowPurchaseModal(true);
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    setShowPurchaseModal(false);

    try {
      // Use fixed credit price: 1 credit = 0.001 ETH (as defined in smart contract)
      const FIXED_PRICE_PER_CREDIT_ETH = 0.001;
      const totalPriceETH = purchaseQuantity * FIXED_PRICE_PER_CREDIT_ETH;
      const priceInWei = (totalPriceETH * 1e18).toString(); // Convert ETH to wei

      console.log('Purchase Details:', {
        quantity: purchaseQuantity,
        pricePerCredit: FIXED_PRICE_PER_CREDIT_ETH,
        totalPriceETH,
        priceInWei,
        availableCredits: listing.credits
      });

      // Validate quantity
      if (purchaseQuantity > listing.credits) {
        toast.error(`Only ${listing.credits} credits available`);
        return;
      }

      if (purchaseQuantity < 1) {
        toast.error('Quantity must be at least 1');
        return;
      }

      // Trigger MetaMask payment transaction
      const { ethereum } = window as any;
      if (!ethereum) {
        toast.error('MetaMask not found. Please install MetaMask.');
        return;
      }

      // Check if we're on Sepolia testnet
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') { // Sepolia chain ID
        toast.error('Please switch to Ethereum Sepolia Testnet');
        return;
      }

      // Optimized gas settings for Sepolia
      let gasLimit = '0x7530'; // 30000 gas limit for simple transfers
      let gasPrice = '0x2540be400'; // 10 gwei for Sepolia
      
      try {
        // Get current gas price from network
        const currentGasPrice = await ethereum.request({
          method: 'eth_gasPrice'
        });
        
        // Use 90% of current gas price for faster confirmation
        const gasPriceBigInt = BigInt(currentGasPrice);
        const optimizedGasPrice = (gasPriceBigInt * BigInt(90)) / BigInt(100);
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
        
        // Add 20% buffer to estimated gas for safety
        const gasLimitBigInt = (BigInt(estimatedGas) * BigInt(120)) / BigInt(100);
        gasLimit = `0x${gasLimitBigInt.toString(16)}`;
        
      } catch (gasError) {
        console.warn('Gas estimation failed, using defaults:', gasError);
      }

      // Request payment through MetaMask
      const transactionParameters = {
        to: listing.producer.walletAddress,
        from: account,
        value: `0x${BigInt(priceInWei).toString(16)}`,
        gas: gasLimit,
        gasPrice: gasPrice,
      };

      console.log('Initiating Sepolia ETH payment:', {
        quantity: purchaseQuantity,
        totalCredits: listing.credits,
        priceETH: totalPriceETH,
        priceWei: priceInWei,
        producer: listing.producer.walletAddress,
        gasLimit,
        gasPrice
      });

      toast.loading('Please confirm the transaction in MetaMask...');

      // Show MetaMask payment prompt
      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      console.log('Payment transaction sent:', txHash);
      toast.dismiss();
      toast.success('Payment sent! Processing purchase...');

      // Wait for transaction to be mined (increased timeout for Sepolia)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Send purchase request to backend with transaction details
      await ApiService.purchaseCredits({
        listingId: listing.id,
        quantity: purchaseQuantity,
        transactionHash: txHash,
        paymentAmount: priceInWei // Send wei amount for backend verification
      });

      toast.success(`Successfully purchased ${purchaseQuantity} credits with ETH payment!`);
      onPurchaseSuccess?.();
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.dismiss();
      
      if (error.code === 4001) {
        toast.error('Payment cancelled by user');
      } else if (error.code === -32603) {
        toast.error('Insufficient ETH balance for transaction');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Only buyers can purchase credits.');
      } else if (error.response?.status === 404) {
        toast.error('Listing not found or no longer available.');
      } else if (error.response?.status === 400) {
        toast.error('Insufficient credits available or invalid quantity.');
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
          onClick={handlePurchaseClick}
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

      {/* Purchase Quantity Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Purchase Green Hydrogen Credits</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Credits to Purchase
                </label>
                <input
                  type="number"
                  min="1"
                  max={listing.credits}
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(Math.min(parseInt(e.target.value) || 1, listing.credits))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: {listing.credits} credits
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Credits:</span>
                  <span className="font-medium">{purchaseQuantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Price per credit:</span>
                  <span className="font-medium">0.001 ETH</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-2">
                  <span>Total Cost:</span>
                  <span className="text-green-600">
                    {(purchaseQuantity * 0.001).toFixed(3)} ETH
                    <span className="text-xs text-gray-500 ml-1">
                      (≈ ${(purchaseQuantity * 0.001 * 2000).toFixed(2)} USD)
                    </span>
                  </span>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                <p className="text-xs text-orange-700">
                  <strong>Note:</strong> Credits will be permanently burned (retired) after purchase for carbon offset benefit.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isPurchasing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Confirm Purchase
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
