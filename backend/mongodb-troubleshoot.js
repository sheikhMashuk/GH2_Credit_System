const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function troubleshootMongoDB() {
  try {
    console.log('🔍 MongoDB Atlas Troubleshooting...\n');
    
    // Check environment variables
    console.log('1. Environment Variables:');
    console.log('   MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    if (process.env.MONGODB_URI) {
      // Parse connection string (hide password)
      const uri = process.env.MONGODB_URI;
      const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
      console.log('   Connection string format:', maskedUri);
      
      // Check if it's a proper Atlas URI
      if (uri.includes('mongodb+srv://')) {
        console.log('   ✅ Using MongoDB Atlas (SRV format)');
      } else if (uri.includes('mongodb://')) {
        console.log('   ⚠️  Using standard MongoDB format');
      } else {
        console.log('   ❌ Invalid MongoDB URI format');
        return;
      }
    }
    
    console.log('\n2. Connection Test:');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ Connection established');
    
    console.log('\n3. Database Access Test:');
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    try {
      const buildInfo = await admin.buildInfo();
      console.log('   ✅ Database info accessible');
      console.log('   MongoDB version:', buildInfo.version);
    } catch (adminError) {
      console.log('   ⚠️  Admin access limited:', adminError.message);
    }
    
    console.log('\n4. Write Permission Test:');
    try {
      // Try to create a test collection
      const testCollection = db.collection('connection_test');
      const result = await testCollection.insertOne({ test: 'write_test', timestamp: new Date() });
      console.log('   ✅ Write operation successful');
      
      // Clean up
      await testCollection.deleteOne({ _id: result.insertedId });
      console.log('   ✅ Delete operation successful');
      
    } catch (writeError) {
      console.log('   ❌ Write operation failed:', writeError.message);
      console.log('   Error code:', writeError.code);
      
      if (writeError.message.includes('auth')) {
        console.log('\n💡 SOLUTION: Authentication issue detected');
        console.log('   - Check your MongoDB Atlas username/password in connection string');
        console.log('   - Ensure database user has "readWrite" permissions');
        console.log('   - Verify IP whitelist includes your current IP');
      }
      
      if (writeError.message.includes('command insert not found')) {
        console.log('\n💡 SOLUTION: Free tier limitation detected');
        console.log('   - MongoDB Atlas M0 (free) has limited write operations');
        console.log('   - Consider upgrading to M2+ for full functionality');
        console.log('   - Or use MongoDB Community Server locally');
      }
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Troubleshooting complete');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 SOLUTION: Check your credentials');
      console.log('   1. Verify username/password in MongoDB Atlas');
      console.log('   2. Update connection string in .env file');
      console.log('   3. Ensure user has proper database permissions');
    }
    
    if (error.message.includes('IP not whitelisted')) {
      console.log('\n💡 SOLUTION: Update IP whitelist');
      console.log('   1. Go to MongoDB Atlas Network Access');
      console.log('   2. Add your current IP address');
      console.log('   3. Or allow access from anywhere (0.0.0.0/0)');
    }
  }
}

troubleshootMongoDB();
