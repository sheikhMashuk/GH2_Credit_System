const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Skip MongoDB connection if using in-memory store
    if (process.env.USE_MEMORY_STORE === 'true') {
      console.log('Using in-memory user store - skipping MongoDB connection');
      return;
    }

    // Validate MongoDB URI format
    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI not found - using in-memory store');
      return;
    }

    if (!process.env.MONGODB_URI.startsWith('mongodb://') && !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
      console.error('Invalid MONGODB_URI format. Expected mongodb:// or mongodb+srv://');
      console.log('Using in-memory store instead');
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    console.log('Continuing with in-memory store...');
    // Don't exit - continue with in-memory store
  }
};

module.exports = connectDB;
