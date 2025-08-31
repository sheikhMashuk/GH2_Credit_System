const IPFSService = require('../../services/ipfs.service');
const blockchainService = require('../../services/blockchain.service');
const InMemoryUser = require('../../models/InMemoryUser');
const InMemorySubmission = require('../../models/InMemorySubmission');

class CreditsController {
  /**
   * Get all credits data for internal use
   */
  async getAllCreditsData() {
    try {
      const ipfsCredits = await IPFSService.getAllCreditsFromIPFS();
      return ipfsCredits || [];
    } catch (error) {
      console.error('Error fetching credits data:', error);
      return [];
    }
  }
  /**
   * Get all credits from IPFS
   * GET /api/credits
   */
  async getAllCredits(req, res) {
    try {
      console.log('[CreditsController] Fetching all credits from IPFS...');
      
      // Get credit list from IPFS
      const ipfsCredits = await IPFSService.getAllCreditsFromIPFS();
      
      // Enhance with detailed data by fetching each credit
      const detailedCredits = await Promise.all(
        ipfsCredits.map(async (credit) => {
          try {
            const creditData = await IPFSService.getCreditFromIPFS(credit.ipfsHash);
            return {
              ...credit,
              creditData,
              source: 'ipfs'
            };
          } catch (error) {
            console.warn(`Failed to fetch credit data for ${credit.ipfsHash}:`, error.message);
            return {
              ...credit,
              creditData: null,
              source: 'ipfs',
              error: 'Failed to fetch detailed data'
            };
          }
        })
      );

      console.log(`[CreditsController] ✓ Retrieved ${detailedCredits.length} credits from IPFS`);

      res.json({
        message: 'Credits retrieved successfully from IPFS',
        credits: detailedCredits,
        total: detailedCredits.length,
        source: 'pinata-ipfs'
      });

    } catch (error) {
      console.error('[CreditsController] Error fetching credits:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch credits from IPFS'
      });
    }
  }

  /**
   * Get credits for a specific producer from IPFS
   * GET /api/credits/producer/:address
   */
  async getProducerCredits(req, res) {
    try {
      const { address } = req.params;
      console.log(`[CreditsController] Fetching credits for producer: ${address}`);

      // Get producer info
      const producer = await InMemoryUser.findByWalletAddress(address);
      if (!producer) {
        return res.status(404).json({
          error: 'Producer not found',
          message: 'No producer found with this wallet address'
        });
      }

      // Search credits by producer in IPFS
      const ipfsCredits = await IPFSService.searchCreditsByProducer(address);
      
      // Get detailed credit data
      const detailedCredits = await Promise.all(
        ipfsCredits.map(async (credit) => {
          try {
            const creditData = await IPFSService.getCreditFromIPFS(credit.ipfsHash);
            return {
              ...credit,
              creditData,
              source: 'ipfs'
            };
          } catch (error) {
            console.warn(`Failed to fetch credit data for ${credit.ipfsHash}:`, error.message);
            return {
              ...credit,
              creditData: null,
              source: 'ipfs',
              error: 'Failed to fetch detailed data'
            };
          }
        })
      );

      console.log(`[CreditsController] ✓ Found ${detailedCredits.length} credits for producer`);

      res.json({
        message: 'Producer credits retrieved successfully',
        producer: {
          address: producer.walletAddress,
          name: producer.name,
          totalCredits: producer.totalCredits || 0
        },
        credits: detailedCredits,
        total: detailedCredits.length,
        source: 'pinata-ipfs'
      });

    } catch (error) {
      console.error('[CreditsController] Error fetching producer credits:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch producer credits'
      });
    }
  }

  /**
   * Get specific credit by IPFS hash
   * GET /api/credits/ipfs/:hash
   */
  async getCreditByHash(req, res) {
    try {
      const { hash } = req.params;
      console.log(`[CreditsController] Fetching credit by IPFS hash: ${hash}`);

      const creditData = await IPFSService.getCreditFromIPFS(hash);

      console.log(`[CreditsController] ✓ Retrieved credit data from IPFS`);

      res.json({
        message: 'Credit retrieved successfully',
        ipfsHash: hash,
        creditData,
        source: 'pinata-ipfs',
        viewUrl: `https://gateway.pinata.cloud/ipfs/${hash}`
      });

    } catch (error) {
      console.error('[CreditsController] Error fetching credit by hash:', error);
      res.status(404).json({
        error: 'Credit not found',
        message: 'Failed to retrieve credit from IPFS',
        hash: req.params.hash
      });
    }
  }

  /**
   * Get credit with blockchain verification
   * GET /api/credits/:creditId/verified
   */
  async getVerifiedCredit(req, res) {
    try {
      const { creditId } = req.params;
      console.log(`[CreditsController] Getting verified credit: ${creditId}`);

      // Get credit from blockchain
      let blockchainCredit = null;
      try {
        blockchainCredit = await blockchainService.getCredit(creditId);
      } catch (error) {
        console.warn('Blockchain credit not available:', error.message);
      }

      // Find submission with this credit ID
      const submission = await InMemorySubmission.findOne({ creditId });
      if (!submission) {
        return res.status(404).json({
          error: 'Credit not found',
          message: 'No submission found with this credit ID'
        });
      }

      // Get producer info
      const producer = await InMemoryUser.findById(submission.producerId);

      // Search for IPFS data
      const ipfsCredits = await IPFSService.searchCreditsByProducer(producer?.walletAddress || '');
      const ipfsCredit = ipfsCredits.find(credit => credit.creditId === creditId);

      let ipfsData = null;
      if (ipfsCredit) {
        try {
          ipfsData = await IPFSService.getCreditFromIPFS(ipfsCredit.ipfsHash);
        } catch (error) {
          console.warn('Failed to fetch IPFS data:', error.message);
        }
      }

      res.json({
        message: 'Verified credit retrieved successfully',
        creditId,
        blockchain: blockchainCredit,
        ipfs: ipfsData,
        submission: {
          id: submission._id,
          status: submission.status,
          credits: submission.credits,
          productionData: submission.productionData,
          verifiedAt: submission.verifiedAt
        },
        producer: producer ? {
          name: producer.name,
          walletAddress: producer.walletAddress
        } : null,
        verification: {
          blockchainVerified: !!blockchainCredit,
          ipfsVerified: !!ipfsData,
          submissionVerified: !!submission
        }
      });

    } catch (error) {
      console.error('[CreditsController] Error getting verified credit:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve verified credit'
      });
    }
  }

  /**
   * Sync credit to IPFS manually
   * POST /api/credits/:creditId/sync
   */
  async syncCreditToIPFS(req, res) {
    try {
      const { creditId } = req.params;
      console.log(`[CreditsController] Manual IPFS sync for credit: ${creditId}`);

      // Find submission
      const submission = await InMemorySubmission.findOne({ creditId });
      if (!submission) {
        return res.status(404).json({
          error: 'Credit not found',
          message: 'No submission found with this credit ID'
        });
      }

      // Get producer
      const producer = await InMemoryUser.findById(submission.producerId);
      if (!producer) {
        return res.status(404).json({
          error: 'Producer not found',
          message: 'Producer not found for this credit'
        });
      }

      // Sync to IPFS
      const ipfsHash = await blockchainService.updateProducerCreditsInIPFS(
        producer.walletAddress,
        producer.totalCredits || 0,
        'manual_sync'
      );

      console.log(`[CreditsController] ✓ Credit synced to IPFS: ${ipfsHash}`);

      res.json({
        message: 'Credit synced to IPFS successfully',
        creditId,
        ipfsHash,
        viewUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        producer: producer.walletAddress
      });

    } catch (error) {
      console.error('[CreditsController] Error syncing credit to IPFS:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to sync credit to IPFS'
      });
    }
  }
}

module.exports = new CreditsController();
