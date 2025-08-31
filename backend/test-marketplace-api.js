// Test marketplace API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testMarketplaceAPI() {
  try {
    console.log('🔍 Testing Marketplace API...');
    
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test marketplace listings endpoint
    console.log('\n2. Testing marketplace listings endpoint...');
    const listingsResponse = await axios.get(`${BASE_URL}/api/marketplace/listings`);
    console.log('✅ Marketplace listings:', listingsResponse.data);
    
    // Test with sample data from submissions
    console.log('\n3. Testing with sample producer login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/users/login`, {
      walletAddress: '0x2da70255e14c94791c31150fcf4342a977abe0ac'
    });
    console.log('✅ Login successful:', loginResponse.data.user.name);
    
    const token = loginResponse.data.token;
    
    // Test creating a marketplace listing
    console.log('\n4. Testing marketplace listing creation...');
    const listingData = {
      creditId: '6048', // From submissions.json
      pricePerCredit: 1.5,
      creditsToSell: 5
    };
    
    const createListingResponse = await axios.post(
      `${BASE_URL}/api/marketplace/listings`,
      listingData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Listing created successfully:', createListingResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('💡 Tip: Make sure the backend server is running on port 5000');
    }
  }
}

testMarketplaceAPI();
