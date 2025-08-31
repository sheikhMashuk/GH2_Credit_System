require('dotenv').config({ path: '../.env' });
const IPFSService = require('./src/services/ipfs.service');

async function testRetrievalFix() {
  console.log('🔍 Testing Fixed Credit Retrieval\n');
  
  try {
    // Test the fixed getAllCreditsFromIPFS method
    const credits = await IPFSService.getAllCreditsFromIPFS();
    
    console.log(`✅ Successfully retrieved ${credits.length} credits from IPFS\n`);
    
    if (credits.length > 0) {
      console.log('📋 Credits Found:');
      credits.forEach((credit, index) => {
        console.log(`\n${index + 1}. ${credit.name}`);
        console.log(`   Credit ID: ${credit.creditId}`);
        console.log(`   Producer: ${credit.producer}`);
        console.log(`   IPFS Hash: ${credit.ipfsHash}`);
        console.log(`   Date: ${new Date(credit.dateUploaded).toLocaleString()}`);
        console.log(`   Size: ${(credit.size / 1024).toFixed(2)} KB`);
        
        if (credit.creditData) {
          console.log(`   ✅ Credit data loaded successfully`);
          console.log(`   Credits: ${credit.creditData.credits?.amount || 'N/A'}`);
          console.log(`   Status: ${credit.creditData.credits?.status || 'N/A'}`);
          console.log(`   Location: ${credit.creditData.production?.location || 'N/A'}`);
        } else if (credit.error) {
          console.log(`   ❌ Error: ${credit.error}`);
        }
        
        console.log(`   🌐 View: https://gateway.pinata.cloud/ipfs/${credit.ipfsHash}`);
      });
      
      console.log('\n🎉 Credit retrieval is now working!');
      console.log('💡 You can now refresh your frontend /credits page to see the data');
      
    } else {
      console.log('⚠️  No credits found. This could mean:');
      console.log('   1. No files were uploaded to Pinata');
      console.log('   2. Files were uploaded but not with the expected metadata');
      console.log('   3. API credentials are incorrect');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRetrievalFix();
