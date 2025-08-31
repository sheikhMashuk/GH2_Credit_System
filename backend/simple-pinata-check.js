// Simple check for Pinata uploads using basic Node.js
const https = require('https');

const apiKey = 'b1db297e4e5c4934f716';
const secretKey = 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b';

console.log('Checking Pinata storage...\n');

const options = {
  hostname: 'api.pinata.cloud',
  path: '/data/pinList?status=pinned&pageLimit=10',
  method: 'GET',
  headers: {
    'pinata_api_key': apiKey,
    'pinata_secret_api_key': secretKey
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      console.log(`Total files in Pinata: ${response.count}`);
      
      if (response.count > 0) {
        console.log('\nRecent uploads:');
        response.rows.slice(0, 5).forEach((file, i) => {
          console.log(`${i+1}. ${file.metadata.name}`);
          console.log(`   Hash: ${file.ipfs_pin_hash}`);
          console.log(`   Date: ${new Date(file.date_pinned).toLocaleString()}`);
          console.log(`   View: https://gateway.pinata.cloud/ipfs/${file.ipfs_pin_hash}`);
        });
      } else {
        console.log('No files uploaded yet.');
        console.log('Credits will appear here when approved by regulatory authority.');
      }
    } else {
      console.log('Error:', res.statusCode, data);
    }
  });
});

req.on('error', (error) => {
  console.log('Network error:', error.message);
});

req.end();
