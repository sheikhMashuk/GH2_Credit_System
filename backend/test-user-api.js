const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config({ path: '../.env' });

async function testUserOperations() {
  try {
    console.log('Testing User API operations...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Test creating a user
    const testUser = {
      name: 'Test User',
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96590645d8',
      role: 'PRODUCER'
    };

    // Check if user exists
    const existingUser = await User.findOne({
      walletAddress: testUser.walletAddress.toLowerCase()
    });

    if (existingUser) {
      console.log('✅ User already exists:', existingUser._id);
    } else {
      const newUser = await User.create({
        name: testUser.name,
        walletAddress: testUser.walletAddress.toLowerCase(),
        role: testUser.role
      });
      console.log('✅ User created successfully:', newUser._id);
    }

    // Test finding user
    const foundUser = await User.findOne({
      walletAddress: testUser.walletAddress.toLowerCase()
    });
    
    if (foundUser) {
      console.log('✅ User found:', foundUser.name);
    }

    await mongoose.connection.close();
    console.log('✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUserOperations();
