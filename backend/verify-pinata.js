// Simple Pinata verification script
const https = require('https');

const PINATA_API_KEY = 'b1db297e4e5c4934f716';
const PINATA_SECRET_KEY = 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b';

console.log('🔍 Testing Pinata API Connection...\n');

// Test 1: Authentication
const options = {
  hostname: 'api.pinata.cloud',
  path: '/data/testAuthentication',
  method: 'GET',
  headers: {
    'pinata_api_key': PINATA_API_KEY,
    'pinata_secret_api_key': PINATA_SECRET_KEY
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 200) {
      console.log('\n✅ SUCCESS: Pinata credentials are valid!');
      console.log('✅ Your API Key and Secret Key are working correctly.');
      console.log('\n📋 Next Steps:');
      console.log('1. Your Pinata integration is ready to use');
      console.log('2. Credits will be stored on IPFS when approved');
      console.log('3. IPFS hashes will be stored on blockchain');
    } else {
      console.log('\n❌ ERROR: Authentication failed');
      console.log('🔧 Check your API credentials in Pinata dashboard');
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Network Error:', error.message);
});

req.end();
