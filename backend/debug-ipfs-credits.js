require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function debugIPFSCredits() {
  console.log('🔍 Debugging IPFS Credits Issue\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log('PINATA_API_KEY:', process.env.PINATA_API_KEY ? '✅ Found' : '❌ Missing');
  console.log('PINATA_SECRET_KEY:', process.env.PINATA_SECRET_KEY ? '✅ Found' : '❌ Missing');
  console.log('');
  
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
    console.log('❌ Missing Pinata credentials. Please check .env file.');
    return;
  }
  
  try {
    // Test Pinata connection
    console.log('🔗 Testing Pinata Connection...');
    const authResponse = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY
      }
    });
    console.log('✅ Pinata connection successful:', authResponse.data.message);
    console.log('');
    
    // List all pinned files
    console.log('📁 Listing All Pinned Files...');
    const listResponse = await axios.get('https://api.pinata.cloud/data/pinList', {
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY
      },
      params: {
        status: 'pinned',
        pageLimit: 100
      }
    });
    
    const allFiles = listResponse.data.rows || [];
    console.log(`📊 Total pinned files: ${allFiles.length}`);
    
    if (allFiles.length === 0) {
      console.log('⚠️  No files found in Pinata. This explains why no credits are showing.');
      console.log('💡 To fix this, you need to:');
      console.log('   1. Submit a production request as a producer');
      console.log('   2. Have it approved by regulatory authority');
      console.log('   3. This will automatically upload credit to IPFS');
      return;
    }
    
    // Filter for hydrogen credit files
    const creditFiles = allFiles.filter(file => 
      file.metadata?.name?.includes('hydrogen-credit') ||
      file.metadata?.keyvalues?.type === 'green-hydrogen-credit'
    );
    
    console.log(`🔋 Hydrogen credit files: ${creditFiles.length}`);
    console.log('');
    
    if (creditFiles.length === 0) {
      console.log('⚠️  No hydrogen credit files found. All files:');
      allFiles.slice(0, 5).forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.metadata?.name || 'Unnamed'} (${file.ipfs_pin_hash})`);
        console.log(`      Date: ${new Date(file.date_pinned).toLocaleString()}`);
        console.log(`      Size: ${(file.size / 1024).toFixed(2)} KB`);
      });
    } else {
      console.log('✅ Found hydrogen credit files:');
      creditFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.metadata?.name || 'Unnamed'}`);
        console.log(`      Hash: ${file.ipfs_pin_hash}`);
        console.log(`      Date: ${new Date(file.date_pinned).toLocaleString()}`);
        console.log(`      Size: ${(file.size / 1024).toFixed(2)} KB`);
      });
    }
    console.log('');
    
    // Test the IPFS service directly
    console.log('🧪 Testing IPFS Service...');
    const IPFSService = require('./src/services/ipfs.service');
    const credits = await IPFSService.getAllCreditsFromIPFS();
    console.log(`📋 IPFS Service returned: ${credits.length} credits`);
    
    if (credits.length === 0) {
      console.log('❌ IPFS Service is not finding credits. Checking filter logic...');
      
      // Check if the filtering is too strict
      console.log('🔍 Checking filter criteria...');
      const allCreditsUnfiltered = allFiles.map(file => ({
        ipfsHash: file.ipfs_pin_hash,
        name: file.metadata?.name || 'Unnamed',
        dateUploaded: file.date_pinned,
        size: file.size,
        metadata: file.metadata
      }));
      
      console.log('📄 All files with metadata:');
      allCreditsUnfiltered.slice(0, 3).forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name}`);
        console.log(`      Metadata:`, JSON.stringify(file.metadata, null, 2));
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugIPFSCredits();
