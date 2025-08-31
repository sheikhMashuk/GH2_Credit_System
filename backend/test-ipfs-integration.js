require('dotenv').config();
const CreditLifecycleService = require('./src/services/credit-lifecycle.service');
const IPFSService = require('./src/services/ipfs.service');

async function testIPFSIntegration() {
  console.log('=== Testing IPFS Integration ===\n');
  
  // Test 1: Check environment variables
  console.log('1. Checking environment variables...');
  console.log('PINATA_API_KEY:', process.env.PINATA_API_KEY ? '✓ Set' : '✗ Missing');
  console.log('PINATA_SECRET_KEY:', process.env.PINATA_SECRET_KEY ? '✓ Set' : '✗ Missing');
  
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
    console.log('❌ Missing Pinata credentials - cannot proceed with tests');
    return;
  }
  
  // Test 2: Direct IPFS service test
  console.log('\n2. Testing direct IPFS service...');
  try {
    const testData = {
      creditId: 'TEST-001',
      producer: { address: '0x123...', name: 'Test Producer' },
      credits: { amount: 100, status: 'active' },
      timestamp: new Date().toISOString()
    };
    
    const hash = await IPFSService.pinJSONToIPFS(testData, 'test-credit-upload');
    console.log('✓ Direct IPFS upload successful:', hash);
  } catch (error) {
    console.log('✗ Direct IPFS upload failed:', error.message);
  }
  
  // Test 3: Credit lifecycle service test
  console.log('\n3. Testing credit lifecycle service...');
  try {
    const mockSubmission = {
      _id: 'sub-001',
      producerId: 'prod-001',
      productionData: {
        productionDate: '2024-01-15',
        quantity: 10,
        location: 'Test Facility',
        method: 'Electrolysis'
      },
      status: 'APPROVED',
      createdAt: new Date().toISOString()
    };
    
    const mockCreditResult = {
      creditId: 'CREDIT-001',
      credits: 100,
      quantity: 10
    };
    
    const result = await CreditLifecycleService.handleCreditApproval(mockSubmission, mockCreditResult);
    console.log('✓ Credit lifecycle test result:', result.success ? 'SUCCESS' : 'FAILED');
    if (result.ipfsHash) {
      console.log('IPFS Hash:', result.ipfsHash);
    }
  } catch (error) {
    console.log('✗ Credit lifecycle test failed:', error.message);
  }

  // Test 4: Credit transfer test
  console.log('\n4. Testing credit transfer...');
  try {
    const transferResult = await CreditLifecycleService.handleCreditTransfer(
      'CREDIT-001',
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xabcdef1234567890abcdef1234567890abcdef12',
      50,
      'sale'
    );
    console.log('✓ Credit transfer test result:', transferResult.success ? 'SUCCESS' : 'FAILED');
    if (transferResult.ipfsHash) {
      console.log('Transfer IPFS Hash:', transferResult.ipfsHash);
    }
  } catch (error) {
    console.log('✗ Credit transfer test failed:', error.message);
  }

  // Test 5: Credit status change test
  console.log('\n5. Testing credit status change...');
  try {
    const statusResult = await CreditLifecycleService.handleCreditStatusChange(
      'CREDIT-001',
      'listed_for_sale',
      'Credit listed on marketplace for testing'
    );
    console.log('✓ Credit status change test result:', statusResult.success ? 'SUCCESS' : 'FAILED');
    if (statusResult.ipfsHash) {
      console.log('Status Change IPFS Hash:', statusResult.ipfsHash);
    }
  } catch (error) {
    console.log('✗ Credit status change test failed:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
}

testIPFSIntegration().catch(console.error);
