const express = require('express');
const blockchainService = require('../../services/blockchain.service');

const router = express.Router();

/**
 * @route GET /api/marketplace
 * @desc Get all active marketplace listings
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    console.log('Fetching marketplace listings...');
    
    const listings = await blockchainService.getActiveListings();
    
    res.json({
      message: 'Marketplace listings fetched successfully',
      count: listings.length,
      listings
    });

  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch marketplace listings'
    });
  }
});

/**
 * @route GET /api/marketplace/:tokenId
 * @desc Get specific listing details
 * @access Public
 */
router.get('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    if (!tokenId || isNaN(tokenId)) {
      return res.status(400).json({
        error: 'Invalid token ID',
        message: 'Token ID must be a valid number'
      });
    }

    const listing = await blockchainService.getListing(tokenId);
    
    res.json({
      message: 'Listing details fetched successfully',
      listing
    });

  } catch (error) {
    console.error(`Error fetching listing for token ${req.params.tokenId}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch listing details'
    });
  }
});

/**
 * @route GET /api/marketplace/stats
 * @desc Get marketplace statistics
 * @access Public
 */
router.get('/stats', async (req, res) => {
  try {
    const totalSupply = await blockchainService.getTotalSupply();
    const activeListings = await blockchainService.getActiveListings();
    
    // Calculate basic stats
    const totalActiveListings = activeListings.length;
    const totalSold = totalSupply - totalActiveListings;
    
    let totalValue = 0;
    let averagePrice = 0;
    
    if (activeListings.length > 0) {
      totalValue = activeListings.reduce((sum, listing) => sum + parseFloat(listing.price), 0);
      averagePrice = totalValue / activeListings.length;
    }

    res.json({
      message: 'Marketplace statistics fetched successfully',
      stats: {
        totalSupply,
        totalActiveListings,
        totalSold,
        totalValue: totalValue.toFixed(4),
        averagePrice: averagePrice.toFixed(4),
        currency: 'MATIC'
      }
    });

  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch marketplace statistics'
    });
  }
});

/**
 * @route GET /api/marketplace/connection/status
 * @desc Check blockchain connection status
 * @access Public
 */
router.get('/connection/status', async (req, res) => {
  try {
    const status = await blockchainService.getConnectionStatus();
    
    res.json({
      message: 'Connection status retrieved successfully',
      blockchain: status
    });

  } catch (error) {
    console.error('Error checking connection status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check connection status'
    });
  }
});

module.exports = router;
