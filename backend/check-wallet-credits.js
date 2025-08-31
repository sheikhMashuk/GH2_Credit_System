const https = require('https');

const PINATA_API_KEY = 'b1db297e4e5c4934f716';
const PINATA_SECRET_KEY = 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b';

// Function to make HTTPS request to Pinata
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

// Function to fetch data from IPFS
function fetchFromIPFS(ipfsHash) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'gateway.pinata.cloud',
      path: `/ipfs/${ipfsHash}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data); // Return raw data if not JSON
          }
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

async function checkWalletCredits(walletAddress) {
  console.log(`🔍 Checking credits for wallet: ${walletAddress}\n`);

  try {
    // Get all pinned files from Pinata
    console.log('📋 Fetching all files from Pinata...');
    const response = await makeRequest('/data/pinList?status=pinned&pageLimit=100');
    
    console.log(`📊 Total files in Pinata: ${response.count}`);

    // Filter for hydrogen credit files
    const creditFiles = response.rows.filter(file => 
      file.metadata.name.includes('hydrogen-credit') || 
      file.metadata.keyvalues?.type === 'hydrogen-credit'
    );

    console.log(`🏭 Hydrogen credit files found: ${creditFiles.length}\n`);

    if (creditFiles.length === 0) {
      console.log('❌ No hydrogen credit files found in Pinata storage.');
      console.log('💡 Credits will appear here when approved by regulatory authority.');
      return;
    }

    // Check each credit file for the wallet address
    let totalCredits = 0;
    let walletCredits = [];

    console.log('🔎 Searching for credits belonging to this wallet...\n');

    for (const file of creditFiles) {
      try {
        console.log(`📄 Checking file: ${file.metadata.name}`);
        const creditData = await fetchFromIPFS(file.ipfs_pin_hash);
        
        if (creditData && creditData.producer && creditData.producer.address) {
          const producerAddress = creditData.producer.address.toLowerCase();
          const searchAddress = walletAddress.toLowerCase();
          
          if (producerAddress === searchAddress) {
            totalCredits += creditData.credits.amount || 0;
            walletCredits.push({
              creditId: creditData.creditId,
              credits: creditData.credits.amount,
              quantity: creditData.production.quantity,
              location: creditData.production.location,
              date: creditData.production.date,
              approvedAt: creditData.credits.approvedAt,
              ipfsHash: file.ipfs_pin_hash,
              fileName: file.metadata.name
            });
            console.log(`  ✅ Match found! Credit ID: ${creditData.creditId}, Credits: ${creditData.credits.amount}`);
          } else {
            console.log(`  ⏭️  Different producer: ${producerAddress.substring(0, 10)}...`);
          }
        }
      } catch (error) {
        console.log(`  ❌ Error reading file: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 RESULTS FOR WALLET: ${walletAddress}`);
    console.log('='.repeat(60));

    if (walletCredits.length === 0) {
      console.log('❌ No credits found for this wallet address.');
      console.log('💡 Make sure the wallet has approved submissions.');
    } else {
      console.log(`✅ Total Credits Found: ${totalCredits}`);
      console.log(`📋 Number of Credit Records: ${walletCredits.length}\n`);

      console.log('📄 Credit Details:');
      walletCredits.forEach((credit, index) => {
        console.log(`\n${index + 1}. Credit ID: ${credit.creditId}`);
        console.log(`   💰 Credits: ${credit.credits}`);
        console.log(`   ⚖️  Quantity: ${credit.quantity} kg`);
        console.log(`   📍 Location: ${credit.location}`);
        console.log(`   📅 Production Date: ${credit.date}`);
        console.log(`   ✅ Approved: ${new Date(credit.approvedAt).toLocaleString()}`);
        console.log(`   🔗 IPFS Hash: ${credit.ipfsHash}`);
        console.log(`   🌐 View: https://gateway.pinata.cloud/ipfs/${credit.ipfsHash}`);
      });
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Get wallet address from command line or use default
const walletAddress = process.argv[2] || '0x2da70255e14c94791c31150fcf4342a977abe0ac';

checkWalletCredits(walletAddress);
