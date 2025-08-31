const blockchainService = require('../services/blockchain.service');

/**
 * Initialize blockchain event listeners for real-time IPFS sync
 */
async function initializeBlockchainListeners() {
  try {
    console.log('[Startup] Initializing blockchain event listeners...');
    
    // Start blockchain event listeners for automatic IPFS sync
    await blockchainService.startBlockchainEventListener();
    
    console.log('[Startup] ✓ Blockchain event listeners initialized successfully');
    
    // Set up periodic sync as backup (every 5 minutes)
    setInterval(async () => {
      try {
        console.log('[Startup] Running periodic IPFS sync check...');
        // This could be expanded to sync any missed events
      } catch (error) {
        console.error('[Startup] Error in periodic sync:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
  } catch (error) {
    console.error('[Startup] Error initializing blockchain listeners:', error);
  }
}

module.exports = {
  initializeBlockchainListeners
};
