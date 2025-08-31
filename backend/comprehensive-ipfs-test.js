require('dotenv').config();
const IPFSService = require('./src/services/ipfs.service');
const CreditLifecycleService = require('./src/services/credit-lifecycle.service');
const InMemorySubmission = require('./src/models/InMemorySubmission');
const InMemoryUser = require('./src/models/InMemoryUser');

async function runComprehensiveTest() {
  console.log('=== Comprehensive IPFS Integration Test ===\n');
  
  try {
    // Test 1: Check environment
    console.log('1. Environment Check:');
    console.log('   PINATA_API_KEY:', process.env.PINATA_API_KEY ? '✓ Present' : '✗ Missing');
    console.log('   PINATA_SECRET_KEY:', process.env.PINATA_SECRET_KEY ? '✓ Present' : '✗ Missing');
    
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
      console.log('\n❌ Cannot proceed without Pinata credentials');
      return;
    }
    
    // Test 2: Load existing data
    console.log('\n2. Loading existing data...');
    const submissions = await InMemorySubmission.find({ status: 'APPROVED' });
    console.log(`   Found ${submissions.length} approved submissions`);
    
    if (submissions.length > 0) {
      const submission = submissions[0];
      console.log(`   Testing with submission ${submission._id} (Credit ID: ${submission.creditId})`);
      
      // Test 3: Upload existing credit to IPFS
      console.log('\n3. Testing IPFS upload for existing credit...');
      
      const producer = await InMemoryUser.findById(submission.producerId);
      if (!producer) {
        console.log('   ✗ Producer not found');
        return;
      }
      
      const creditData = {
        creditId: submission.creditId,
        credits: submission.credits,
        generatedAt: submission.verifiedAt,
        approvedBy: 'regulatory-authority',
        approvedAt: submission.verifiedAt
      };
      
      const submissionForIPFS = {
        ...submission,
        producerId: producer.walletAddress,
        producerName: producer.name,
        id: submission._id
      };
      
      console.log('   Uploading to IPFS...');
      const ipfsHash = await IPFSService.storeCreditToIPFS(submissionForIPFS, creditData);
      
      if (ipfsHash) {
        console.log(`   ✓ SUCCESS - IPFS Hash: ${ipfsHash}`);
        console.log(`   ✓ View at: https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
        
        // Test 4: Test credit lifecycle service
        console.log('\n4. Testing credit lifecycle service...');
        const lifecycleResult = await CreditLifecycleService.handleCreditApproval(submissionForIPFS, creditData);
        console.log(`   Lifecycle result: ${lifecycleResult.success ? 'SUCCESS' : 'FAILED'}`);
        if (lifecycleResult.ipfsHash) {
          console.log(`   Lifecycle IPFS Hash: ${lifecycleResult.ipfsHash}`);
        }
        
        // Test 5: Test credit transfer update
        console.log('\n5. Testing credit transfer update...');
        const transferResult = await CreditLifecycleService.handleCreditTransfer(
          submission.creditId,
          producer.walletAddress,
          '0x999...NewOwner',
          submission.credits / 2,
          'sale'
        );
        console.log(`   Transfer result: ${transferResult.success ? 'SUCCESS' : 'FAILED'}`);
        if (transferResult.ipfsHash) {
          console.log(`   Transfer IPFS Hash: ${transferResult.ipfsHash}`);
        }
        
      } else {
        console.log('   ✗ IPFS upload failed - no hash returned');
      }
    } else {
      console.log('   No approved submissions found to test with');
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
runComprehensiveTest();
