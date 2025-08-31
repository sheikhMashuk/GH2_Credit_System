const axios = require('axios');
require('dotenv').config();

async function testPinataConnection() {
  console.log('🔍 Testing Pinata API Connection...\n');
  
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;
  
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT FOUND');
  console.log('Secret Key:', secretKey ? `${secretKey.substring(0, 8)}...` : 'NOT FOUND');
  console.log('');
  
  if (!apiKey || !secretKey) {
    console.log('❌ ERROR: Pinata credentials not found in .env file');
    return;
  }
  
  try {
    // Test 1: Authentication Test
    console.log('📡 Step 1: Testing Authentication...');
    const authResponse = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey
      }
    });
    
    console.log('✅ Authentication successful!');
    console.log('Response:', authResponse.data);
    console.log('');
    
    // Test 2: Pin Simple JSON
    console.log('📤 Step 2: Testing JSON Pinning...');
    const testData = {
      message: 'Hello from Green Hydrogen Marketplace!',
      timestamp: new Date().toISOString(),
      test: true
    };
    
    const pinResponse = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      pinataContent: testData,
      pinataMetadata: {
        name: 'test-hydrogen-credit',
        keyvalues: {
          type: 'test',
          project: 'green-hydrogen-marketplace'
        }
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey
      }
    });
    
    console.log('✅ JSON pinning successful!');
    console.log('IPFS Hash:', pinResponse.data.IpfsHash);
    console.log('Pinata URL:', `https://gateway.pinata.cloud/ipfs/${pinResponse.data.IpfsHash}`);
    console.log('');
    
    // Test 3: Retrieve Data
    console.log('📥 Step 3: Testing Data Retrieval...');
    const retrieveResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${pinResponse.data.IpfsHash}`);
    
    console.log('✅ Data retrieval successful!');
    console.log('Retrieved data:', retrieveResponse.data);
    console.log('');
    
    // Test 4: List Pinned Files
    console.log('📋 Step 4: Listing Pinned Files...');
    const listResponse = await axios.get('https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=5', {
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey
      }
    });
    
    console.log('✅ File listing successful!');
    console.log(`Found ${listResponse.data.count} pinned files`);
    console.log('Recent files:');
    listResponse.data.rows.slice(0, 3).forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.metadata.name} (${file.ipfs_pin_hash})`);
    });
    
    console.log('\n🎉 All Pinata tests passed! Your credentials are working correctly.');
    
  } catch (error) {
    console.log('❌ ERROR:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔧 SOLUTION: Check your API credentials');
      console.log('1. Verify PINATA_API_KEY in .env file');
      console.log('2. Verify PINATA_SECRET_KEY in .env file');
      console.log('3. Make sure keys are active in Pinata dashboard');
    }
  }
}

testPinataConnection();
