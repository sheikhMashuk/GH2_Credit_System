// Temporary in-memory marketplace store for development
const fs = require('fs');
const path = require('path');

class InMemoryMarketplace {
  constructor() {
    this.listings = new Map();
    this.transactions = new Map();
    this.nextListingId = 1;
    this.nextTransactionId = 1;
    this.loadFromStorage();
  }

  // Load data from file system (simulating persistence)
  loadFromStorage() {
    try {
      const dataPath = path.join(__dirname, '../../data/marketplace.json');
      
      if (fs.existsSync(dataPath)) {
        const stored = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(stored);
        this.listings = new Map(data.listings.map(([key, value]) => [key, value]));
        this.transactions = new Map(data.transactions.map(([key, value]) => [key, value]));
        this.nextListingId = data.nextListingId;
        this.nextTransactionId = data.nextTransactionId;
        console.log('InMemoryMarketplace - Loaded data from storage');
      }
    } catch (error) {
      console.log('InMemoryMarketplace - No stored data found, starting fresh');
    }
  }

  // Save data to file system (simulating persistence)
  saveToStorage() {
    try {
      const dataDir = path.join(__dirname, '../../data');
      const dataPath = path.join(dataDir, 'marketplace.json');
      
      // Create data directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const data = {
        listings: Array.from(this.listings.entries()),
        transactions: Array.from(this.transactions.entries()),
        nextListingId: this.nextListingId,
        nextTransactionId: this.nextTransactionId
      };
      
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      console.log('InMemoryMarketplace - Saved data to storage');
    } catch (error) {
      console.log('InMemoryMarketplace - Failed to save to storage:', error.message);
    }
  }

  // Create a new marketplace listing
  async createListing(listingData) {
    const id = this.nextListingId.toString();
    this.nextListingId++;
    
    const listing = {
      _id: id,
      ...listingData,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.listings.set(id, listing);
    this.saveToStorage();
    console.log('InMemoryMarketplace: Listing created:', listing._id);
    return listing;
  }

  // Find listing by ID
  async findListingById(id) {
    return this.listings.get(id.toString()) || null;
  }

  // Update listing
  async updateListing(id, updateData) {
    const listing = this.listings.get(id.toString());
    if (!listing) return null;
    
    Object.assign(listing, updateData, { updatedAt: new Date() });
    this.listings.set(id.toString(), listing);
    this.saveToStorage();
    return listing;
  }

  // Find listings with query
  async findListings(query = {}) {
    const listings = Array.from(this.listings.values());
    
    if (query.status) {
      return listings.filter(listing => listing.status === query.status);
    }
    
    if (query.producerId) {
      return listings.filter(listing => listing.producerId === query.producerId);
    }
    
    return listings;
  }

  // Create transaction record
  async createTransaction(transactionData) {
    const id = this.nextTransactionId.toString();
    this.nextTransactionId++;
    
    const transaction = {
      _id: id,
      ...transactionData,
      createdAt: new Date()
    };
    
    this.transactions.set(id, transaction);
    this.saveToStorage();
    console.log('InMemoryMarketplace: Transaction created:', transaction._id);
    return transaction;
  }

  // Find transactions
  async findTransactions(query = {}) {
    const transactions = Array.from(this.transactions.values());
    
    if (query.fromAddress) {
      return transactions.filter(tx => tx.fromAddress === query.fromAddress);
    }
    
    if (query.toAddress) {
      return transactions.filter(tx => tx.toAddress === query.toAddress);
    }
    
    if (query.type) {
      return transactions.filter(tx => tx.type === query.type);
    }
    
    return transactions;
  }

  // Get all listings for debugging
  getAllListings() {
    return Array.from(this.listings.values());
  }

  // Get all transactions for debugging
  getAllTransactions() {
    return Array.from(this.transactions.values());
  }
}

const marketplaceStore = new InMemoryMarketplace();
module.exports = marketplaceStore;
