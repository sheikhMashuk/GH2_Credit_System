import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Eye, History, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../utils/api';
import { MarketplaceListing, Transaction } from '../types';

const BuyerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'marketplace' | 'history'>('history');

  useEffect(() => {
    if (user?.role === 'BUYER') {
      fetchMarketplaceListings();
      fetchPurchaseHistory();
    }
  }, [user]);

  const fetchMarketplaceListings = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getMarketplaceListings();
      setListings(data);
    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
      toast.error('Failed to load marketplace listings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    try {
      setIsLoadingTransactions(true);
      const data = await ApiService.getTransactionHistory({ address: user?.walletAddress });
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      toast.error('Failed to load purchase history');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedListing) return;

    try {
      await ApiService.purchaseCredits({
        listingId: selectedListing.id,
        quantity: purchaseQuantity
      });
      toast.success('Credits purchased successfully!');
      setShowPurchaseModal(false);
      setSelectedListing(null);
      fetchMarketplaceListings(); // Refresh listings
      fetchPurchaseHistory(); // Refresh purchase history
    } catch (error) {
      console.error('Error purchasing credits:', error);
      toast.error('Failed to purchase credits');
    }
  };

  const filteredListings = listings.filter(listing =>
    listing.producer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTransactionStats = () => {
    const successful = transactions.filter(t => t.status === 'CONFIRMED').length;
    const failed = transactions.filter(t => t.status === 'FAILED').length;
    const pending = transactions.filter(t => t.status === 'PENDING').length;
    return { successful, failed, pending, total: transactions.length };
  };

  if (user?.role !== 'BUYER') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <ShoppingCart className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to buyers.</p>
        </div>
      </div>
    );
  }

  const stats = getTransactionStats();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
          <p className="text-gray-600 mt-1">
            View your purchase history and browse marketplace
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="inline w-4 h-4 mr-2" />
              Purchase History
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'marketplace'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShoppingCart className="inline w-4 h-4 mr-2" />
              Marketplace
            </button>
          </nav>
        </div>
      </div>

      {/* Purchase History Tab */}
      {activeTab === 'history' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Successful</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.successful}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Failed</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.failed}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <History className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase History */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Purchases</h2>
            </div>
            
            {isLoadingTransactions ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading purchase history...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchases Yet</h3>
                <p className="text-gray-600">You haven't made any credit purchases yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <div key={transaction._id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {transaction.credits} Credits
                        </div>
                        <div className="text-sm text-gray-600">
                          ${(transaction.credits * 0.001 * 2000).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    {transaction.transactionHash && (
                      <div className="text-xs text-gray-500">
                        Transaction: {transaction.transactionHash.slice(0, 10)}...{transaction.transactionHash.slice(-8)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <>
          {/* Search and Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by producer or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Marketplace Listings */}
          {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading marketplace...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Credits Available</h3>
          <p className="text-gray-600">
            {searchTerm ? 'No credits match your search criteria.' : 'No credits are currently listed for sale.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{listing.producer.name}</h3>
                  <p className="text-sm text-gray-500">{listing.location}</p>
                </div>
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Credits Available:</span>
                  <span className="font-medium">{listing.credits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per Credit:</span>
                  <span className="font-medium">${(0.001 * 2000).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-semibold text-green-600">${(listing.credits * 0.001 * 2000).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Production Date:</span>
                  <span className="text-sm">{new Date(listing.productionDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedListing(listing);
                    setShowPurchaseModal(true);
                    setPurchaseQuantity(1);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Purchase</span>
                </button>
                <button
                  onClick={() => setSelectedListing(listing)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Purchase Credits
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producer
                </label>
                <p className="text-gray-900">{selectedListing.producer.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Credits
                </label>
                <p className="text-gray-900">{selectedListing.credits}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to Purchase
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedListing.credits}
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Price per Credit:</span>
                  <span>${(0.001 * 2000).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Cost:</span>
                  <span>${(0.001 * 2000 * purchaseQuantity).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default BuyerDashboard;
