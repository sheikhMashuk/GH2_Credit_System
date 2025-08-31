// Upload the current approved credit (ID: 9820) to Pinata manually
const axios = require('axios');

async function uploadCurrentCredit() {
  const apiKey = 'b1db297e4e5c4934f716';
  const secretKey = 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b';
  
  // Current approved credit data
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
      status: 'APPROVED',
      verifiedBy: '1',
      verifiedAt: '2025-08-30T20:44:53.527Z'
    },
    metadata: {
      createdAt: new Date().toISOString(),
      standard: 'GH2-Credit-v1.0',
      network: 'development',
      totalProducerCredits: 21.11
    }
  };
  
  console.log('Uploading credit to Pinata...');
  console.log('Credit ID:', creditData.creditId);
  console.log('Producer:', creditData.producer.address);
  console.log('Credits:', creditData.credits.amount);
  
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: creditData,
        pinataMetadata: {
          name: `hydrogen-credit-${creditData.creditId}-${Date.now()}`,
          keyvalues: {
            type: 'hydrogen-credit',
            creditId: creditData.creditId,
            producer: creditData.producer.address,
            credits: creditData.credits.amount.toString(),
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
    
    console.log('\n✓ SUCCESS: Credit uploaded to Pinata!');
    console.log('IPFS Hash:', response.data.IpfsHash);
    console.log('Timestamp:', response.data.Timestamp);
    console.log('\nView your credit:');
    console.log(`https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`);
    console.log('\nPinata Dashboard:');
    console.log('https://app.pinata.cloud/pinmanager');
    
  } catch (error) {
    console.log('\n✗ FAILED: Upload error');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

uploadCurrentCredit();
