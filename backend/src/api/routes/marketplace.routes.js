const express = require('express');
const marketplaceController = require('../controllers/marketplace.controller');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/marketplace/listings
 * @desc Create a new marketplace listing (Producer only)
 * @access Private (Producer)
 */
router.post('/listings', authenticateToken, marketplaceController.createListing);

/**
 * @route GET /api/marketplace/listings
 * @desc Get all active marketplace listings
 * @access Public
 */
router.get('/listings', marketplaceController.getActiveListings);

/**
 * @route GET /api/marketplace/my-listings
 * @desc Get producer's marketplace listings
 * @access Private (Producer)
 */
router.get('/my-listings', authenticateToken, marketplaceController.getMyListings);

/**
 * @route POST /api/marketplace/purchase
 * @desc Purchase credits from marketplace (Buyer only)
 * @access Private (Buyer)
 */
router.post('/purchase', authenticateToken, marketplaceController.purchaseCredits);

/**
 * @route GET /api/marketplace/transactions
 * @desc Get public transaction history
 * @access Public
 */
router.get('/transactions', marketplaceController.getTransactionHistory);

module.exports = router;
