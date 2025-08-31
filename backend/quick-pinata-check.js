const axios = require('axios');

// Direct test with hardcoded credentials
const PINATA_API_KEY = 'b1db297e4e5c4934f716';
const PINATA_SECRET_KEY = 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b';

async function quickPinataCheck() {
  console.log('🔍 Quick Pinata Check...');
  
  try {
    // Test authentication
    const authResponse = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      }
    });
    console.log('✅ Auth successful:', authResponse.data.message);
    
    // List files
    const listResponse = await axios.get('https://api.pinata.cloud/data/pinList', {
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      },
      params: {
        status: 'pinned',
        pageLimit: 10
      }
    });
    
    const files = listResponse.data.rows || [];
    console.log(`📁 Total files: ${files.length}`);
    
    if (files.length === 0) {
      console.log('❌ No files found in Pinata');
      console.log('💡 Need to create and approve a submission first');
    } else {
      console.log('📋 Files found:');
      files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.metadata?.name || 'Unnamed'}`);
        console.log(`     Hash: ${file.ipfs_pin_hash}`);
        console.log(`     Date: ${new Date(file.date_pinned).toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

quickPinataCheck();
