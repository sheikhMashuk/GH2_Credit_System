import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Users, Shield, TrendingUp, ArrowRight } from 'lucide-react';
import WalletConnect from '../components/WalletConnect';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { account, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-green-600 p-4 rounded-2xl">
              <Leaf className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Green Hydrogen
            <span className="block text-green-600">Credit Marketplace</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Trade verified green hydrogen production credits as NFTs on the blockchain. 
            Transparent, secure, and sustainable energy trading for the future.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-gray-600">Verified Credits</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Trading Available</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-purple-600 mb-2">0%</div>
              <div className="text-gray-600">Platform Fees</div>
            </div>
          </div>
        </div>

        {/* Wallet Connection or Dashboard Navigation */}
        <div className="mb-16">
          {account && user ? (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome back, {user.name}!
                </h2>
                <p className="text-gray-600">
                  Choose your next action based on your role as a {user.role.toLowerCase()}.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.role === 'PRODUCER' && (
                  <Link
                    to="/producer"
                    className="card-hover group text-left"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Producer Dashboard
                    </h3>
                    <p className="text-gray-600">
                      Submit production data, track verification status, and list credits for sale.
                    </p>
                  </Link>
                )}

                {user.role === 'BUYER' && (
                  <Link
                    to="/buyer"
                    className="card-hover group text-left"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Buyer Dashboard
                    </h3>
                    <p className="text-gray-600">
                      Browse and purchase verified green hydrogen credits from the marketplace.
                    </p>
                  </Link>
                )}

                {user.role === 'VERIFIER' && (
                  <Link
                    to="/verifier"
                    className="card-hover group text-left"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-orange-100 p-3 rounded-lg">
                        <Shield className="h-6 w-6 text-orange-600" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Verifier Dashboard
                    </h3>
                    <p className="text-gray-600">
                      Review pending submissions and verify green hydrogen production claims.
                    </p>
                  </Link>
                )}

                <Link
                  to="/marketplace"
                  className="card-hover group text-left"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Browse Marketplace
                  </h3>
                  <p className="text-gray-600">
                    Discover and purchase verified green hydrogen credits from producers.
                  </p>
                </Link>
              </div>
            </div>
          ) : (
            <WalletConnect />
          )}
        </div>

        {/* How It Works Section */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Producer Signs Up
              </h3>
              <p className="text-gray-600">
                Hydrogen producers connect their wallet and register on the platform.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Submit Production Proof
              </h3>
              <p className="text-gray-600">
                Producers submit documentation of their green hydrogen production.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Verification & Minting
              </h3>
              <p className="text-gray-600">
                Verifiers review submissions and mint NFT credits for approved production.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">4</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Trade on Marketplace
              </h3>
              <p className="text-gray-600">
                Buyers can purchase verified credits directly from the marketplace.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Platform Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Verified Credits
              </h3>
              <p className="text-gray-600">
                All credits are verified by certified verifiers before being minted as NFTs.
              </p>
            </div>

            <div className="card text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Blockchain Transparency
              </h3>
              <p className="text-gray-600">
                Built on Polygon for fast, low-cost transactions with full transparency.
              </p>
            </div>

            <div className="card text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Real-time Trading
              </h3>
              <p className="text-gray-600">
                Instant trading of credits with automatic smart contract execution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
