const axios = require('axios');

// Direct test without dotenv
const apiKey = 'b1db297e4e5c4934f716';
const secretKey = 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b';

async function testPinata() {
  console.log('Testing Pinata API...');
  
  try {
    // Test authentication
    const authResponse = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey
      }
    });
    console.log('✓ Authentication successful:', authResponse.data);
    
    // Test JSON upload
    const testData = {
      message: 'Test upload from Green Hydrogen Marketplace',
      timestamp: new Date().toISOString()
    };
    
    const uploadResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: testData,
        pinataMetadata: {
          name: `test-${Date.now()}`
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': apiKey,
          'pinata_secret_api_key': secretKey
        }
      }
    );
    
    console.log('✓ Upload successful! IPFS Hash:', uploadResponse.data.IpfsHash);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPinata();
