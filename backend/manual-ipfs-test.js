// Manual test to upload the approved credit to Pinata
const https = require('https');

const apiKey = 'b1db297e4e5c4934f716';
const secretKey = 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b';

// Data for the recently approved credit ID 9820
const creditData = {
  version: '1.0',
  type: 'green-hydrogen-credit',
  creditId: '9820',
  producer: {
    address: '0x2da70255e14c94791c31150fcf4342a977abe0ac',
    name: 'User 0x2dA7...e0aC'
  },
  production: {
    date: '2025-08-07',
    quantity: 1000,
    location: 'rajkot',
    additionalNotes: 'asdd'
  },
  credits: {
    amount: 10,
    generatedAt: '2025-08-30T20:44:53.527Z',
    approvedBy: 'regulatory-authority',
    approvedAt: '2025-08-30T20:44:53.527Z'
  },
  verification: {
    submissionId: '3',
    status: 'APPROVED'
  },
  metadata: {
    createdAt: new Date().toISOString(),
    standard: 'GH2-Credit-v1.0',
    network: 'development'
  }
};

const postData = JSON.stringify({
  pinataContent: creditData,
  pinataMetadata: {
    name: `hydrogen-credit-9820-${Date.now()}`,
    keyvalues: {
      type: 'hydrogen-credit',
      creditId: '9820',
      producer: '0x2da70255e14c94791c31150fcf4342a977abe0ac',
      timestamp: new Date().toISOString()
    }
  }
});

const options = {
  hostname: 'api.pinata.cloud',
  path: '/pinning/pinJSONToIPFS',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'pinata_api_key': apiKey,
    'pinata_secret_api_key': secretKey
  }
};

console.log('Uploading credit data to Pinata...');
console.log('Credit ID: 9820');
console.log('Producer: 0x2da70255e14c94791c31150fcf4342a977abe0ac');
console.log('Credits: 10');
console.log();

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      console.log('✓ SUCCESS: Credit uploaded to Pinata!');
      console.log('IPFS Hash:', response.IpfsHash);
      console.log('Timestamp:', response.Timestamp);
      console.log();
      console.log('View your credit at:');
      console.log(`https://gateway.pinata.cloud/ipfs/${response.IpfsHash}`);
      console.log();
      console.log('Check Pinata dashboard:');
      console.log('https://app.pinata.cloud/pinmanager');
    } else {
      console.log('✗ FAILED: Upload error');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
      
      if (res.statusCode === 401) {
        console.log('\nCredential issue - check API keys');
      } else if (res.statusCode === 429) {
        console.log('\nRate limit - wait and try again');
      }
    }
  });
});

req.on('error', (error) => {
  console.log('✗ FAILED: Network error');
  console.log('Error:', error.message);
});

req.write(postData);
req.end();
