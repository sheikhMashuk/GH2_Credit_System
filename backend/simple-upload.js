const axios = require('axios');

async function uploadSampleCredit() {
  console.log('📤 Uploading sample credit to IPFS...');
  
  const creditData = {
    version: '1.0',
    type: 'green-hydrogen-credit',
    creditId: 'GH2_CREDIT_DEMO_001',
    producer: {
      address: '0x742d35Cc6634C0532925a3b8D4c2C2F1C2E5d226',
      name: 'Demo Producer'
    },
    production: {
      date: '2024-01-15',
      quantity: 100,
      location: 'Demo Facility',
      method: 'Electrolysis'
    },
    credits: {
      amount: 1000,
      generatedAt: new Date().toISOString(),
      approvedBy: 'regulatory-authority',
      approvedAt: new Date().toISOString(),
      status: 'active',
      ownership: {
        currentOwner: '0x742d35Cc6634C0532925a3b8D4c2C2F1C2E5d226',
        transferHistory: []
      }
    },
    verification: {
      submissionId: 'SUB_DEMO_001',
      status: 'APPROVED'
    },
    metadata: {
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      standard: 'GH2-Credit-v1.0',
      network: 'development'
    }
  };

  try {
    const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', creditData, {
      headers: {
        'pinata_api_key': 'b1db297e4e5c4934f716',
        'pinata_secret_api_key': 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b',
        'Content-Type': 'application/json'
      },
      data: {
        pinataMetadata: {
          name: `hydrogen-credit-${creditData.creditId}`,
          keyvalues: {
            type: 'green-hydrogen-credit',
            creditId: creditData.creditId,
            producer: creditData.producer.address
          }
        },
        pinataContent: creditData
      }
    });

    console.log('✅ Upload successful!');
    console.log('IPFS Hash:', response.data.IpfsHash);
    console.log('View at:', `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.response?.data || error.message);
  }
}

uploadSampleCredit();
