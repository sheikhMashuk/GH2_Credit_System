const IPFSService = require('./ipfs.service');
const InMemoryUser = require('../models/InMemoryUser');
const InMemorySubmission = require('../models/InMemorySubmission');

/**
 * Service to handle complete credit lifecycle with IPFS updates
 */
class CreditLifecycleService {
  
  /**
   * Handle credit approval - upload to IPFS and update storage
   * @param {Object} submission - Submission data
   * @param {Object} creditResult - Credit generation result
   * @returns {Promise<Object>} IPFS upload result
   */
  async handleCreditApproval(submission, creditResult) {
    try {
      console.log(`[CreditLifecycle] Processing approval for credit ${creditResult.creditId}`);
      
      // Get producer info
      const producer = await InMemoryUser.findById(submission.producerId);
      if (!producer) {
        throw new Error('Producer not found');
      }
      
      // Create submission data for IPFS
      const submissionForIPFS = {
        ...submission,
        producerId: producer.walletAddress,
        producerName: producer.name,
        id: submission._id
      };
      
      // Create credit data
      const creditData = {
        creditId: creditResult.creditId,
        credits: creditResult.credits,
        generatedAt: new Date().toISOString(),
        approvedBy: 'regulatory-authority',
        approvedAt: new Date().toISOString()
      };
      
      // Upload to IPFS
      const ipfsHash = await IPFSService.storeCreditToIPFS(submissionForIPFS, creditData);
      
      console.log(`[CreditLifecycle] ✓ Credit ${creditResult.creditId} uploaded to IPFS: ${ipfsHash}`);
      
      return {
        success: true,
        creditId: creditResult.creditId,
        ipfsHash,
        producer: producer.walletAddress,
        credits: creditResult.credits
      };
      
    } catch (error) {
      console.error(`[CreditLifecycle] Error handling credit approval:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Handle credit transfer/sale - update IPFS with new ownership
   * @param {string} creditId - Credit ID
   * @param {string} fromAddress - Current owner address
   * @param {string} toAddress - New owner address
   * @param {number} amount - Amount transferred
   * @param {string} transferType - Type of transfer (sale, gift, etc.)
   * @returns {Promise<Object>} Update result
   */
  async handleCreditTransfer(creditId, fromAddress, toAddress, amount, transferType = 'sale') {
    try {
      console.log(`[CreditLifecycle] Processing ${transferType} for credit ${creditId} - BURNING ${amount} credits`);
      console.log(`[CreditLifecycle] From: ${fromAddress} To: ${toAddress} Amount: ${amount}`);
      
      // Get current credit data from database
      const submission = await InMemorySubmission.findOne({ creditId });
      if (!submission) {
        throw new Error(`Submission with credit ID ${creditId} not found`);
      }
      
      // Get producer and buyer info
      const fromProducer = await InMemoryUser.findByWalletAddress(fromAddress);
      const toBuyer = await InMemoryUser.findByWalletAddress(toAddress);
      
      // Create burned credit data for IPFS storage
      const burnedCreditData = {
        version: '1.0',
        type: 'green-hydrogen-credit-burned',
        creditId: creditId,
        originalProducer: {
          address: fromAddress,
          name: fromProducer?.name || 'Unknown Producer'
        },
        buyer: {
          address: toAddress,
          name: toBuyer?.name || 'Unknown Buyer'
        },
        production: submission.productionData,
        burnDetails: {
          originalCredits: submission.credits,
          creditsBurned: amount,
          burnedAt: new Date().toISOString(),
          burnReason: 'Credit purchase and consumption',
          burnType: transferType,
          purchasePrice: amount * 0.001, // Fixed price per credit in ETH
          purchasePriceUSD: amount * 0.001 * 2000 // Assuming $2000/ETH
        },
        verification: {
          submissionId: submission._id,
          originalStatus: submission.status,
          burnStatus: 'BURNED_AND_CONSUMED',
          burnedBy: toAddress,
          burnTransaction: new Date().toISOString()
        },
        metadata: {
          createdAt: submission.createdAt,
          burnedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          standard: 'GH2-Credit-Burn-v1.0',
          network: 'development',
          immutable: true,
          purpose: 'Carbon credit retirement and consumption tracking'
        }
      };
      
      // Store burned credit data to IPFS
      const ipfsHash = await IPFSService.updateCreditInIPFS(burnedCreditData, `burn_${transferType}`);
      
      if (ipfsHash) {
        console.log(`[CreditLifecycle] ✓ Credit ${creditId} BURNED and stored in IPFS: ${ipfsHash}`);
        console.log(`[CreditLifecycle] ✓ ${amount} credits permanently retired for buyer ${toAddress}`);
      } else {
        console.warn(`[CreditLifecycle] ⚠ Credit ${creditId} burned but IPFS storage failed`);
      }
      
      return {
        success: true,
        creditId,
        ipfsHash,
        transferType: 'burn_' + transferType,
        from: fromAddress,
        to: toAddress,
        amount,
        burned: true,
        burnedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`[CreditLifecycle] Error handling credit transfer:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Handle credit status change - update IPFS
   * @param {string} creditId - Credit ID
   * @param {string} newStatus - New status (active, retired, cancelled, etc.)
   * @param {string} reason - Reason for status change
   * @returns {Promise<Object>} Update result
   */
  async handleCreditStatusChange(creditId, newStatus, reason = '') {
    try {
      console.log(`[CreditLifecycle] Changing status for credit ${creditId} to ${newStatus}`);
      
      // Get current credit data
      const submission = await InMemorySubmission.findOne({ creditId });
      if (!submission) {
        throw new Error(`Submission with credit ID ${creditId} not found`);
      }
      
      const producer = await InMemoryUser.findById(submission.producerId);
      
      // Create updated credit data
      const updatedCreditData = {
        version: '1.0',
        type: 'green-hydrogen-credit',
        creditId: creditId,
        producer: {
          address: producer?.walletAddress || 'unknown',
          name: producer?.name || 'Unknown Producer'
        },
        production: submission.productionData,
        credits: {
          amount: submission.credits,
          generatedAt: submission.verifiedAt,
          approvedBy: 'regulatory-authority',
          approvedAt: submission.verifiedAt,
          status: newStatus,
          statusChangeReason: reason,
          ownership: {
            currentOwner: producer?.walletAddress || 'unknown',
            transferHistory: []
          }
        },
        verification: {
          submissionId: submission._id,
          status: submission.status
        },
        metadata: {
          createdAt: submission.createdAt,
          lastUpdated: new Date().toISOString(),
          standard: 'GH2-Credit-v1.0',
          network: 'development'
        }
      };
      
      // Update IPFS
      const ipfsHash = await IPFSService.updateCreditInIPFS(updatedCreditData, `status_${newStatus}`);
      
      console.log(`[CreditLifecycle] ✓ Credit ${creditId} status updated in IPFS: ${ipfsHash}`);
      
      return {
        success: true,
        creditId,
        ipfsHash,
        newStatus,
        reason
      };
      
    } catch (error) {
      console.error(`[CreditLifecycle] Error handling status change:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Sync all credits for a producer to IPFS
   * @param {string} producerAddress - Producer wallet address
   * @returns {Promise<Object>} Sync result
   */
  async syncProducerCredits(producerAddress) {
    try {
      console.log(`[CreditLifecycle] Syncing all credits for producer: ${producerAddress}`);
      
      const producer = await InMemoryUser.findByWalletAddress(producerAddress);
      if (!producer) {
        throw new Error('Producer not found');
      }
      
      const submissions = await InMemorySubmission.find({ 
        producerId: producer._id, 
        status: 'APPROVED' 
      });
      
      const syncResults = [];
      
      for (const submission of submissions) {
        if (submission.creditId) {
          try {
            const creditData = {
              creditId: submission.creditId,
              credits: submission.credits,
              generatedAt: submission.verifiedAt,
              approvedBy: 'regulatory-authority',
              approvedAt: submission.verifiedAt
            };
            
            const submissionForIPFS = {
              ...submission,
              producerId: producer.walletAddress,
              producerName: producer.name,
              id: submission._id
            };
            
            const ipfsHash = await IPFSService.storeCreditToIPFS(submissionForIPFS, creditData);
            
            syncResults.push({
              creditId: submission.creditId,
              ipfsHash,
              success: true
            });
            
          } catch (error) {
            syncResults.push({
              creditId: submission.creditId,
              error: error.message,
              success: false
            });
          }
        }
      }
      
      const successful = syncResults.filter(r => r.success).length;
      const failed = syncResults.filter(r => !r.success).length;
      
      console.log(`[CreditLifecycle] Sync complete: ${successful} successful, ${failed} failed`);
      
      return {
        success: true,
        producer: producerAddress,
        totalCredits: submissions.length,
        successful,
        failed,
        results: syncResults
      };
      
    } catch (error) {
      console.error(`[CreditLifecycle] Error syncing producer credits:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CreditLifecycleService();
