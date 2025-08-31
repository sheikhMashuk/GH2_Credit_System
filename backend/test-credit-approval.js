require('dotenv').config();
const axios = require('axios');

async function testCreditApprovalFlow() {
  console.log('=== Testing Credit Approval with IPFS Integration ===\n');
  
  const baseURL = 'http://localhost:5000';
  
  try {
    // Step 1: Login as regulatory authority
    console.log('1. Logging in as regulatory authority...');
    const loginResponse = await axios.post(`${baseURL}/api/regulatory/login`, {
      email: 'admin@greenregulator.gov',
      password: 'RegAuth2024!'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Login successful');
    
    // Step 2: Get pending submissions
    console.log('\n2. Fetching pending submissions...');
    const submissionsResponse = await axios.get(`${baseURL}/api/regulatory/submissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const pendingSubmissions = submissionsResponse.data.filter(s => s.status === 'PENDING');
    console.log(`✓ Found ${pendingSubmissions.length} pending submissions`);
    
    if (pendingSubmissions.length === 0) {
      console.log('No pending submissions to approve');
      return;
    }
    
    // Step 3: Approve the first pending submission
    const submissionToApprove = pendingSubmissions[0];
    console.log(`\n3. Approving submission ${submissionToApprove._id}...`);
    console.log(`   Producer: ${submissionToApprove.producerId}`);
    console.log(`   Quantity: ${submissionToApprove.productionData.quantity} kg`);
    
    const approvalResponse = await axios.post(
      `${baseURL}/api/regulatory/submissions/${submissionToApprove._id}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✓ Approval response received');
    console.log('Credit ID:', approvalResponse.data.creditInfo?.creditId);
    console.log('Credits Generated:', approvalResponse.data.creditInfo?.credits);
    console.log('IPFS Upload:', approvalResponse.data.creditInfo?.ipfsUpload ? 'SUCCESS' : 'FAILED');
    console.log('IPFS Hash:', approvalResponse.data.creditInfo?.ipfsHash);
    
    if (approvalResponse.data.creditInfo?.ipfsHash) {
      console.log(`\n✓ View credit on IPFS: https://gateway.pinata.cloud/ipfs/${approvalResponse.data.creditInfo.ipfsHash}`);
    }
    
  } catch (error) {
    console.error('✗ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.error('Server error - check backend logs');
    }
  }
}

// Start the test
testCreditApprovalFlow();
