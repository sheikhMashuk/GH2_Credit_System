// Simple wallet credit checker
const https = require('https');

const apiKey = 'b1db297e4e5c4934f716';
const secretKey = 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b';

// The wallet that just got approved
const walletToCheck = '0x2da70255e14c94791c31150fcf4342a977abe0ac';

console.log(`Checking credits for wallet: ${walletToCheck}`);
console.log('Expected: 10 credits from recent approval\n');

// Get pinned files
const options = {
  hostname: 'api.pinata.cloud',
  path: '/data/pinList?status=pinned&pageLimit=50',
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
      
      // Look for hydrogen credit files
      const creditFiles = response.rows.filter(file => 
        file.metadata.name.includes('hydrogen-credit') || 
        (file.metadata.keyvalues && file.metadata.keyvalues.type === 'hydrogen-credit')
      );
      
      console.log(`Hydrogen credit files: ${creditFiles.length}`);
      
      if (creditFiles.length === 0) {
        console.log('\nNo credit files found yet.');
        console.log('This means IPFS integration may not be active during approval.');
        console.log('\nTo verify:');
        console.log('1. Check if blockchain service is using IPFS');
        console.log('2. Look at backend logs during approval');
        console.log('3. Test with: node test-credit-ipfs.js');
      } else {
        console.log('\nFound credit files:');
        creditFiles.forEach((file, i) => {
          console.log(`${i+1}. ${file.metadata.name}`);
          console.log(`   Hash: ${file.ipfs_pin_hash}`);
          console.log(`   Date: ${new Date(file.date_pinned).toLocaleString()}`);
          console.log(`   View: https://gateway.pinata.cloud/ipfs/${file.ipfs_pin_hash}`);
        });
        
        console.log('\nTo check if any belong to your wallet:');
        console.log('Visit each IPFS link and look for:');
        console.log(`"producer": {"address": "${walletToCheck}"}`);
      }
    } else {
      console.log('Error:', res.statusCode, data);
    }
  });
});

req.on('error', (error) => {
  console.log('Error:', error.message);
});

req.end();
