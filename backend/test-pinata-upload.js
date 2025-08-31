// Test direct Pinata upload to verify credentials and connection
const axios = require('axios');

async function testPinataUpload() {
  const apiKey = 'b1db297e4e5c4934f716';
  const secretKey = 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b';
  
  console.log('Testing Pinata upload with current credentials...\n');
  
  // Test data for the recently approved credit
  const testCreditData = {
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
    }
  };
  
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: testCreditData,
        pinataMetadata: {
          name: `hydrogen-credit-9820-test-${Date.now()}`,
          keyvalues: {
            type: 'hydrogen-credit',
            creditId: '9820',
            producer: '0x2da70255e14c94791c31150fcf4342a977abe0ac',
            timestamp: new Date().toISOString()
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': apiKey,
          'pinata_secret_api_key': secretKey
        }
      }
    );
    
    console.log('✓ SUCCESS: File uploaded to Pinata!');
    console.log('IPFS Hash:', response.data.IpfsHash);
    console.log('Pinata URL:', `https://app.pinata.cloud/pinmanager`);
    console.log('Gateway URL:', `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`);
    console.log('\nCredit Data Stored:');
    console.log('- Credit ID:', testCreditData.creditId);
    console.log('- Producer:', testCreditData.producer.address);
    console.log('- Credits:', testCreditData.credits.amount);
    console.log('- Production:', `${testCreditData.production.quantity} kg from ${testCreditData.production.location}`);
    
  } catch (error) {
    console.log('✗ FAILED: Could not upload to Pinata');
    console.log('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\nPossible issues:');
      console.log('1. Invalid API credentials');
      console.log('2. API key expired or revoked');
      console.log('3. Account suspended');
    } else if (error.response?.status === 429) {
      console.log('\nRate limit exceeded - try again in a few minutes');
    } else {
      console.log('\nUnexpected error - check network connection');
    }
  }
}

testPinataUpload();
