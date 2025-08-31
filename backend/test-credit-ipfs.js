const IPFSService = require('./src/services/ipfs.service');
require('dotenv').config();

async function testCreditUploadToPinata() {
  console.log('🧪 Testing Credit Upload to Pinata IPFS...\n');

  // Mock submission data (similar to what gets approved)
  const mockSubmission = {
    id: 'test-submission-123',
    producerId: '0x1234567890123456789012345678901234567890',
    producerName: 'Test Green Hydrogen Producer',
    productionData: {
      productionDate: '2025-01-15',
      quantity: 50, // 50 kg
      location: 'Mumbai, India',
      method: 'Electrolysis',
      additionalNotes: 'Test production using renewable energy'
    },
    status: 'APPROVED'
  };

  // Mock credit data (what blockchain would generate)
  const mockCreditData = {
    creditId: 'credit-456',
    credits: 50, // 50 credits for 50 kg
    generatedAt: new Date().toISOString(),
    approvedBy: 'regulatory-authority',
    approvedAt: new Date().toISOString()
  };

  try {
    console.log('📤 Step 1: Uploading credit metadata to IPFS...');
    console.log('Submission ID:', mockSubmission.id);
    console.log('Producer:', mockSubmission.producerId);
    console.log('Quantity:', mockSubmission.productionData.quantity, 'kg');
    console.log('Credits:', mockCreditData.credits);
    console.log('');

    // Upload to IPFS via Pinata
    const ipfsHash = await IPFSService.storeCreditToIPFS(mockSubmission, mockCreditData);
    
    console.log('✅ SUCCESS: Credit uploaded to Pinata!');
    console.log('📍 IPFS Hash:', ipfsHash);
    console.log('🌐 View on IPFS Gateway:', `https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    console.log('🔗 Pinata Gateway:', `https://${ipfsHash}.ipfs.dweb.link/`);
    console.log('');

    // Verify by retrieving the data
    console.log('📥 Step 2: Verifying uploaded data...');
    const retrievedData = await IPFSService.getFromIPFS(ipfsHash);
    
    console.log('✅ Data retrieved successfully!');
    console.log('📋 Credit Details:');
    console.log('  - Credit ID:', retrievedData.creditId);
    console.log('  - Producer:', retrievedData.producer.address);
    console.log('  - Quantity:', retrievedData.production.quantity, 'kg');
    console.log('  - Credits:', retrievedData.credits.amount);
    console.log('  - Location:', retrievedData.production.location);
    console.log('  - Approved At:', retrievedData.credits.approvedAt);
    console.log('  - Verification Hash:', retrievedData.verification.verificationHash);
    console.log('');

    console.log('🎉 Test completed successfully!');
    console.log('💡 This is how credits will be stored when approved in the real system.');
    
    return ipfsHash;

  } catch (error) {
    console.log('❌ ERROR:', error.message);
    
    if (error.message.includes('Pinata credentials')) {
      console.log('\n🔧 SOLUTION:');
      console.log('1. Check PINATA_API_KEY in .env file');
      console.log('2. Check PINATA_SECRET_KEY in .env file');
      console.log('3. Verify credentials are active in Pinata dashboard');
    }
  }
}

// Run the test
testCreditUploadToPinata();
