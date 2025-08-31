// Test automatic IPFS synchronization for credit updates
const CreditSyncService = require('./src/services/credit-sync.service');

async function testIPFSSync() {
  console.log('=== Testing Automatic IPFS Sync for Credit Updates ===\n');
  
  // Test sync for the specific wallet that just got approved
  const walletToTest = '0x2da70255e14c94791c31150fcf4342a977abe0ac';
  
  console.log(`Testing IPFS sync for wallet: ${walletToTest}`);
  console.log('This wallet should have 11.11 credits from credit ID: 6048\n');
  
  try {
    const syncResult = await CreditSyncService.syncProducerCreditsToIPFS(
      walletToTest, 
      'manual_test'
    );
    
    if (syncResult.success) {
      console.log('✓ IPFS Sync Successful!');
      console.log(`Producer: ${syncResult.producer.name}`);
      console.log(`Total Credits: ${syncResult.producer.totalCredits}`);
      console.log(`Credits Synced: ${syncResult.synced}`);
      console.log(`Failed Syncs: ${syncResult.failed}`);
      
      if (syncResult.results && syncResult.results.length > 0) {
        console.log('\nCredit Details:');
        syncResult.results.forEach((result, i) => {
          if (result.success) {
            console.log(`${i+1}. Credit ID: ${result.creditId}`);
            console.log(`   Credits: ${result.credits}`);
            console.log(`   IPFS Hash: ${result.ipfsHash}`);
            console.log(`   View: https://gateway.pinata.cloud/ipfs/${result.ipfsHash}`);
          } else {
            console.log(`${i+1}. Credit ID: ${result.creditId} - FAILED: ${result.error}`);
          }
        });
      }
    } else {
      console.log('✗ IPFS Sync Failed:', syncResult.error);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testIPFSSync();
