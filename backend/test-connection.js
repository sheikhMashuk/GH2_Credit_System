const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      console.log('Please set MONGODB_URI in your .env file');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connection successful!');
    
    // Test database access without inserting
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('✅ Database access successful');
    console.log(`Found ${collections.length} collections in database`);
    
    // Test if we can access the database info
    const stats = await db.stats();
    console.log('✅ Database stats retrieved successfully');
    console.log(`Database: ${stats.db}`);
    
    // Test write operation
    try {
      const User = require('./src/models/User');
      const testUser = new User({
        name: 'Test User',
        walletAddress: '0x742d35cc6634c0532925a3b8d4c9db96590645d8',
        role: 'PRODUCER'
      });
      
      await testUser.save();
      console.log('✅ Write operation successful - User created');
      
      await User.deleteOne({ _id: testUser._id });
      console.log('✅ Delete operation successful - Test user removed');
      
    } catch (writeError) {
      console.error('❌ Write operation failed:', writeError.message);
      console.error('Error code:', writeError.code);
      console.error('Error name:', writeError.name);
    }
    
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    console.log('\n🎉 MongoDB Atlas connection is working properly!');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('command insert not found')) {
      console.log('\n💡 Note: This error suggests your MongoDB Atlas cluster might be using a restricted tier.');
      console.log('The connection is working, but write operations may be limited.');
      console.log('Consider upgrading to a paid tier for full functionality.');
    }
    
    process.exit(1);
  }
}

testConnection();
