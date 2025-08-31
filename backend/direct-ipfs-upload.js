const axios = require('axios');

// Direct IPFS upload without dependencies
const PINATA_API_KEY = 'b1db297e4e5c4934f716';
const PINATA_SECRET_KEY = 'f9098aabf14effdcb5ca02b18f4bc246d07620d1f223ef5c48a458825e6d908b';

async function directIPFSUpload() {
  console.log('🚀 Direct IPFS Upload - Creating Sample Credits');
  
  const sampleCredits = [
    {
      version: '1.0',
      type: 'green-hydrogen-credit',
      creditId: 'GH2_CREDIT_2024_001',
      producer: {
        address: '0x742d35Cc6634C0532925a3b8D4c2C2F1C2E5d226',
        name: 'EcoHydrogen Solutions'
      },
      production: {
        date: '2024-01-15',
        quantity: 250,
        location: 'Solar Farm Alpha, California',
        method: 'Solar Electrolysis',
        additionalNotes: 'Produced using 100% renewable solar energy'
      },
      credits: {
        amount: 2500,
        generatedAt: '2024-01-15T10:00:00Z',
        approvedBy: 'regulatory-authority',
        approvedAt: '2024-01-15T12:00:00Z',
        status: 'active',
        ownership: {
          currentOwner: '0x742d35Cc6634C0532925a3b8D4c2C2F1C2E5d226',
          transferHistory: []
        }
      },
      verification: {
        submissionId: 'SUB_2024_001',
        status: 'APPROVED'
      },
      metadata: {
        createdAt: '2024-01-15T10:00:00Z',
        lastUpdated: '2024-01-15T12:00:00Z',
        standard: 'GH2-Credit-v1.0',
        network: 'development'
      }
    },
    {
      version: '1.0',
      type: 'green-hydrogen-credit',
      creditId: 'GH2_CREDIT_2024_002',
      producer: {
        address: '0x8ba1f109551bD432803012645Hac136c4c2C2F1C',
        name: 'WindHydrogen Corp'
      },
      production: {
        date: '2024-01-20',
        quantity: 180,
        location: 'Offshore Wind Farm Beta, Texas',
        method: 'Wind Electrolysis',
        additionalNotes: 'Generated from offshore wind turbines'
      },
      credits: {
        amount: 1800,
        generatedAt: '2024-01-20T14:00:00Z',
        approvedBy: 'regulatory-authority',
        approvedAt: '2024-01-20T16:00:00Z',
        status: 'active',
        ownership: {
          currentOwner: '0x8ba1f109551bD432803012645Hac136c4c2C2F1C',
          transferHistory: []
        }
      },
      verification: {
        submissionId: 'SUB_2024_002',
        status: 'APPROVED'
      },
      metadata: {
        createdAt: '2024-01-20T14:00:00Z',
        lastUpdated: '2024-01-20T16:00:00Z',
        standard: 'GH2-Credit-v1.0',
        network: 'development'
      }
    }
  ];

  try {
    for (let i = 0; i < sampleCredits.length; i++) {
      const credit = sampleCredits[i];
      console.log(`\n📤 Uploading Credit ${i + 1}: ${credit.producer.name}`);
      
      const formData = new FormData();
      const blob = new Blob([JSON.stringify(credit, null, 2)], { type: 'application/json' });
      formData.append('file', blob, `hydrogen-credit-${credit.creditId}.json`);
      
      const metadata = {
        name: `hydrogen-credit-${credit.creditId}`,
        keyvalues: {
          type: 'green-hydrogen-credit',
          creditId: credit.creditId,
          producer: credit.producer.address,
          status: credit.credits.status
        }
      };
      formData.append('pinataMetadata', JSON.stringify(metadata));
      
      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log(`✅ Uploaded: ${response.data.IpfsHash}`);
      console.log(`🌐 View: https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`);
    }
    
    console.log('\n🎉 All sample credits uploaded successfully!');
    console.log('💡 Now refresh your frontend /credits page to see them');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.response?.data || error.message);
  }
}

// Use browser-compatible FormData if available, otherwise use a polyfill
if (typeof FormData === 'undefined') {
  global.FormData = require('form-data');
  global.Blob = require('blob-polyfill').Blob;
}

directIPFSUpload();
