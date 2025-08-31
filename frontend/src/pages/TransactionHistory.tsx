import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight, Search, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiService } from '../utils/api';
import { Transaction } from '../types';

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchAddress, setSearchAddress] = useState('');
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getTransactionHistory();
      setTransactions(response || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchAddress.trim()) {
      fetchTransactions();
      return;
    }

    try {
      setIsLoading(true);
      const response = await ApiService.getTransactionHistory({ address: searchAddress.trim() });
      setTransactions(response || []);
    } catch (error) {
      console.error('Error searching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(`${type}-${text}`));
      toast.success(`${type} copied to clipboard!`);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(`${type}-${text}`);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'CREDIT_PURCHASE':
        return 'bg-blue-100 text-blue-800';
      case 'CREDIT_GENERATION':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Public Transaction History
          </h1>
          <p className="text-gray-600">
            View all credit transactions on the Green Hydrogen Marketplace
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="Search by wallet address..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </button>
            <button
              onClick={() => {
                setSearchAddress('');
                fetchTransactions();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Transactions
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Loading transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Transactions Found
              </h3>
              <p className="text-gray-600">
                {searchAddress ? 'No transactions found for this address.' : 'No transactions have been recorded yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                        {transaction.type.replace('_', ' ')}
                      </span>
                      {transaction.burnStatus === 'BURNED_AND_RETIRED' && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                          🔥 BURNED
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {transaction.credits} Credits
                      </div>
                      {transaction.creditsBurned && (
                        <div className="text-xs text-orange-600 font-medium">
                          {transaction.creditsBurned} Burned & Retired
                        </div>
                      )}
                      {transaction.credits && (
                        <div className="text-sm text-gray-600">
                          ${(transaction.credits * 0.001 * 2000).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">From</div>
                        <button
                          onClick={() => copyToClipboard(transaction.fromAddress, 'From Address')}
                          className="font-mono text-sm text-gray-900 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                          title="Click to copy full address"
                        >
                          {formatAddress(transaction.fromAddress)}
                          {copiedItems.has(`From Address-${transaction.fromAddress}`) ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">To</div>
                        <button
                          onClick={() => copyToClipboard(transaction.toAddress, 'To Address')}
                          className="font-mono text-sm text-gray-900 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                          title="Click to copy full address"
                        >
                          {formatAddress(transaction.toAddress)}
                          {copiedItems.has(`To Address-${transaction.toAddress}`) ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {transaction.transactionHash && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Transaction Hash</div>
                        <button
                          onClick={() => copyToClipboard(transaction.transactionHash, 'Transaction Hash')}
                          className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                          title="Click to copy full transaction hash"
                        >
                          {transaction.transactionHash}
                          {copiedItems.has(`Transaction Hash-${transaction.transactionHash}`) ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      {transaction.status && (
                        <span className="text-xs text-gray-500">
                          Status: <span className="font-medium text-green-600">{transaction.status}</span>
                        </span>
                      )}
                      {transaction.burnStatus === 'BURNED_AND_RETIRED' && (
                        <span className="text-xs text-orange-600 font-medium">
                          ♻️ Carbon Offset Achieved
                        </span>
                      )}
                    </div>
                    {transaction.ipfsHash && (
                      <div className="text-right">
                        <button
                          onClick={() => copyToClipboard(transaction.ipfsHash!, 'IPFS Hash')}
                          className="text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                          title="Click to copy IPFS hash - permanent record"
                        >
                          📁 IPFS Record
                          {copiedItems.has(`IPFS Hash-${transaction.ipfsHash}`) ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
