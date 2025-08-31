// Debug why IPFS files aren't uploading to Pinata
require('dotenv').config({ path: '../.env' });

console.log('=== Debugging IPFS Upload Issue ===\n');

// Check environment variables
console.log('Environment Check:');
console.log('PINATA_API_KEY:', process.env.PINATA_API_KEY ? 'SET' : 'MISSING');
console.log('PINATA_SECRET_KEY:', process.env.PINATA_SECRET_KEY ? 'SET' : 'MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log();

// Test IPFS service initialization
try {
  const IPFSService = require('./src/services/ipfs.service');
  console.log('✓ IPFS Service loaded successfully');
  
  // Test simple upload
  const testData = {
    creditId: '9820',
    producer: '0x2da70255e14c94791c31150fcf4342a977abe0ac',
    credits: 10,
    testUpload: true,
    timestamp: new Date().toISOString()
  };
  
  console.log('Testing direct IPFS upload...');
  
  IPFSService.pinJSONToIPFS(testData, 'test-credit-9820')
    .then(hash => {
      console.log('✓ SUCCESS: Uploaded to IPFS');
      console.log('Hash:', hash);
      console.log('View at: https://gateway.pinata.cloud/ipfs/' + hash);
    })
    .catch(error => {
      console.log('✗ FAILED: IPFS upload error');
      console.log('Error:', error.message);
      
      if (error.message.includes('Pinata credentials')) {
        console.log('\nCredential Issue:');
        console.log('- Check .env file has correct PINATA_API_KEY and PINATA_SECRET_KEY');
        console.log('- Verify credentials are valid in Pinata dashboard');
      }
    });
    
} catch (error) {
  console.log('✗ FAILED: Could not load IPFS service');
  console.log('Error:', error.message);
}
