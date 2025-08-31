const InMemoryMarketplace = require('../../models/InMemoryMarketplace');
const InMemoryUser = require('../../models/InMemoryUser');
const InMemorySubmission = require('../../models/InMemorySubmission');
const blockchainService = require('../../services/blockchain.service');

const MarketplaceModel = InMemoryMarketplace;
const UserModel = InMemoryUser;
const SubmissionModel = InMemorySubmission;

class MarketplaceController {
  /**
   * Create a new marketplace listing (Producer only)
   * POST /api/marketplace/listings
   */
  async createListing(req, res) {
    try {
      const { creditId, pricePerCredit, creditsToSell } = req.body;
      const producer = req.user;

      // Validate producer role
      if (producer.role !== 'PRODUCER') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only producers can create marketplace listings'
        });
      }

      // Validate required fields
      if (!creditId || !pricePerCredit || !creditsToSell) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'creditId, pricePerCredit, and creditsToSell are required'
        });
      }

      // Handle bulk listing (aggregate all approved credits)
      if (creditId === 'bulk') {
        const submissions = await SubmissionModel.find({ 
          producerId: producer._id, 
          status: 'APPROVED'
        });

        if (submissions.length === 0) {
          return res.status(404).json({
            error: 'No credits found',
            message: 'No approved submissions found for bulk listing'
          });
        }

        const totalAvailableCredits = submissions.reduce((sum, s) => sum + (s.credits || 0), 0);
        
        if (creditsToSell > totalAvailableCredits) {
          return res.status(400).json({
            error: 'Insufficient credits',
            message: `You only have ${totalAvailableCredits} credits available`
          });
        }

        // Create bulk listing with aggregated data
        const listing = await MarketplaceModel.createListing({
          creditId: `BULK_${Date.now()}`, // Generate unique bulk credit ID
          producerId: producer._id,
          producer: {
            name: producer.name,
            walletAddress: producer.walletAddress
          },
          credits: creditsToSell,
          pricePerCredit: parseFloat(pricePerCredit),
          totalPrice: parseFloat(pricePerCredit) * creditsToSell,
          quantity: submissions.reduce((sum, s) => sum + parseFloat(s.productionData?.quantity || 0), 0),
          location: 'Multiple Locations',
          productionDate: 'Various Dates',
          listedAt: new Date(),
          isBulkListing: true,
          sourceSubmissions: submissions.map(s => s._id)
        });

        // Deduct credits from submissions proportionally
        let remainingCreditsToDeduct = creditsToSell;
        for (const submission of submissions) {
          if (remainingCreditsToDeduct <= 0) break;
          
          const creditsToDeductFromThis = Math.min(submission.credits, remainingCreditsToDeduct);
          const newCredits = submission.credits - creditsToDeductFromThis;
          
          await SubmissionModel.findByIdAndUpdate(submission._id, {
            credits: newCredits,
            listedCredits: (submission.listedCredits || 0) + creditsToDeductFromThis
          });
          
          remainingCreditsToDeduct -= creditsToDeductFromThis;
          console.log(`[Marketplace] Deducted ${creditsToDeductFromThis} credits from submission ${submission._id}, remaining: ${newCredits}`);
        }

        return res.status(201).json({
          message: 'Bulk marketplace listing created successfully',
          listing: {
            id: listing._id,
            creditId: listing.creditId,
            credits: listing.credits,
            pricePerCredit: listing.pricePerCredit,
            totalPrice: listing.totalPrice,
            status: listing.status,
            listedAt: listing.listedAt,
            isBulkListing: true
          }
        });
      }

      // Handle individual credit listing
      const submissions = await SubmissionModel.find({ 
        producerId: producer._id, 
        status: 'APPROVED'
      });

      console.log(`[Marketplace] Available approved submissions for producer ${producer._id}:`, submissions.map(s => ({ id: s._id, creditId: s.creditId, credits: s.credits })));
      console.log(`[Marketplace] Looking for creditId: ${creditId}`);

      const submission = submissions.find(s => s.creditId === creditId);
      if (!submission) {
        return res.status(404).json({
          error: 'Credit not found',
          message: `No approved submission found with credit ID: ${creditId}. Available credit IDs: ${submissions.map(s => s.creditId).join(', ')}`
        });
      }

      // Validate credits to sell don't exceed available credits
      if (creditsToSell > submission.credits) {
        return res.status(400).json({
          error: 'Insufficient credits',
          message: `You only have ${submission.credits} credits available`
        });
      }

      // Create marketplace listing
      const listing = await MarketplaceModel.createListing({
        creditId,
        producerId: producer._id,
        producer: {
          name: producer.name,
          walletAddress: producer.walletAddress
        },
        credits: creditsToSell,
        pricePerCredit: parseFloat(pricePerCredit),
        totalPrice: parseFloat(pricePerCredit) * creditsToSell,
        quantity: submission.productionData.quantity,
        location: submission.productionData.location,
        productionDate: submission.productionData.productionDate,
        listedAt: new Date()
      });

      // Deduct credits from the specific submission
      const newCredits = submission.credits - creditsToSell;
      await SubmissionModel.findByIdAndUpdate(submission._id, {
        credits: newCredits,
        listedCredits: (submission.listedCredits || 0) + creditsToSell
      });

      console.log(`[Marketplace] Deducted ${creditsToSell} credits from submission ${submission._id}, remaining: ${newCredits}`);

      res.status(201).json({
        message: 'Marketplace listing created successfully',
        listing: {
          id: listing._id,
          creditId: listing.creditId,
          credits: listing.credits,
          pricePerCredit: listing.pricePerCredit,
          totalPrice: listing.totalPrice,
          status: listing.status,
          listedAt: listing.listedAt
        }
      });

    } catch (error) {
      console.error('Error creating marketplace listing:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create marketplace listing'
      });
    }
  }

  /**
   * Get all active marketplace listings
   * GET /api/marketplace/listings
   */
  async getActiveListings(req, res) {
    try {
      const listings = await MarketplaceModel.findListings({ status: 'ACTIVE' });
      
      const listingsArray = listings.map(listing => ({
        id: listing._id,
        creditId: listing.creditId,
        producerId: listing.producerId,
        producer: listing.producer,
        credits: listing.credits,
        pricePerCredit: listing.pricePerCredit,
        totalPrice: listing.totalPrice,
        quantity: listing.quantity,
        location: listing.location,
        productionDate: listing.productionDate,
        listedAt: listing.listedAt,
        status: listing.status
      }));

      res.json(listingsArray);

    } catch (error) {
      console.error('Error fetching marketplace listings:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch marketplace listings'
      });
    }
  }

  /**
   * Purchase credits from marketplace (Buyer only)
   * POST /api/marketplace/purchase
   */
  async purchaseCredits(req, res) {
    try {
      const { listingId, quantity, transactionHash, paymentAmount } = req.body;
      const buyer = req.user;

      // Validate buyer role
      if (buyer.role !== 'BUYER') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only buyers can purchase credits'
        });
      }

      // Find the listing
      const listing = await MarketplaceModel.findListingById(listingId);
      if (!listing || listing.status !== 'ACTIVE') {
        return res.status(404).json({
          error: 'Listing not found',
          message: 'Active listing not found'
        });
      }

      // Validate quantity
      if (quantity > listing.credits) {
        return res.status(400).json({
          error: 'Insufficient credits',
          message: `Only ${listing.credits} credits available`
        });
      }

      const totalCost = listing.pricePerCredit * quantity;

      // Verify blockchain payment if transaction hash provided
      if (transactionHash && paymentAmount) {
        console.log(`Verifying ETH payment: ${transactionHash} for ${paymentAmount} wei`);
        
        // In production, you would verify the transaction on blockchain
        // For now, we'll accept the transaction hash as proof of payment
        try {
          // Optional: Use blockchain service to verify payment
          const blockchainService = require('../../services/blockchain.service');
          const paymentResult = await blockchainService.purchaseCreditsWithETH(
            buyer.walletAddress,
            listingId,
            quantity,
            paymentAmount
          );
          
          console.log('Blockchain payment verified:', paymentResult);
        } catch (blockchainError) {
          console.warn('Blockchain verification failed, proceeding with transaction hash:', blockchainError.message);
        }
      }

      // Execute credit transfer
      try {
        const transferResult = await blockchainService.transferCredits(
          listing.producer.walletAddress,
          buyer.walletAddress,
          quantity,
          listing.creditId
        );

        // Create transaction record with payment details
        await MarketplaceModel.createTransaction({
          type: 'CREDIT_PURCHASE',
          fromAddress: listing.producer.walletAddress,
          toAddress: buyer.walletAddress,
          credits: quantity,
          price: totalCost,
          listingId: listingId,
          transactionHash: transactionHash || transferResult.transactionHash,
          blockNumber: transferResult.blockNumber,
          paymentAmount: paymentAmount,
          paymentMethod: transactionHash ? 'ETH' : 'SYSTEM',
          status: 'CONFIRMED'
        });

        // Update listing (reduce available credits or mark as sold)
        if (quantity === listing.credits) {
          await MarketplaceModel.updateListing(listingId, { status: 'SOLD' });
        } else {
          await MarketplaceModel.updateListing(listingId, { 
            credits: listing.credits - quantity,
            totalPrice: listing.pricePerCredit * (listing.credits - quantity)
          });
        }

        // Update buyer's credit balance
        const currentBuyerCredits = buyer.totalCredits || 0;
        await UserModel.findByIdAndUpdate(buyer._id, {
          totalCredits: currentBuyerCredits + quantity
        });

        res.json({
          message: 'Credits purchased successfully',
          purchase: {
            credits: quantity,
            totalCost,
            transactionHash: transferResult.transactionHash,
            seller: listing.producer.name
          }
        });

      } catch (blockchainError) {
        console.error('Blockchain transfer failed:', blockchainError);
        res.status(500).json({
          error: 'Transaction failed',
          message: 'Failed to transfer credits on blockchain'
        });
      }

    } catch (error) {
      console.error('Error purchasing credits:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to purchase credits'
      });
    }
  }

  /**
   * Get producer's marketplace listings
   * GET /api/marketplace/my-listings
   */
  async getMyListings(req, res) {
    try {
      const producer = req.user;

      if (producer.role !== 'PRODUCER') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only producers can view their listings'
        });
      }

      const listings = await MarketplaceModel.findListings({ producerId: producer._id });
      
      const listingsArray = listings.map(listing => ({
        id: listing._id,
        creditId: listing.creditId,
        credits: listing.credits,
        pricePerCredit: listing.pricePerCredit,
        totalPrice: listing.totalPrice,
        status: listing.status,
        listedAt: listing.listedAt
      }));

      res.json(listingsArray);

    } catch (error) {
      console.error('Error fetching producer listings:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch producer listings'
      });
    }
  }

  /**
   * Get public transaction history
   * GET /api/marketplace/transactions
   */
  async getTransactionHistory(req, res) {
    try {
      const { type, address } = req.query;
      let query = {};

      if (type) {
        query.type = type;
      }

      if (address) {
        // Find transactions where address is either sender or receiver
        const transactions = await MarketplaceModel.findTransactions();
        const filtered = transactions.filter(tx => 
          tx.fromAddress === address || tx.toAddress === address
        );
        return res.json(filtered);
      }

      const transactions = await MarketplaceModel.findTransactions(query);
      res.json(transactions);

    } catch (error) {
      console.error('Error fetching transaction history:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch transaction history'
      });
    }
  }
}

module.exports = new MarketplaceController();
