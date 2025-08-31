const blockchainService = require('./blockchain.service');
const IPFSService = require('./ipfs.service');
const InMemoryUser = require('../models/InMemoryUser');
const InMemorySubmission = require('../models/InMemorySubmission');

/**
 * Service to handle automatic IPFS synchronization for credit updates
 */
class CreditSyncService {
  
  /**
   * Sync IPFS for a specific producer whenever their credits change
   * @param {string} producerAddress - Producer's wallet address
   * @param {string} triggeredBy - What triggered the sync (approval, transfer, etc.)
   * @returns {Promise<Object>} Sync result
   */
  async syncProducerCreditsToIPFS(producerAddress, triggeredBy = 'credit_update') {
    try {
      console.log(`[CreditSync] Starting IPFS sync for producer: ${producerAddress}`);
      console.log(`[CreditSync] Triggered by: ${triggeredBy}`);
      
      // Find producer by wallet address
      const producer = await InMemoryUser.findByWalletAddress(producerAddress);
      if (!producer) {
        throw new Error(`Producer not found for address: ${producerAddress}`);
      }
      
      // Get all approved submissions for this producer
      const approvedSubmissions = await InMemorySubmission.find({ 
        producerId: producer._id, 
        status: 'APPROVED' 
      });
      
      console.log(`[CreditSync] Found ${approvedSubmissions.length} approved submissions for ${producer.name}`);
      
      if (approvedSubmissions.length === 0) {
        console.log(`[CreditSync] No approved submissions to sync for ${producerAddress}`);
        return { success: true, synced: 0, message: 'No credits to sync' };
      }
      
      // Update IPFS for each approved credit
      const syncResults = [];
      let totalCredits = 0;
      
      for (const submission of approvedSubmissions) {
        if (submission.creditId && submission.credits) {
          try {
            // Create enhanced submission data for IPFS
            const submissionForIPFS = {
              ...submission,
              producerId: producer.walletAddress,
              producerName: producer.name,
              id: submission._id
            };
            
            const creditData = {
              creditId: submission.creditId,
              credits: submission.credits,
              generatedAt: submission.verifiedAt || submission.updatedAt,
              approvedBy: 'regulatory-authority',
              approvedAt: submission.verifiedAt || submission.updatedAt,
              syncedAt: new Date().toISOString(),
              triggeredBy
            };
            
            const ipfsHash = await IPFSService.storeCreditToIPFS(submissionForIPFS, creditData);
            
            syncResults.push({
              creditId: submission.creditId,
              credits: submission.credits,
              ipfsHash,
              success: true
            });
            
            totalCredits += submission.credits;
            
            console.log(`[CreditSync] ✓ Credit ${submission.creditId} synced to IPFS: ${ipfsHash}`);
            
          } catch (error) {
            console.error(`[CreditSync] ✗ Failed to sync credit ${submission.creditId}:`, error.message);
            syncResults.push({
              creditId: submission.creditId,
              credits: submission.credits,
              error: error.message,
              success: false
            });
          }
        }
      }
      
      const successfulSyncs = syncResults.filter(r => r.success).length;
      const failedSyncs = syncResults.filter(r => !r.success).length;
      
      console.log(`[CreditSync] Sync complete for ${producerAddress}:`);
      console.log(`[CreditSync] ✓ ${successfulSyncs} credits synced successfully`);
      console.log(`[CreditSync] ✗ ${failedSyncs} credits failed to sync`);
      console.log(`[CreditSync] Total credits: ${totalCredits}`);
      
      return {
        success: true,
        producer: {
          address: producerAddress,
          name: producer.name,
          totalCredits: producer.totalCredits
        },
        synced: successfulSyncs,
        failed: failedSyncs,
        totalCredits,
        results: syncResults,
        triggeredBy
      };
      
    } catch (error) {
      console.error(`[CreditSync] Error syncing credits for ${producerAddress}:`, error);
      return {
        success: false,
        error: error.message,
        producer: { address: producerAddress },
        triggeredBy
      };
    }
  }
  
  /**
   * Sync IPFS for all producers in the system
   * @returns {Promise<Object>} Bulk sync result
   */
  async syncAllProducersToIPFS() {
    try {
      console.log('[CreditSync] Starting bulk IPFS sync for all producers');
      
      const allProducers = await InMemoryUser.find({ role: 'PRODUCER' });
      console.log(`[CreditSync] Found ${allProducers.length} producers to sync`);
      
      const bulkResults = [];
      
      for (const producer of allProducers) {
        if (producer.walletAddress) {
          const syncResult = await this.syncProducerCreditsToIPFS(
            producer.walletAddress, 
            'bulk_sync'
          );
          bulkResults.push(syncResult);
        }
      }
      
      const successful = bulkResults.filter(r => r.success).length;
      const failed = bulkResults.filter(r => !r.success).length;
      
      console.log(`[CreditSync] Bulk sync complete: ${successful} successful, ${failed} failed`);
      
      return {
        success: true,
        totalProducers: allProducers.length,
        successful,
        failed,
        results: bulkResults
      };
      
    } catch (error) {
      console.error('[CreditSync] Error in bulk sync:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CreditSyncService();
