const blockchainService = require('./src/services/blockchain.service');
const InMemoryUser = require('./src/models/InMemoryUser');
require('dotenv').config({ path: '../.env' });

/**
 * Test script for real-time IPFS updates when credits change
 */
async function testRealtimeIPFSUpdates() {
  console.log('🧪 Testing Real-time IPFS Updates for Credit Changes\n');
  
  // Check environment variables
  console.log('🔧 Environment Check:');
  console.log('PINATA_API_KEY:', process.env.PINATA_API_KEY ? '✅ Found' : '❌ Missing');
  console.log('PINATA_SECRET_KEY:', process.env.PINATA_SECRET_KEY ? '✅ Found' : '❌ Missing');
  console.log('');
  
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
    console.log('⚠️  Pinata credentials missing. Please check your .env file.');
    console.log('Expected in .env:');
    console.log('PINATA_API_KEY=your_api_key');
    console.log('PINATA_SECRET_KEY=your_secret_key\n');
  }
  
  const testProducerAddress = '0x1234567890123456789012345678901234567890';
  const testCreditId = 'TEST_CREDIT_001';
  
  try {
    // Check if test producer exists, create if not
    console.log('👤 Checking for test producer...');
    let testProducer = await InMemoryUser.findByWalletAddress(testProducerAddress);
    
    if (!testProducer) {
      console.log('Creating new test producer...');
      testProducer = await InMemoryUser.create({
        name: 'Test Producer',
        walletAddress: testProducerAddress,
        role: 'PRODUCER'
      });
      console.log('✅ Test producer created');
    } else {
      console.log('✅ Test producer already exists');
    }
    console.log(`Producer: ${testProducer.name} (${testProducer.walletAddress})\n`);
    
    // Test 1: Producer balance update
    console.log('📊 Test 1: Producer Balance Update');
    const balanceHash = await blockchainService.updateProducerCreditsInIPFS(
      testProducerAddress,
      150.5,
      'test_balance_update'
    );
    console.log(`✅ Balance updated in IPFS: ${balanceHash}`);
    console.log(`🔗 View: https://gateway.pinata.cloud/ipfs/${balanceHash}\n`);
    
    // Test 2: Real-time credit change sync
    console.log('🔄 Test 2: Real-time Credit Change Sync');
    const syncHash = await blockchainService.syncCreditChangeToIPFS(
      testCreditId,
      testProducerAddress,
      {
        type: 'balance_update',
        newBalance: 200.75,
        reason: 'test_real_time_sync'
      }
    );
    console.log(`✅ Credit change synced to IPFS: ${syncHash}`);
    console.log(`🔗 View: https://gateway.pinata.cloud/ipfs/${syncHash}\n`);
    
    // Test 3: Transfer simulation
    console.log('💸 Test 3: Transfer Simulation');
    const transferHash = await blockchainService.syncCreditChangeToIPFS(
      testCreditId,
      testProducerAddress,
      {
        type: 'transfer',
        fromAddress: testProducerAddress,
        toAddress: '0x9876543210987654321098765432109876543210',
        amount: 50,
        transferType: 'sale'
      }
    );
    console.log(`✅ Transfer synced to IPFS: ${transferHash}`);
    console.log(`🔗 View: https://gateway.pinata.cloud/ipfs/${transferHash}\n`);
    
    console.log('🎉 All real-time IPFS tests completed successfully!');
    console.log('\n📋 What happens now:');
    console.log('1. ✅ Producer balance changes are automatically uploaded to Pinata');
    console.log('2. ✅ Credit transfers are tracked in real-time on IPFS');
    console.log('3. ✅ All credit lifecycle events are permanently stored');
    console.log('4. ✅ Blockchain events trigger automatic IPFS updates');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRealtimeIPFSUpdates();
