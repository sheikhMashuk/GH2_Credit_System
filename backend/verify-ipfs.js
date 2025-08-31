require('dotenv').config();
const https = require('https');

// Test Pinata API directly
function testPinataAPI() {
  const testData = {
    creditId: 'TEST-VERIFY-001',
    producer: { address: '0x123...', name: 'Test Producer' },
    credits: { amount: 100, status: 'active' },
    timestamp: new Date().toISOString()
  };

  const postData = JSON.stringify({
    pinataContent: testData,
    pinataMetadata: {
      name: `test-credit-${Date.now()}`,
      keyvalues: {
        type: 'hydrogen-credit',
        timestamp: new Date().toISOString()
      }
    }
  });

  const options = {
    hostname: 'api.pinata.cloud',
    port: 443,
    path: '/pinning/pinJSONToIPFS',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'pinata_api_key': process.env.PINATA_API_KEY,
      'pinata_secret_api_key': process.env.PINATA_SECRET_KEY
    }
  };

  console.log('Testing Pinata API...');
  console.log('API Key:', process.env.PINATA_API_KEY ? 'Present' : 'Missing');
  console.log('Secret Key:', process.env.PINATA_SECRET_KEY ? 'Present' : 'Missing');

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response Status:', res.statusCode);
      console.log('Response Headers:', res.headers);
      console.log('Response Body:', data);
      
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(data);
          console.log('✓ SUCCESS - IPFS Hash:', result.IpfsHash);
          console.log('✓ View at: https://gateway.pinata.cloud/ipfs/' + result.IpfsHash);
        } catch (e) {
          console.log('✗ Failed to parse response');
        }
      } else {
        console.log('✗ FAILED - Status:', res.statusCode);
      }
    });
  });

  req.on('error', (error) => {
    console.error('✗ Request error:', error);
  });

  req.write(postData);
  req.end();
}

testPinataAPI();
