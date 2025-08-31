const axios = require('axios');
require('dotenv').config();

async function testAPIDirectly() {
  try {
    console.log('Testing Pinata API directly...');
    
    const testData = {
      creditId: 'API-TEST-001',
      producer: { address: '0x123...', name: 'Test Producer' },
      credits: { amount: 100, status: 'active' },
      timestamp: new Date().toISOString()
    };

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: testData,
        pinataMetadata: {
          name: `api-test-${Date.now()}`,
          keyvalues: {
            type: 'hydrogen-credit',
            timestamp: new Date().toISOString()
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': process.env.PINATA_API_KEY,
          'pinata_secret_api_key': process.env.PINATA_SECRET_KEY
        },
        timeout: 30000
      }
    );

    console.log('SUCCESS - Status:', response.status);
    console.log('IPFS Hash:', response.data.IpfsHash);
    console.log('View at: https://gateway.pinata.cloud/ipfs/' + response.data.IpfsHash);
    
  } catch (error) {
    console.log('FAILED - Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testAPIDirectly();
