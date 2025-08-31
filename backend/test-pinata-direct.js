require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function testPinataDirectly() {
  console.log('=== Direct Pinata API Test ===');
  
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;
  
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING');
  console.log('Secret Key:', secretKey ? `${secretKey.substring(0, 8)}...` : 'MISSING');
  
  if (!apiKey || !secretKey) {
    console.error('❌ Missing Pinata credentials');
    return;
  }
  
  // Test 1: Authentication test
  console.log('\n1. Testing authentication...');
  try {
    const authResponse = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey
      },
      timeout: 10000
    });
    console.log('✓ Authentication successful:', authResponse.data);
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return;
  }
  
  // Test 2: Simple JSON upload
  console.log('\n2. Testing JSON upload...');
  try {
    const testData = {
      message: 'Hello from Green Hydrogen Marketplace',
      timestamp: new Date().toISOString(),
      creditId: 'TEST-001',
      producer: {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'Test Producer'
      }
    };
    
    const uploadResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: testData,
        pinataMetadata: {
          name: `test-upload-${Date.now()}`,
          keyvalues: {
            type: 'test',
            creditId: 'TEST-001'
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': apiKey,
          'pinata_secret_api_key': secretKey
        },
        timeout: 30000
      }
    );
    
    console.log('✓ Upload successful!');
    console.log('IPFS Hash:', uploadResponse.data.IpfsHash);
    console.log('View at:', `https://gateway.pinata.cloud/ipfs/${uploadResponse.data.IpfsHash}`);
    
    // Test 3: Retrieve the uploaded data
    console.log('\n3. Testing data retrieval...');
    const retrieveResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${uploadResponse.data.IpfsHash}`, {
      timeout: 10000
    });
    console.log('✓ Retrieved data:', retrieveResponse.data);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testPinataDirectly().catch(console.error);
