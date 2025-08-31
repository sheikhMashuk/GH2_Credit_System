require('dotenv').config({ path: '../.env' });
const CreditLifecycleService = require('./src/services/credit-lifecycle.service');
const IPFSService = require('./src/services/ipfs.service');

async function testCreditBurnFlow() {
  console.log('=== Testing Credit Burn and IPFS Flow ===\n');
  
  // Test 1: Check IPFS service initialization
  console.log('1. Testing IPFS service initialization...');
  console.log('IPFS Service loaded:', typeof CreditLifecycleService);
  
  // Test 2: Test credit burn with mock data
  console.log('\n2. Testing credit burn flow...');
  try {
    const mockCreditId = 'CREDIT-BURN-TEST-001';
    const mockFromAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const mockToAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
    const mockAmount = 25;
    
    console.log(`Simulating purchase of ${mockAmount} credits...`);
    console.log(`From: ${mockFromAddress}`);
    console.log(`To: ${mockToAddress}`);
    
    // This will try to burn credits and store to IPFS
    const burnResult = await CreditLifecycleService.handleCreditTransfer(
      mockCreditId,
      mockFromAddress,
      mockToAddress,
      mockAmount,
      'sale'
    );
    
    console.log('Burn result:', burnResult);
    
    if (burnResult.success) {
      console.log('✓ Credit burn successful');
      console.log('✓ Credits burned:', mockAmount);
      console.log('✓ Burn type:', burnResult.transferType);
      console.log('✓ IPFS Hash:', burnResult.ipfsHash || 'Not stored');
      console.log('✓ Burned at:', burnResult.burnedAt);
    } else {
      console.log('❌ Credit burn failed:', burnResult.error);
    }
    
  } catch (error) {
    console.error('❌ Error in burn flow test:', error.message);
  }
  
  // Test 3: Direct IPFS test with burn data
  console.log('\n3. Testing direct IPFS upload with burn data...');
  try {
    const burnData = {
      version: '1.0',
      type: 'green-hydrogen-credit-burned',
      creditId: 'DIRECT-TEST-001',
      originalProducer: {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'Test Producer'
      },
      buyer: {
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        name: 'Test Buyer'
      },
      burnDetails: {
        creditsBurned: 10,
        burnedAt: new Date().toISOString(),
        burnReason: 'Test credit retirement',
        purchasePrice: 0.01,
        purchasePriceUSD: 20
      },
      metadata: {
        burnedAt: new Date().toISOString(),
        standard: 'GH2-Credit-Burn-v1.0',
        purpose: 'Test burn for IPFS verification'
      }
    };
    
    const directHash = await IPFSService.pinJSONToIPFS(burnData, `test-burn-${Date.now()}`);
    
    if (directHash) {
      console.log('✓ Direct IPFS upload successful');
      console.log('✓ IPFS Hash:', directHash);
      console.log('✓ View at:', `https://gateway.pinata.cloud/ipfs/${directHash}`);
    } else {
      console.log('❌ Direct IPFS upload failed');
    }
    
  } catch (error) {
    console.error('❌ Direct IPFS test error:', error.message);
  }
  
  console.log('\n=== Credit Burn Flow Test Complete ===');
}

testCreditBurnFlow().catch(console.error);
