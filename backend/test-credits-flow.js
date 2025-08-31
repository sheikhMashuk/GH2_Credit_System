const InMemoryUser = require('./src/models/InMemoryUser');
const InMemorySubmission = require('./src/models/InMemorySubmission');
const IPFSService = require('./src/services/ipfs.service');
const CreditLifecycleService = require('./src/services/credit-lifecycle.service');

async function testCreditsFlow() {
  console.log('🧪 Testing Complete Credits Flow\n');
  
  try {
    // Step 1: Create test producer
    console.log('👤 Step 1: Creating test producer...');
    const testProducer = await InMemoryUser.create({
      name: 'Test Producer',
      email: 'producer@test.com',
      walletAddress: '0x1234567890123456789012345678901234567890',
      role: 'PRODUCER'
    });
    console.log('✅ Producer created:', testProducer.name);
    
    // Step 2: Create test submission
    console.log('\n📋 Step 2: Creating test submission...');
    const testSubmission = await InMemorySubmission.create({
      producerId: testProducer._id,
      productionData: {
        date: '2024-01-15',
        quantity: 100,
        location: 'Test Facility',
        method: 'Electrolysis',
        additionalNotes: 'Test production for IPFS'
      },
      credits: 1000,
      status: 'PENDING'
    });
    console.log('✅ Submission created:', testSubmission._id);
    
    // Step 3: Approve submission (this should trigger IPFS upload)
    console.log('\n✅ Step 3: Approving submission...');
    testSubmission.status = 'APPROVED';
    testSubmission.verifiedAt = new Date().toISOString();
    testSubmission.creditId = `CREDIT_${Date.now()}`;
    await InMemorySubmission.update(testSubmission._id, testSubmission);
    
    // Step 4: Manually trigger credit lifecycle
    console.log('\n🔄 Step 4: Triggering credit lifecycle...');
    const result = await CreditLifecycleService.handleCreditApproval(
      testSubmission._id,
      testSubmission.creditId,
      testProducer.walletAddress
    );
    
    if (result.success) {
      console.log('✅ Credit lifecycle completed successfully');
      console.log('📍 IPFS Hash:', result.ipfsHash);
    } else {
      console.log('❌ Credit lifecycle failed:', result.error);
    }
    
    // Step 5: Test retrieval
    console.log('\n🔍 Step 5: Testing credit retrieval...');
    const allCredits = await IPFSService.getAllCreditsFromIPFS();
    console.log(`📊 Found ${allCredits.length} credits in IPFS`);
    
    if (allCredits.length > 0) {
      console.log('✅ Credits successfully stored and retrieved!');
      allCredits.forEach((credit, index) => {
        console.log(`  ${index + 1}. ${credit.name} (${credit.creditId})`);
      });
    } else {
      console.log('❌ No credits found - checking what went wrong...');
      
      // Debug: Check if files exist in Pinata
      console.log('\n🔍 Debug: Checking Pinata directly...');
      const axios = require('axios');
      const listResponse = await axios.get('https://api.pinata.cloud/data/pinList', {
        headers: {
          'pinata_api_key': process.env.PINATA_API_KEY || 'b1db297e4e5c4934f716',
          'pinata_secret_api_key': process.env.PINATA_SECRET_KEY || 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b'
        },
        params: { status: 'pinned', pageLimit: 10 }
      });
      
      const files = listResponse.data.rows || [];
      console.log(`📁 Total files in Pinata: ${files.length}`);
      
      if (files.length > 0) {
        console.log('📋 Files found:');
        files.forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.metadata?.name || 'Unnamed'}`);
          console.log(`     Hash: ${file.ipfs_pin_hash}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Load environment and run test
require('dotenv').config({ path: '../.env' });
testCreditsFlow();
