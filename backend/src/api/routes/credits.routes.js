const express = require('express');
const router = express.Router();
const blockchainService = require('../../services/blockchain.service');
const creditsController = require('../controllers/credits.controller');

/**
 * @route GET /api/credits
 * @desc Get all credits from IPFS
 */
router.get('/', creditsController.getAllCredits);

/**
 * @route GET /api/credits/producer/:address
 * @desc Get credits for specific producer from IPFS
 */
router.get('/producer/:address', creditsController.getProducerCredits);

/**
 * @route GET /api/credits/ipfs/:hash
 * @desc Get specific credit by IPFS hash
 */
router.get('/ipfs/:hash', creditsController.getCreditByHash);

/**
 * @route GET /api/credits/:creditId/verified
 * @desc Get credit with blockchain verification
 */
router.get('/:creditId/verified', creditsController.getVerifiedCredit);

/**
 * @route POST /api/credits/:creditId/sync
 * @desc Manually sync credit to IPFS
 */
router.post('/:creditId/sync', creditsController.syncCreditToIPFS);

/**
 * @route GET /api/credits/blockchain/all
 * @desc Get all approved credits from blockchain (legacy)
 */
router.get('/blockchain/all', async (req, res) => {
  try {
    console.log('Fetching all approved credits from blockchain...');
    const credits = await blockchainService.getApprovedCredits();
    
    res.json({
      message: 'Credits retrieved successfully from blockchain',
      credits: credits,
      total: credits.length,
      source: 'blockchain'
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch credits from blockchain'
    });
  }
});

/**
 * @route GET /api/credits/blockchain/:creditId
 * @desc Get specific credit details from blockchain (legacy)
 */
router.get('/blockchain/:creditId', async (req, res) => {
  try {
    const { creditId } = req.params;
    console.log(`Fetching credit details for ID: ${creditId}`);
    
    const credit = await blockchainService.getCredit(creditId);
    
    res.json({
      message: 'Credit details retrieved successfully from blockchain',
      credit: credit,
      source: 'blockchain'
    });
  } catch (error) {
    console.error(`Error fetching credit ${req.params.creditId}:`, error);
    res.status(404).json({
      error: 'Credit not found',
      message: 'The requested credit does not exist or could not be retrieved'
    });
  }
});

/**
 * @route GET /api/credits/stats/total
 * @desc Get total number of credits generated
 */
router.get('/stats/total', async (req, res) => {
  try {
    console.log('Fetching total credits...');
    const totalCredits = await blockchainService.getTotalCredits();
    
    res.json({
      message: 'Total credits retrieved successfully',
      totalCredits: totalCredits
    });
  } catch (error) {
    console.error('Error fetching total credits:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch total credits'
    });
  }
});

/**
 * @route GET /api/credits/stats
 * @desc Get credit statistics for marketplace
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('Fetching credit statistics...');
    
    // Get total credits from blockchain
    const totalCredits = await blockchainService.getTotalCredits();
    
    // Get all credits from IPFS
    const allCredits = await creditsController.getAllCreditsData();
    
    // Calculate statistics
    const stats = {
      totalCredits: totalCredits || 0,
      totalListings: allCredits.length || 0,
      averagePrice: allCredits.length > 0 ? 
        allCredits.reduce((sum, credit) => sum + (credit.pricePerCredit || 0), 0) / allCredits.length : 0,
      totalValue: allCredits.reduce((sum, credit) => 
        sum + ((credit.credits || 0) * (credit.pricePerCredit || 0)), 0
      )
    };
    
    res.json({
      message: 'Credit statistics retrieved successfully',
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching credit statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch credit statistics',
      stats: {
        totalCredits: 0,
        totalListings: 0,
        averagePrice: 0,
        totalValue: 0
      }
    });
  }
});

module.exports = router;
