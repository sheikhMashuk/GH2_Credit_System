// Direct test of IPFS upload using fetch
const fetch = require('node-fetch');

async function testDirectUpload() {
  console.log('Testing direct Pinata upload...\n');
  
  const testData = {
    creditId: '9820',
    producer: '0x2da70255e14c94791c31150fcf4342a977abe0ac',
    credits: 10,
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': 'b1db297e4e5c4934f716',
        'pinata_secret_api_key': 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b'
      },
      body: JSON.stringify({
        pinataContent: testData,
        pinataMetadata: {
          name: `test-credit-9820-${Date.now()}`
        }
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ SUCCESS: Uploaded to Pinata');
      console.log('IPFS Hash:', result.IpfsHash);
      console.log('View at: https://gateway.pinata.cloud/ipfs/' + result.IpfsHash);
    } else {
      console.log('✗ FAILED: Status', response.status);
      console.log('Error:', result);
    }
    
  } catch (error) {
    console.log('✗ FAILED: Network error');
    console.log('Error:', error.message);
  }
}

testDirectUpload();
