// Simple test for marketplace listing creation
const axios = require('axios');

async function testSimple() {
  try {
    // Test login first
    const loginResponse = await axios.post('http://localhost:5000/api/users/login', {
      walletAddress: '0x2da70255e14c94791c31150fcf4342a977abe0ac'
    });
    
    console.log('Login successful:', loginResponse.data.user.name);
    const token = loginResponse.data.token;
    
    // Test marketplace listing creation
    const listingData = {
      creditId: '6048',
      pricePerCredit: 1.5,
      creditsToSell: 5
    };
    
    console.log('Creating listing with data:', listingData);
    
    const response = await axios.post(
      'http://localhost:5000/api/marketplace/listings',
      listingData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSimple();
