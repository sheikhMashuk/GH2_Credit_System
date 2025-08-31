const https = require('https');

const PINATA_API_KEY = 'b1db297e4e5c4934f716';
const PINATA_SECRET_KEY = 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b';

console.log('📋 Checking Pinata Storage for Uploaded Credits...\n');

// Function to make HTTPS request
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.pinata.cloud',
      path: path,
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
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function checkPinataUploads() {
  try {
    // Get list of pinned files
    console.log('🔍 Fetching pinned files from Pinata...');
    const response = await makeRequest('/data/pinList?status=pinned&pageLimit=20');
    
    console.log(`📊 Total files found: ${response.count}`);
    console.log('');

    if (response.count === 0) {
      console.log('📭 No files uploaded yet.');
      console.log('💡 Credits will appear here when approved by regulatory authority.');
      return;
    }

    // Filter for hydrogen credit files
    const creditFiles = response.rows.filter(file => 
      file.metadata.name.includes('hydrogen-credit') || 
      file.metadata.keyvalues?.type === 'hydrogen-credit'
    );

    console.log(`🏭 Hydrogen credit files: ${creditFiles.length}`);
    console.log('');

    if (creditFiles.length === 0) {
      console.log('📋 Recent uploads (all types):');
      response.rows.slice(0, 5).forEach((file, index) => {
        console.log(`${index + 1}. ${file.metadata.name}`);
        console.log(`   📍 IPFS: ${file.ipfs_pin_hash}`);
        console.log(`   📅 Date: ${new Date(file.date_pinned).toLocaleString()}`);
        console.log(`   🔗 View: https://gateway.pinata.cloud/ipfs/${file.ipfs_pin_hash}`);
        console.log('');
      });
    } else {
      console.log('🏭 Hydrogen Credit Files:');
      creditFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.metadata.name}`);
        console.log(`   📍 IPFS Hash: ${file.ipfs_pin_hash}`);
        console.log(`   📅 Uploaded: ${new Date(file.date_pinned).toLocaleString()}`);
        console.log(`   📊 Size: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`   🔗 View: https://gateway.pinata.cloud/ipfs/${file.ipfs_pin_hash}`);
        console.log('');
      });
    }

    // Show how to test upload
    console.log('🧪 To test credit upload:');
    console.log('1. Run: node test-credit-ipfs.js');
    console.log('2. Approve a submission in the regulatory dashboard');
    console.log('3. Check this list again to see new uploads');

  } catch (error) {
    console.log('❌ Error:', error.message);
    
    if (error.message.includes('401')) {
      console.log('🔧 Check your Pinata API credentials');
    }
  }
}

checkPinataUploads();
