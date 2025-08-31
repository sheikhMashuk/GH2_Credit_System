require('dotenv').config({ path: '../.env' });
const IPFSService = require('./src/services/ipfs.service');

async function createTestCredit() {
  console.log('🧪 Creating Test Credit in IPFS\n');
  
  try {
    // Create test credit data
    const testCreditData = {
      version: '1.0',
      type: 'green-hydrogen-credit',
      creditId: `TEST_CREDIT_${Date.now()}`,
      producer: {
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test Producer'
      },
      production: {
        date: '2024-01-15',
        quantity: 100,
        location: 'Test Facility',
        method: 'Electrolysis',
        additionalNotes: 'Test credit for demonstration'
      },
      credits: {
        amount: 1000,
        generatedAt: new Date().toISOString(),
        approvedBy: 'regulatory-authority',
        approvedAt: new Date().toISOString(),
        status: 'active',
        ownership: {
          currentOwner: '0x1234567890123456789012345678901234567890',
          transferHistory: []
        }
      },
      verification: {
        submissionId: `SUB_${Date.now()}`,
        status: 'APPROVED'
      },
      metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        standard: 'GH2-Credit-v1.0',
        network: 'development'
      }
    };
    
    console.log('📋 Test credit data created');
    console.log('Credit ID:', testCreditData.creditId);
    console.log('Producer:', testCreditData.producer.name);
    console.log('Credits:', testCreditData.credits.amount);
    
    // Upload to IPFS
    console.log('\n📤 Uploading to IPFS...');
    const ipfsHash = await IPFSService.storeCreditInIPFS(testCreditData);
    
    if (ipfsHash) {
      console.log('✅ Successfully uploaded to IPFS!');
      console.log('📍 IPFS Hash:', ipfsHash);
      console.log('🌐 View at: https://gateway.pinata.cloud/ipfs/' + ipfsHash);
      
      // Test retrieval
      console.log('\n🔍 Testing retrieval...');
      const allCredits = await IPFSService.getAllCreditsFromIPFS();
      console.log(`📊 Found ${allCredits.length} credits in IPFS`);
      
      if (allCredits.length > 0) {
        console.log('✅ Credit successfully retrieved!');
        allCredits.forEach((credit, index) => {
          console.log(`  ${index + 1}. ${credit.name} (${credit.creditId})`);
          console.log(`     Hash: ${credit.ipfsHash}`);
          console.log(`     Producer: ${credit.producer}`);
        });
      }
      
    } else {
      console.log('❌ Failed to upload to IPFS');
    }
    
  } catch (error) {
    console.error('❌ Error creating test credit:', error.message);
    
    // Check Pinata credentials
    console.log('\n🔍 Checking Pinata credentials...');
    console.log('PINATA_API_KEY:', process.env.PINATA_API_KEY ? 'Found' : 'Missing');
    console.log('PINATA_SECRET_KEY:', process.env.PINATA_SECRET_KEY ? 'Found' : 'Missing');
    
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
      console.log('\n💡 Solution: Make sure Pinata credentials are set in .env file');
    }
  }
}

createTestCredit();
