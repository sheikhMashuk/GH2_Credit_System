const { seedRegulatoryAuthority } = require('./seeders/regulatory-authority');

const runStartup = async () => {
  console.log('Running startup tasks...');
  
  try {
    // Create regulatory authority user
    await seedRegulatoryAuthority();
    console.log('✅ Regulatory authority user ready');
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
  }
};

// Run startup tasks
runStartup();
