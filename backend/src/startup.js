const { seedRegulatoryAuthority } = require('./seeders/regulatory-authority');
const { initializeBlockchainListeners } = require('./startup/blockchain-listener');

const runStartup = async () => {
  console.log('Running startup tasks...');
  
  try {
    // Create regulatory authority user
    await seedRegulatoryAuthority();
    console.log('✅ Regulatory authority user ready');
    
    // Initialize blockchain event listeners for real-time IPFS sync
    await initializeBlockchainListeners();
    console.log('✅ Blockchain event listeners initialized');
    
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
  }
};

// Run startup tasks
runStartup();
