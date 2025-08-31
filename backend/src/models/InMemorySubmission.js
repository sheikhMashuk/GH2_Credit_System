// Temporary in-memory submission store for development
// Use this when MongoDB Atlas free tier blocks write operations

class InMemorySubmission {
  constructor() {
    this.submissions = new Map();
    this.nextId = 1;
    this.loadFromStorage();
  }

  // Load data from file system (simulating persistence)
  loadFromStorage() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataPath = path.join(__dirname, '../../data/submissions.json');
      
      if (fs.existsSync(dataPath)) {
        const stored = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(stored);
        this.submissions = new Map(data.submissions.map(([key, value]) => [key, value]));
        this.nextId = data.nextId;
        console.log('InMemorySubmission - Loaded submissions from storage:', this.submissions.size);
      }
    } catch (error) {
      console.log('InMemorySubmission - No stored data found, starting fresh');
    }
  }

  // Save data to file system (simulating persistence)
  saveToStorage() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(__dirname, '../../data');
      const dataPath = path.join(dataDir, 'submissions.json');
      
      // Create data directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const data = {
        submissions: Array.from(this.submissions.entries()),
        nextId: this.nextId
      };
      
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      console.log('InMemorySubmission - Saved submissions to storage');
    } catch (error) {
      console.log('InMemorySubmission - Failed to save to storage:', error.message);
    }
  }

  // Create a new submission
  async create(submissionData) {
    const id = this.nextId.toString();
    this.nextId++;
    
    // Remove price field and calculate credits based on quantity
    const { price, ...dataWithoutPrice } = submissionData;
    const quantity = parseFloat(submissionData.productionData?.quantity) || 0;
    const credits = parseFloat((quantity / 100).toFixed(2)); // 100 kg = 1 credit, 2 decimal places
    
    console.log('Credit calculation:', { quantity, credits, formula: 'quantity/100' });
    
    const submission = {
      _id: id,
      ...dataWithoutPrice,
      credits: credits,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.submissions.set(id, submission);
    this.saveToStorage(); // Save changes persistently
    console.log('InMemory: Submission created:', submission._id);
    return submission;
  }

  async findById(id) {
    return this.submissions.get(id.toString()) || null;
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const submission = this.submissions.get(id.toString());
    if (!submission) return null;
    
    Object.assign(submission, updateData, { updatedAt: new Date() });
    this.submissions.set(id.toString(), submission);
    this.saveToStorage(); // Persist changes
    return submission;
  }

  async find(query = {}) {
    const submissions = Array.from(this.submissions.values());
    
    // Debug logging for producer queries
    if (query.producerId) {
      console.log('InMemorySubmission.find - Looking for producerId:', query.producerId);
      const filtered = submissions.filter(submission => submission.producerId === query.producerId);
      console.log('InMemorySubmission.find - Found submissions:', filtered.map(s => ({
        id: s._id,
        producerId: s.producerId,
        credits: s.credits,
        quantity: s.productionData?.quantity
      })));
      return filtered;
    }
    
    if (query.status) {
      return submissions.filter(submission => submission.status === query.status);
    }
    
    return submissions;
  }

  async findOne(query = {}) {
    const submissions = Array.from(this.submissions.values());
    
    if (query.creditId) {
      return submissions.find(submission => submission.creditId === query.creditId) || null;
    }
    
    if (query._id) {
      return this.submissions.get(query._id.toString()) || null;
    }
    
    if (query.producerId) {
      return submissions.find(submission => submission.producerId === query.producerId) || null;
    }
    
    return submissions[0] || null;
  }

  // Mock populate method for compatibility
  async populate(submission, field, select) {
    // For simplicity, just return the submission as-is
    // In a real implementation, you'd join with user data
    return submission;
  }

  // Get all submissions for debugging
  getAll() {
    return Array.from(this.submissions.values());
  }
}

const submissionStore = new InMemorySubmission();
module.exports = submissionStore;
