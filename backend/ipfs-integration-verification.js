require('dotenv').config();
const IPFSService = require('./src/services/ipfs.service');
const CreditLifecycleService = require('./src/services/credit-lifecycle.service');
const InMemorySubmission = require('./src/models/InMemorySubmission');
const InMemoryUser = require('./src/models/InMemoryUser');

async function verifyIPFSIntegration() {
  console.log('=== IPFS Integration Verification ===\n');
  
  // Test 1: Environment check
  console.log('1. Environment Variables:');
  const hasApiKey = !!process.env.PINATA_API_KEY;
  const hasSecretKey = !!process.env.PINATA_SECRET_KEY;
  console.log(`   API Key: ${hasApiKey ? '✓' : '✗'}`);
  console.log(`   Secret Key: ${hasSecretKey ? '✓' : '✗'}`);
  
  if (!hasApiKey || !hasSecretKey) {
    console.log('\n❌ Missing Pinata credentials');
    return;
  }
  
  // Test 2: Load existing data
  console.log('\n2. Data Loading:');
  try {
    const approvedSubmissions = await InMemorySubmission.find({ status: 'APPROVED' });
    console.log(`   Approved submissions: ${approvedSubmissions.length}`);
    
    if (approvedSubmissions.length > 0) {
      const submission = approvedSubmissions[0];
      console.log(`   Testing with submission ${submission._id}`);
      console.log(`   Credit ID: ${submission.creditId}`);
      console.log(`   Credits: ${submission.credits}`);
      
      // Test 3: Get producer data
      const producer = await InMemoryUser.findById(submission.producerId);
      if (producer) {
        console.log(`   Producer: ${producer.name} (${producer.walletAddress})`);
        
        // Test 4: Test IPFS upload
        console.log('\n3. Testing IPFS Upload:');
        
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
        
        try {
          console.log('   Attempting IPFS upload...');
          const ipfsHash = await IPFSService.storeCreditToIPFS(submissionForIPFS, creditData);
          
          if (ipfsHash) {
            console.log(`   ✓ SUCCESS - Hash: ${ipfsHash}`);
            console.log(`   ✓ URL: https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
          } else {
            console.log('   ✗ FAILED - No hash returned');
          }
        } catch (error) {
          console.log(`   ✗ FAILED - Error: ${error.message}`);
        }
        
        // Test 5: Test lifecycle service
        console.log('\n4. Testing Credit Lifecycle Service:');
        try {
          const lifecycleResult = await CreditLifecycleService.handleCreditApproval(submissionForIPFS, creditData);
          console.log(`   Result: ${lifecycleResult.success ? 'SUCCESS' : 'FAILED'}`);
          if (lifecycleResult.ipfsHash) {
            console.log(`   Hash: ${lifecycleResult.ipfsHash}`);
          }
          if (!lifecycleResult.success) {
            console.log(`   Error: ${lifecycleResult.error}`);
          }
        } catch (error) {
          console.log(`   ✗ FAILED - Error: ${error.message}`);
        }
        
      } else {
        console.log('   ✗ Producer not found');
      }
    } else {
      console.log('   No approved submissions found');
    }
    
  } catch (error) {
    console.log(`   ✗ Data loading failed: ${error.message}`);
  }
  
  console.log('\n=== Verification Complete ===');
}

// Run verification
verifyIPFSIntegration().then(() => {
  console.log('\nTest completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('\nTest failed:', error);
  process.exit(1);
});
