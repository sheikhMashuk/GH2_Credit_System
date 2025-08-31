// Simple test using built-in https module
const https = require('https');

const testData = JSON.stringify({
  pinataContent: {
    creditId: '9820',
    producer: '0x2da70255e14c94791c31150fcf4342a977abe0ac',
    credits: 10,
    test: true,
    timestamp: new Date().toISOString()
  },
  pinataMetadata: {
    name: `test-credit-9820-${Date.now()}`
  }
});

const options = {
  hostname: 'api.pinata.cloud',
  path: '/pinning/pinJSONToIPFS',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData),
    'pinata_api_key': 'b1db297e4e5c4934f716',
    'pinata_secret_api_key': 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b'
  }
};

console.log('Testing Pinata upload for credit 9820...');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      console.log('✓ SUCCESS: Uploaded to Pinata!');
      console.log('IPFS Hash:', response.IpfsHash);
      console.log('View at: https://gateway.pinata.cloud/ipfs/' + response.IpfsHash);
      console.log('Pinata Dashboard: https://app.pinata.cloud/pinmanager');
    } else {
      console.log('✗ FAILED: Upload error');
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('✗ Network error:', error.message);
});

req.write(testData);
req.end();
