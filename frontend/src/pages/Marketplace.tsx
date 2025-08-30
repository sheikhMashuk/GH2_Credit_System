import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, ShoppingCart, TrendingUp, Users, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import CreditCard from '../components/CreditCard';
import { ApiService } from '../utils/api';
import { MarketplaceListing } from '../types';

const Marketplace: React.FC = () => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const fetchMarketplaceData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch listings and stats in parallel
      const [listingsData, statsData] = await Promise.all([
        ApiService.getMarketplaceListings(),
        ApiService.getMarketplaceStats().catch(() => null) // Don't fail if stats fail
      ]);

      setListings(listingsData);
      setStats(statsData);

    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      toast.error('Failed to load marketplace data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMarketplaceData();
    setIsRefreshing(false);
    toast.success('Marketplace data refreshed');
  };

  const handlePurchaseSuccess = () => {
    // Refresh the marketplace after a successful purchase
    handleRefresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-600 mt-1">
            Browse and purchase verified green hydrogen credits
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.totalActiveListings}
                </div>
                <div className="text-gray-600">Available Credits</div>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.totalSold}
                </div>
                <div className="text-gray-600">Credits Sold</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {stats.totalValue}
                </div>
                <div className="text-gray-600">Total Value (MATIC)</div>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {stats.averagePrice}
                </div>
                <div className="text-gray-600">Avg Price (MATIC)</div>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Marketplace Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-600">Loading marketplace...</span>
        </div>
      ) : listings.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-gray-400 mb-4">
            <ShoppingCart className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Credits Available</h3>
          <p className="text-gray-600 mb-6">
            There are currently no green hydrogen credits available for purchase.
          </p>
          <button
            onClick={handleRefresh}
            className="btn-primary"
          >
            Check Again
          </button>
        </div>
      ) : (
        <div>
          {/* Filter and Sort Bar */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-600">
              Showing {listings.length} credit{listings.length !== 1 ? 's' : ''}
            </div>
            
            <div className="flex items-center space-x-4">
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option>Sort by: Newest</option>
                <option>Sort by: Price (Low to High)</option>
                <option>Sort by: Price (High to Low)</option>
                <option>Sort by: Quantity</option>
              </select>
            </div>
          </div>

          {/* Credits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <CreditCard
                key={listing.tokenId}
                listing={listing}
                onPurchaseSuccess={handlePurchaseSuccess}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-16 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            About Green Hydrogen Credits
          </h2>
          <p className="text-gray-600 mb-6">
            Each credit represents verified green hydrogen production. All credits are backed by 
            blockchain technology ensuring transparency and authenticity. When you purchase a credit, 
            you're supporting clean energy production and helping build a sustainable future.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="bg-white rounded-lg p-4">
              <div className="text-green-600 font-semibold mb-2">✓ Verified Production</div>
              <p className="text-gray-600">All credits are verified by certified verifiers before minting</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-blue-600 font-semibold mb-2">✓ Blockchain Secured</div>
              <p className="text-gray-600">Immutable records on Polygon blockchain ensure authenticity</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-purple-600 font-semibold mb-2">✓ Instant Trading</div>
              <p className="text-gray-600">Purchase credits instantly with automatic smart contract execution</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
