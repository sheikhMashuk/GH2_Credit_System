const axios = require('axios');

async function testCreditDeduction() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    // Test server health
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✓ Server is running');
    
    // Login as producer
    console.log('\n2. Logging in as producer...');
    const loginResponse = await axios.post(`${baseURL}/users/login`, {
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C8db4C2b3b5C8E'
    });
    const token = loginResponse.data.token;
    console.log('✓ Producer logged in');
    
    // Get producer credits before listing
    console.log('\n3. Getting producer credits before listing...');
    const creditsBeforeResponse = await axios.get(`${baseURL}/credits/producer`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const creditsBefore = creditsBeforeResponse.data.credits;
    console.log('Credits before listing:', creditsBefore.map(c => ({
      id: c.creditId,
      credits: c.credits,
      listedCredits: c.listedCredits || 0
    })));
    
    // Create a marketplace listing
    console.log('\n4. Creating marketplace listing...');
    const listingResponse = await axios.post(`${baseURL}/marketplace/create`, {
      creditId: 'bulk',
      creditsToSell: 5,
      pricePerCredit: 10
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ Listing created:', listingResponse.data.listing);
    
    // Get producer credits after listing
    console.log('\n5. Getting producer credits after listing...');
    const creditsAfterResponse = await axios.get(`${baseURL}/credits/producer`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const creditsAfter = creditsAfterResponse.data.credits;
    console.log('Credits after listing:', creditsAfter.map(c => ({
      id: c.creditId,
      credits: c.credits,
      listedCredits: c.listedCredits || 0
    })));
    
    // Compare before and after
    console.log('\n6. Credit deduction analysis:');
    creditsBefore.forEach((before, index) => {
      const after = creditsAfter[index];
      if (after) {
        const deducted = before.credits - after.credits;
        console.log(`Credit ${before.creditId}: ${before.credits} → ${after.credits} (deducted: ${deducted})`);
      }
    });
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testCreditDeduction();
