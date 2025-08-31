require('dotenv').config({ path: '../.env' });
const IPFSService = require('./src/services/ipfs.service');

async function generateSampleCredits() {
  console.log('🏭 Generating Sample Green Hydrogen Credits\n');
  
  const sampleCredits = [
    {
      version: '1.0',
      type: 'green-hydrogen-credit',
      creditId: `GH2_CREDIT_${Date.now()}_001`,
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
        submissionId: `SUB_${Date.now()}_001`,
        status: 'APPROVED'
      },
      metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        standard: 'GH2-Credit-v1.0',
        network: 'development'
      }
    },
    {
      version: '1.0',
      type: 'green-hydrogen-credit',
      creditId: `GH2_CREDIT_${Date.now()}_002`,
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
        generatedAt: new Date().toISOString(),
        approvedBy: 'regulatory-authority',
        approvedAt: new Date().toISOString(),
        status: 'active',
        ownership: {
          currentOwner: '0x8ba1f109551bD432803012645Hac136c4c2C2F1C',
          transferHistory: []
        }
      },
      verification: {
        submissionId: `SUB_${Date.now()}_002`,
        status: 'APPROVED'
      },
      metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        standard: 'GH2-Credit-v1.0',
        network: 'development'
      }
    },
    {
      version: '1.0',
      type: 'green-hydrogen-credit',
      creditId: `GH2_CREDIT_${Date.now()}_003`,
      producer: {
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        name: 'HydroGreen Technologies'
      },
      production: {
        date: '2024-01-25',
        quantity: 320,
        location: 'Hydroelectric Plant Gamma, Oregon',
        method: 'Hydro Electrolysis',
        additionalNotes: 'Powered by sustainable hydroelectric energy'
      },
      credits: {
        amount: 3200,
        generatedAt: new Date().toISOString(),
        approvedBy: 'regulatory-authority',
        approvedAt: new Date().toISOString(),
        status: 'active',
        ownership: {
          currentOwner: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
          transferHistory: []
        }
      },
      verification: {
        submissionId: `SUB_${Date.now()}_003`,
        status: 'APPROVED'
      },
      metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        standard: 'GH2-Credit-v1.0',
        network: 'development'
      }
    }
  ];

  try {
    console.log('📤 Uploading sample credits to IPFS...\n');
    
    for (let i = 0; i < sampleCredits.length; i++) {
      const credit = sampleCredits[i];
      console.log(`${i + 1}. Uploading ${credit.producer.name} credit...`);
      console.log(`   Credit ID: ${credit.creditId}`);
      console.log(`   Amount: ${credit.credits.amount} credits`);
      console.log(`   Production: ${credit.production.quantity} kg H2`);
      
      const ipfsHash = await IPFSService.storeCreditInIPFS(credit);
      
      if (ipfsHash) {
        console.log(`   ✅ Uploaded to IPFS: ${ipfsHash}`);
        console.log(`   🌐 View: https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      } else {
        console.log(`   ❌ Failed to upload`);
      }
      console.log('');
    }
    
    // Verify uploads
    console.log('🔍 Verifying uploads...');
    const allCredits = await IPFSService.getAllCreditsFromIPFS();
    console.log(`✅ Successfully retrieved ${allCredits.length} credits from IPFS\n`);
    
    if (allCredits.length > 0) {
      console.log('📋 Credits Summary:');
      allCredits.forEach((credit, index) => {
        console.log(`  ${index + 1}. ${credit.name}`);
        console.log(`     Producer: ${credit.producer}`);
        console.log(`     Credit ID: ${credit.creditId}`);
        console.log(`     IPFS Hash: ${credit.ipfsHash}`);
        console.log(`     Date: ${new Date(credit.dateUploaded).toLocaleString()}`);
        console.log('');
      });
      
      console.log('🎉 Sample credits successfully generated!');
      console.log('💡 Now you can view them in the frontend at /credits');
    }
    
  } catch (error) {
    console.error('❌ Error generating sample credits:', error.message);
    
    // Debug info
    console.log('\n🔍 Debug Information:');
    console.log('PINATA_API_KEY:', process.env.PINATA_API_KEY ? 'Found' : 'Missing');
    console.log('PINATA_SECRET_KEY:', process.env.PINATA_SECRET_KEY ? 'Found' : 'Missing');
    
    if (error.response) {
      console.log('API Response:', error.response.data);
    }
  }
}

generateSampleCredits();
