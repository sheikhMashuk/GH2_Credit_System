// Temporary in-memory user store for development
// Use this when MongoDB Atlas free tier blocks write operations

const bcrypt = require('bcryptjs');

class InMemoryUser {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
    this.loadFromStorage();
  }

  // Load data from file system (simulating persistence)
  loadFromStorage() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataPath = path.join(__dirname, '../../data/users.json');
      
      if (fs.existsSync(dataPath)) {
        const stored = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(stored);
        this.users = new Map(data.users.map(([key, value]) => [key, value]));
        this.nextId = data.nextId;
        console.log('InMemoryUser - Loaded users from storage:', this.users.size);
      }
    } catch (error) {
      console.log('InMemoryUser - No stored data found, starting fresh');
    }
  }

  // Save data to file system (simulating persistence)
  saveToStorage() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(__dirname, '../../data');
      const dataPath = path.join(dataDir, 'users.json');
      
      // Create data directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const data = {
        users: Array.from(this.users.entries()),
        nextId: this.nextId
      };
      
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      console.log('InMemoryUser - Saved users to storage');
    } catch (error) {
      console.log('InMemoryUser - Failed to save to storage:', error.message);
    }
  }

  // Create a new user
  async create(userData) {
    const id = this.nextId++;
    const user = {
      _id: id.toString(),
      name: userData.name,
      walletAddress: userData.walletAddress ? userData.walletAddress.toLowerCase() : undefined,
      email: userData.email ? userData.email.toLowerCase() : undefined,
      password: userData.password ? await bcrypt.hash(userData.password, 12) : undefined,
      role: userData.role || 'PRODUCER',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Check for duplicates
    for (const existingUser of this.users.values()) {
      if (user.walletAddress && existingUser.walletAddress === user.walletAddress) {
        const error = new Error('User with this wallet address already exists');
        error.code = 11000;
        throw error;
      }
      if (user.email && existingUser.email === user.email) {
        const error = new Error('User with this email already exists');
        error.code = 11000;
        throw error;
      }
    }
    
    // Use email as key for regulatory authority, wallet address for others
    const key = user.email || user.walletAddress;
    this.users.set(key, user);
    this.saveToStorage(); // Persist changes
    console.log('InMemory: User created:', user._id, key);
    return user;
  }

  async findOne(query) {
    if (query.walletAddress) {
      return this.users.get(query.walletAddress.toLowerCase()) || null;
    }
    if (query.email) {
      return this.users.get(query.email.toLowerCase()) || null;
    }
    return null;
  }

  // Add comparePassword method for regulatory authority users
  async comparePassword(user, candidatePassword) {
    if (!user.password) return false;
    return bcrypt.compare(candidatePassword, user.password);
  }

  async findById(id) {
    for (const user of this.users.values()) {
      if (user._id === id) {
        return user;
      }
    }
    return null;
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const user = await this.findById(id);
    if (!user) return null;
    
    Object.assign(user, updateData, { updatedAt: new Date() });
    const key = user.email || user.walletAddress;
    this.users.set(key, user);
    this.saveToStorage(); // Persist changes
    return user;
  }

  async find(query = {}) {
    const users = Array.from(this.users.values());
    
    if (query.role) {
      return users.filter(user => user.role === query.role);
    }
    
    return users;
  }

  // Get all users for debugging
  getAll() {
    return Array.from(this.users.values());
  }

  // Debug method to check users by wallet address
  debugFindByWallet(walletAddress) {
    console.log('InMemoryUser - All users:', this.getAll().map(u => ({ id: u._id, wallet: u.walletAddress, name: u.name })));
    console.log('InMemoryUser - Looking for wallet:', walletAddress.toLowerCase());
    const user = this.users.get(walletAddress.toLowerCase());
    console.log('InMemoryUser - Found user:', user ? user._id : 'Not found');
    return user;
  }
}

const userStore = new InMemoryUser();
module.exports = userStore;
