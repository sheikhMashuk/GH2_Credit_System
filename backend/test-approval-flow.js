const axios = require('axios');
require('dotenv').config();

async function testApprovalFlow() {
  const baseURL = 'http://localhost:5000';
  
  try {
    // Test server connection
    console.log('Testing server connection...');
    await axios.get(`${baseURL}/api/health`);
    console.log('✓ Server is running');
    
    // Login as regulatory authority
    console.log('\nLogging in as regulatory authority...');
    const loginResponse = await axios.post(`${baseURL}/api/regulatory/login`, {
      email: 'admin@greenregulator.gov',
      password: 'RegAuth2024!'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Login successful');
    
    // Get pending submissions
    console.log('\nFetching submissions...');
    const submissionsResponse = await axios.get(`${baseURL}/api/regulatory/submissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const submissions = submissionsResponse.data;
    const pendingSubmissions = submissions.filter(s => s.status === 'PENDING');
    
    console.log(`Found ${submissions.length} total submissions`);
    console.log(`Found ${pendingSubmissions.length} pending submissions`);
    
    if (pendingSubmissions.length > 0) {
      const submission = pendingSubmissions[0];
      console.log(`\nApproving submission ${submission._id}...`);
      console.log(`Quantity: ${submission.productionData.quantity} kg`);
      console.log(`Expected credits: ${submission.productionData.quantity * 10}`);
      
      const approvalResponse = await axios.post(
        `${baseURL}/api/regulatory/submissions/${submission._id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('\n✓ Approval successful!');
      console.log('Credit ID:', approvalResponse.data.creditInfo?.creditId);
      console.log('Credits:', approvalResponse.data.creditInfo?.credits);
      console.log('IPFS Upload:', approvalResponse.data.creditInfo?.ipfsUpload ? 'SUCCESS' : 'FAILED');
      console.log('IPFS Hash:', approvalResponse.data.creditInfo?.ipfsHash);
      
      if (approvalResponse.data.creditInfo?.ipfsHash) {
        console.log(`\n🌐 View on IPFS: https://gateway.pinata.cloud/ipfs/${approvalResponse.data.creditInfo.ipfsHash}`);
      }
    } else {
      console.log('\nNo pending submissions to approve');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('Backend server is not running. Please start it with: npm start');
    }
  }
}

testApprovalFlow();
