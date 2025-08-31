require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function testBurnIntegration() {
  console.log('=== Testing Credit Burn Integration ===\n');
  
  // Test 1: Direct Pinata test with burn data
  console.log('1. Testing direct Pinata upload with burn data...');
  
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;
  
  if (!apiKey || !secretKey) {
    console.error('❌ Missing Pinata credentials');
    return;
  }
  
  try {
    const burnData = {
      version: '1.0',
      type: 'green-hydrogen-credit-burned',
      creditId: 'BURN-TEST-001',
      originalProducer: {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'Test Producer'
      },
      buyer: {
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        name: 'Test Buyer'
      },
      burnDetails: {
        originalCredits: 100,
        creditsBurned: 25,
        burnedAt: new Date().toISOString(),
        burnReason: 'Credit purchase and consumption',
        burnType: 'sale',
        purchasePrice: 0.025, // 25 * 0.001 ETH
        purchasePriceUSD: 50 // 25 * 0.001 * 2000
      },
      verification: {
        burnStatus: 'BURNED_AND_CONSUMED',
        burnedBy: '0xabcdef1234567890abcdef1234567890abcdef12',
        burnTransaction: new Date().toISOString()
      },
      metadata: {
        burnedAt: new Date().toISOString(),
        standard: 'GH2-Credit-Burn-v1.0',
        network: 'development',
        immutable: true,
        purpose: 'Carbon credit retirement and consumption tracking'
      }
    };
    
    console.log('Uploading burn data to Pinata...');
    console.log('Data size:', JSON.stringify(burnData).length, 'bytes');
    
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: burnData,
        pinataMetadata: {
          name: `burn-test-${Date.now()}`,
          keyvalues: {
            type: 'green-hydrogen-credit-burned',
            creditId: 'BURN-TEST-001',
            burnType: 'sale'
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': apiKey,
          'pinata_secret_api_key': secretKey
        },
        timeout: 30000
      }
    );
    
    console.log('✓ Burn data uploaded successfully!');
    console.log('✓ IPFS Hash:', response.data.IpfsHash);
    console.log('✓ View at:', `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`);
    
    // Test 2: Verify data retrieval
    console.log('\n2. Testing burn data retrieval...');
    const retrieveResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`, {
      timeout: 10000
    });
    
    console.log('✓ Data retrieved successfully');
    console.log('✓ Credit ID:', retrieveResponse.data.creditId);
    console.log('✓ Credits burned:', retrieveResponse.data.burnDetails.creditsBurned);
    console.log('✓ Burn status:', retrieveResponse.data.verification.burnStatus);
    console.log('✓ Purchase price:', retrieveResponse.data.burnDetails.purchasePrice, 'ETH');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
  
  console.log('\n=== Burn Integration Test Complete ===');
}

testBurnIntegration().catch(console.error);
