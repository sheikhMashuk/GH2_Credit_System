const { ethers } = require('ethers');
const blockchainConfig = require('../config/blockchain.config');
const IPFSService = require('./ipfs.service');

class BlockchainService {
  constructor() {
    try {
      this.contract = blockchainConfig.getContract();
      this.provider = blockchainConfig.getProvider();
    } catch (error) {
      console.warn('Blockchain service initialized without contract:', error.message);
      this.contract = null;
      this.provider = blockchainConfig.getProvider();
    }
  }

  /**
   * @dev Generate credits for approved hydrogen production
   * @param {object} productionData - Production data including location, date, quantity
   * @returns {Promise<object>} Transaction result with credit ID
   */
  async generateHydrogenCredits(productionData) {
    try {
      if (!this.contract) {
        console.warn('Contract not available, simulating credit generation for development');
        const quantity = parseFloat(productionData.quantity) || 0;
        const credits = parseFloat((quantity / 100).toFixed(2)); // 100 kg = 1 credit, 2 decimal places
        return {
          success: true,
          creditId: Math.floor(Math.random() * 10000).toString(),
          quantity: quantity,
          credits: credits,
          transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
          blockNumber: Math.floor(Math.random() * 1000000)
        };
      }

      // Extract producer address and quantity from production data
      const producerAddress = productionData.producerAddress;
      const quantity = parseFloat(productionData.quantity) || 0;
      
      if (!producerAddress) {
        throw new Error('Producer address is required for credit generation');
      }
      
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      return await this.generateCreditsOnChain(
        producerAddress, 
        quantity, 
        productionData.location || '',
        productionData.productionDate || ''
      );
    } catch (error) {
      console.error('Error in generateHydrogenCredits:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }


  /**
   * Generate credits on blockchain with automatic IPFS update
   * @param {string} producerAddress - Producer's wallet address
   * @param {number} quantity - Quantity in kg
   * @param {string} location - Production location
   * @param {string} productionDate - Production date
   * @param {Object} submissionData - Full submission data for IPFS
   * @returns {Promise<object>} Transaction result with credit ID and IPFS hash
   */
  async generateCreditsOnChain(producerAddress, quantity, location, productionDate, submissionData = null) {
    try {
      // Validate inputs
      if (!blockchainConfig.isValidAddress(producerAddress)) {
        throw new Error('Invalid producer address');
      }

      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      console.log('Generating credits for producer:', producerAddress);
      console.log('Quantity (kg):', quantity);

      // Handle case where contract is not available (development mode)
      if (!this.contract) {
        console.warn('Contract not available, simulating credit generation for development');
        const credits = parseFloat((quantity / 100).toFixed(2)); // 100 kg = 1 credit
        const creditId = Math.floor(Math.random() * 10000).toString();
        
        const result = {
          success: true,
          creditId,
          quantity,
          credits,
          transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
          blockNumber: Math.floor(Math.random() * 1000000)
        };

        // Still update IPFS even in development mode
        if (submissionData) {
          try {
            const ipfsHash = await this.updateIPFSForCredit(producerAddress, creditId, credits, submissionData);
            result.ipfsHash = ipfsHash;
            console.log('IPFS updated for credit:', creditId, 'Hash:', ipfsHash);
          } catch (ipfsError) {
            console.warn('Failed to update IPFS for credit:', ipfsError.message);
          }
        }

        return result;
      }

      // Call smart contract function to generate credits
      const tx = await this.contract.generateCredits(
        producerAddress,
        quantity,
        location,
        productionDate
      );

      console.log('Transaction sent:', tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed in block:', receipt.blockNumber);

      // Extract credit ID from events
      const creditGeneratedEvent = receipt.events?.find(
        event => event.event === 'CreditGenerated'
      );

      if (!creditGeneratedEvent) {
        throw new Error('CreditGenerated event not found in transaction receipt');
      }

      const creditId = creditGeneratedEvent.args.creditId.toString();
      const creditsFromContract = creditGeneratedEvent.args.credits.toString();
      const credits = parseFloat((creditsFromContract / 100).toFixed(2)); // Convert back to proper credit format

      const result = {
        success: true,
        creditId,
        quantity,
        credits,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

      // Automatically update IPFS with new credit data
      if (submissionData) {
        try {
          const ipfsHash = await this.updateIPFSForCredit(producerAddress, creditId, credits, submissionData);
          result.ipfsHash = ipfsHash;
          console.log('IPFS updated for credit:', creditId, 'Hash:', ipfsHash);
        } catch (ipfsError) {
          console.warn('Failed to update IPFS for credit:', ipfsError.message);
          // Don't fail the entire operation if IPFS fails
        }
      }

      return result;

    } catch (error) {
      console.error('Error generating credits:', error);
      throw new Error(`Failed to generate credits: ${error.message}`);
    }
  }

  /**
   * Generate hydrogen credits with IPFS metadata storage
   * @param {string} submissionId - The submission ID
   * @param {Object} submission - The submission data
   * @returns {Promise<Object>} - Transaction result with IPFS hash
   */
  async mintHydrogenCredit(submissionId, submission) {
    if (!this.contract) {
      throw new Error('Blockchain contract not available');
    }

    try {
      console.log('BlockchainService - Generating credit with IPFS for submission:', submissionId);
      
      const quantity = parseFloat(submission.productionData.quantity);
      const credits = Math.floor(quantity * 10); // 1 kg = 10 credits
      
      const creditData = {
        creditId: `CREDIT_${Date.now()}`,
        credits: credits,
        generatedAt: new Date().toISOString(),
        approvedBy: 'regulatory-authority',
        approvedAt: new Date().toISOString()
      };
      
      // Store complete credit metadata to IPFS
      console.log('BlockchainService - Storing metadata to IPFS...');
      const ipfsHash = await IPFSService.storeCreditToIPFS(submission, creditData);
      console.log('BlockchainService - IPFS hash generated:', ipfsHash);
      
      // Get the signer (regulatory authority wallet)
      const signer = blockchainConfig.getSigner();
      const contractWithSigner = this.contract.connect(signer);
      
      // Convert quantity to grams for precision
      const quantityInGrams = Math.floor(quantity * 1000);
      
      console.log('BlockchainService - Generating credits for quantity:', quantity, 'kg');
      console.log('BlockchainService - IPFS hash:', ipfsHash);
      
      // Call the smart contract function with IPFS hash
      const tx = await contractWithSigner.generateCredits(
        submission.producerId, // producer address
        quantityInGrams, // quantity in grams
        ipfsHash // IPFS hash containing complete metadata
      );
      
      console.log('BlockchainService - Transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('BlockchainService - Transaction confirmed:', receipt.transactionHash);
      
      // Extract credit ID from the event
      const creditGeneratedEvent = receipt.events?.find(
        event => event.event === 'CreditGenerated'
      );
      
      if (creditGeneratedEvent) {
        const creditId = creditGeneratedEvent.args.creditId.toString();
        console.log('BlockchainService - Credit ID generated:', creditId);
        
        // Update IPFS metadata with actual credit ID
        const updatedCreditData = {
          ...creditData,
          creditId: creditId
        };
        
        const updatedIpfsHash = await IPFSService.storeCreditToIPFS(submission, updatedCreditData);
        console.log('BlockchainService - Updated IPFS hash:', updatedIpfsHash);
        
        return {
          transactionHash: receipt.transactionHash,
          creditId: creditId,
          credits: credits,
          ipfsHash: updatedIpfsHash,
          metadata: updatedCreditData
        };
      } else {
        throw new Error('Credit generation event not found in transaction receipt');
      }
      
    } catch (error) {
      console.error('BlockchainService - Error generating credit with IPFS:', error);
      throw new Error(`Failed to generate hydrogen credit: ${error.message}`);
    }
  }

  /**
   * Get all approved credits
   * @returns {Promise<Array>} Array of approved credits
   */
  async getApprovedCredits() {
    try {
      console.log('Fetching approved credits from contract...');
      
      if (!this.contract) {
        console.warn('Contract not available, returning empty credits for development');
        return [];
      }
      
      const result = await this.contract.getApprovedCredits();
      const [creditIds, producers, quantities, creditAmounts] = result;

      const credits = [];
      for (let i = 0; i < creditIds.length; i++) {
        const creditId = creditIds[i].toString();
        const producer = producers[i];
        const quantity = quantities[i].toString();
        const creditAmount = creditAmounts[i].toString();

        // Get credit details
        let creditDetails = null;
        try {
          creditDetails = await this.contract.getCredit(creditIds[i]);
        } catch (error) {
          console.warn(`Failed to get details for credit ${creditId}:`, error.message);
        }

        credits.push({
          creditId,
          producer,
          quantity,
          credits: creditAmount,
          location: creditDetails ? creditDetails[3] : '',
          productionDate: creditDetails ? creditDetails[4] : '',
          isApproved: creditDetails ? creditDetails[5] : true
        });
      }

      console.log(`Found ${credits.length} approved credits`);
      return credits;

    } catch (error) {
      console.error('Error fetching approved credits:', error);
      throw new Error(`Failed to fetch credits: ${error.message}`);
    }
  }

  /**
   * Get specific credit details
   * @param {string} creditId - Credit ID to query
   * @returns {Promise<object>} Credit details
   */
  async getCredit(creditId) {
    try {
      const result = await this.contract.getCredit(creditId);
      const [producer, quantity, creditAmount, location, productionDate, isApproved] = result;
      
      return {
        creditId,
        producer,
        quantity: quantity.toString(),
        credits: creditAmount.toString(),
        location,
        productionDate,
        isApproved
      };

    } catch (error) {
      console.error(`Error fetching credit ${creditId}:`, error);
      throw new Error(`Failed to fetch credit: ${error.message}`);
    }
  }

  /**
   * Get total number of generated credits
   * @returns {Promise<number>} Total credits
   */
  async getTotalCredits() {
    try {
      const totalCredits = await this.contract.totalCredits();
      return totalCredits.toNumber();
    } catch (error) {
      console.error('Error fetching total credits:', error);
      throw new Error(`Failed to fetch total credits: ${error.message}`);
    }
  }

  /**
   * Transfer credits between addresses
   * @param {string} fromAddress - Sender's wallet address
   * @param {string} toAddress - Receiver's wallet address
   * @param {number} quantity - Number of credits to transfer
   * @param {string} creditId - Credit ID being transferred
   * @returns {Promise<object>} Transaction result
   */
  async transferCredits(fromAddress, toAddress, quantity, creditId) {
    try {
      if (!this.contract) {
        console.warn('Contract not available, simulating credit transfer for development');
        return {
          success: true,
          transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
          blockNumber: Math.floor(Math.random() * 1000000),
          fromAddress,
          toAddress,
          quantity,
          creditId
        };
      }

      // Validate inputs
      if (!blockchainConfig.isValidAddress(fromAddress)) {
        throw new Error('Invalid sender address');
      }
      
      if (!blockchainConfig.isValidAddress(toAddress)) {
        throw new Error('Invalid receiver address');
      }

      if (quantity <= 0) {
        throw new Error('Transfer quantity must be greater than 0');
      }

      console.log(`Transferring ${quantity} credits from ${fromAddress} to ${toAddress}`);

      // Call smart contract transfer function
      const tx = await this.contract.transferCredits(
        fromAddress,
        toAddress,
        quantity,
        creditId
      );

      console.log('Transfer transaction sent:', tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transfer confirmed in block:', receipt.blockNumber);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        fromAddress,
        toAddress,
        quantity,
        creditId
      };

    } catch (error) {
      console.error('Error transferring credits:', error);
      throw new Error(`Failed to transfer credits: ${error.message}`);
    }
  }

  /**
   * Update IPFS storage for a specific credit
   * @param {string} producerAddress - Producer's wallet address
   * @param {string} creditId - Credit ID
   * @param {number} credits - Credit amount
   * @param {Object} submissionData - Submission data
   * @returns {Promise<string>} IPFS hash
   */
  async updateIPFSForCredit(producerAddress, creditId, credits, submissionData) {
    try {
      const creditData = {
        creditId,
        credits,
        generatedAt: new Date().toISOString(),
        approvedBy: 'regulatory-authority',
        approvedAt: new Date().toISOString()
      };

      const ipfsHash = await IPFSService.storeCreditToIPFS(submissionData, creditData);
      console.log(`IPFS updated for producer ${producerAddress}, credit ${creditId}:`, ipfsHash);
      return ipfsHash;
    } catch (error) {
      console.error('Error updating IPFS for credit:', error);
      throw error;
    }
  }

  /**
   * Update IPFS for all credits of a specific producer
   * @param {string} producerAddress - Producer's wallet address
   * @param {Array} submissions - All submissions for this producer
   * @returns {Promise<Array>} Array of IPFS hashes
   */
  async updateAllCreditsIPFS(producerAddress, submissions) {
    const ipfsHashes = [];
    
    for (const submission of submissions) {
      if (submission.status === 'APPROVED' && submission.creditId) {
        try {
          const ipfsHash = await this.updateIPFSForCredit(
            producerAddress,
            submission.creditId,
            submission.credits,
            submission
          );
          ipfsHashes.push({ creditId: submission.creditId, ipfsHash });
        } catch (error) {
          console.warn(`Failed to update IPFS for credit ${submission.creditId}:`, error.message);
        }
      }
    }
    
    return ipfsHashes;
  }

  /**
   * Update producer credit balance in IPFS when credits change
   * @param {string} producerAddress - Producer's wallet address
   * @param {number} newCreditBalance - Updated credit balance
   * @param {string} changeReason - Reason for credit change
   * @returns {Promise<string>} IPFS hash
   */
  async updateProducerCreditsInIPFS(producerAddress, newCreditBalance, changeReason = 'balance_update') {
    try {
      console.log(`[BlockchainService] Updating producer ${producerAddress} credits in IPFS: ${newCreditBalance}`);
      
      const InMemoryUser = require('../models/InMemoryUser');
      const producer = await InMemoryUser.findByWalletAddress(producerAddress);
      
      if (!producer) {
        throw new Error(`Producer not found: ${producerAddress}`);
      }

      // Create updated producer credit data
      const producerCreditData = {
        version: '1.0',
        type: 'producer-credit-balance',
        producer: {
          address: producerAddress,
          name: producer.name,
          id: producer._id
        },
        credits: {
          currentBalance: newCreditBalance,
          lastUpdated: new Date().toISOString(),
          updateReason: changeReason
        },
        metadata: {
          updatedAt: new Date().toISOString(),
          standard: 'GH2-Producer-Balance-v1.0',
          network: process.env.BLOCKCHAIN_NETWORK || 'development'
        }
      };

      // Upload to IPFS
      const ipfsHash = await IPFSService.pinJSONToIPFS(
        producerCreditData, 
        `producer-balance-${producerAddress}-${Date.now()}`
      );

      console.log(`[BlockchainService] ✓ Producer balance updated in IPFS: ${ipfsHash}`);
      return ipfsHash;

    } catch (error) {
      console.error('[BlockchainService] Error updating producer credits in IPFS:', error);
      throw error;
    }
  }

  /**
   * Real-time sync of all credit changes to IPFS
   * @param {string} creditId - Credit ID that changed
   * @param {string} producerAddress - Producer address
   * @param {Object} changeDetails - Details of the change
   * @returns {Promise<string>} IPFS hash
   */
  async syncCreditChangeToIPFS(creditId, producerAddress, changeDetails) {
    try {
      console.log(`[BlockchainService] Real-time IPFS sync for credit ${creditId}`);
      
      const CreditLifecycleService = require('./credit-lifecycle.service');
      
      // Determine the type of change and handle accordingly
      switch (changeDetails.type) {
        case 'balance_update':
          return await this.updateProducerCreditsInIPFS(
            producerAddress, 
            changeDetails.newBalance, 
            'real_time_balance_update'
          );
          
        case 'transfer':
          return await CreditLifecycleService.handleCreditTransfer(
            creditId,
            changeDetails.fromAddress,
            changeDetails.toAddress,
            changeDetails.amount,
            changeDetails.transferType || 'transfer'
          );
          
        case 'status_change':
          return await CreditLifecycleService.handleCreditStatusChange(
            creditId,
            changeDetails.newStatus,
            changeDetails.reason || 'Real-time status update'
          );
          
        default:
          console.warn(`[BlockchainService] Unknown change type: ${changeDetails.type}`);
          return null;
      }
      
    } catch (error) {
      console.error('[BlockchainService] Error in real-time IPFS sync:', error);
      throw error;
    }
  }

  /**
   * Listen for blockchain events and auto-sync to IPFS
   * @returns {Promise<void>}
   */
  async startBlockchainEventListener() {
    if (!this.contract) {
      console.warn('[BlockchainService] Contract not available - event listening disabled');
      return;
    }

    try {
      console.log('[BlockchainService] Starting blockchain event listener for IPFS sync...');
      
      // Listen for CreditGenerated events
      this.contract.on('CreditGenerated', async (creditId, producer, credits, event) => {
        console.log(`[BlockchainService] CreditGenerated event: ${creditId} for ${producer}`);
        
        try {
          await this.syncCreditChangeToIPFS(creditId.toString(), producer, {
            type: 'balance_update',
            newBalance: credits.toString(),
            reason: 'credit_generated'
          });
        } catch (error) {
          console.error('[BlockchainService] Error syncing CreditGenerated to IPFS:', error);
        }
      });

      // Listen for CreditTransferred events
      this.contract.on('CreditTransferred', async (creditId, from, to, amount, event) => {
        console.log(`[BlockchainService] CreditTransferred event: ${creditId} from ${from} to ${to}`);
        
        try {
          await this.syncCreditChangeToIPFS(creditId.toString(), from, {
            type: 'transfer',
            fromAddress: from,
            toAddress: to,
            amount: amount.toString(),
            transferType: 'blockchain_transfer'
          });
        } catch (error) {
          console.error('[BlockchainService] Error syncing CreditTransferred to IPFS:', error);
        }
      });

      console.log('[BlockchainService] ✓ Blockchain event listeners started for real-time IPFS sync');
      
    } catch (error) {
      console.error('[BlockchainService] Error starting blockchain event listener:', error);
    }
  }

  /**
   * Check blockchain connection status
   * @returns {Promise<object>} Connection status
   */
  async getConnectionStatus() {
    return await blockchainConfig.checkConnection();
  }
}

module.exports = new BlockchainService();
