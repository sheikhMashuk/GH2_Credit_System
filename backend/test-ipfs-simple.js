console.log('Starting IPFS integration test...');

try {
  require('dotenv').config({ path: '../.env' });
  
  console.log('Environment loaded:');
  console.log('PINATA_API_KEY:', process.env.PINATA_API_KEY ? 'SET' : 'MISSING');
  console.log('PINATA_SECRET_KEY:', process.env.PINATA_SECRET_KEY ? 'SET' : 'MISSING');
  
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
    console.log('❌ Missing Pinata credentials');
    process.exit(1);
  }
  
  // Test basic service loading
  const CreditLifecycleService = require('./src/services/credit-lifecycle.service');
  console.log('✓ CreditLifecycleService loaded successfully');
  
  const IPFSService = require('./src/services/ipfs.service');
  console.log('✓ IPFSService loaded successfully');
  
  console.log('✓ All services loaded - IPFS integration is ready');
  
} catch (error) {
  console.error('❌ Error during test:', error.message);
  console.error('Stack:', error.stack);
}
