// Temporary in-memory user store for development
// Use this when MongoDB Atlas free tier blocks write operations

class InMemoryUserStore {
  constructor() {
    this.users = new Map();
    this.idCounter = 1;
  }

  async create(userData) {
    const id = this.idCounter++;
    const user = {
      _id: id.toString(),
      name: userData.name,
      walletAddress: userData.walletAddress.toLowerCase(),
      role: userData.role || 'PRODUCER',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Check for duplicate wallet address
    for (const existingUser of this.users.values()) {
      if (existingUser.walletAddress === user.walletAddress) {
        const error = new Error('User with this wallet address already exists');
        error.code = 11000;
        throw error;
      }
    }
    
    this.users.set(user.walletAddress, user);
    console.log('InMemory: User created:', user._id, user.walletAddress);
    return user;
  }

  async findOne(query) {
    if (query.walletAddress) {
      return this.users.get(query.walletAddress.toLowerCase()) || null;
    }
    return null;
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
    this.users.set(user.walletAddress, user);
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
}

const userStore = new InMemoryUserStore();
module.exports = userStore;
