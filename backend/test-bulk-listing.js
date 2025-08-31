// Test bulk marketplace listing creation
const axios = require('axios');

async function testBulkListing() {
  try {
    // Login as producer
    const loginResponse = await axios.post('http://localhost:5000/api/users/login', {
      walletAddress: '0x2da70255e14c94791c31150fcf4342a977abe0ac'
    });
    
    console.log('✅ Login successful:', loginResponse.data.user.name);
    const token = loginResponse.data.token;
    
    // Test bulk marketplace listing creation
    const bulkListingData = {
      creditId: 'bulk',
      pricePerCredit: 2.0,
      creditsToSell: 10
    };
    
    console.log('📦 Creating bulk listing with data:', bulkListingData);
    
    const response = await axios.post(
      'http://localhost:5000/api/marketplace/listings',
      bulkListingData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Bulk listing created successfully:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testBulkListing();
