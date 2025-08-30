const { ethers } = require('ethers');
const blockchainConfig = require('../config/blockchain.config');

class BlockchainService {
  constructor() {
    this.contract = blockchainConfig.getContract();
    this.provider = blockchainConfig.getProvider();
  }

  /**
   * Mint NFT and list it on marketplace
   * @param {string} producerAddress - Producer's wallet address
   * @param {number} priceInMatic - Price in MATIC
   * @param {object} metadata - NFT metadata
   * @returns {Promise<object>} Transaction result with token ID
   */
  async mintAndListCredit(producerAddress, priceInMatic, metadata) {
    try {
      // Validate inputs
      if (!blockchainConfig.isValidAddress(producerAddress)) {
        throw new Error('Invalid producer address');
      }

      if (priceInMatic <= 0) {
        throw new Error('Price must be greater than 0');
      }

      // Create metadata URI (in production, upload to IPFS)
      const tokenURI = this.createMetadataURI(metadata);
      
      // Convert price to wei
      const priceInWei = blockchainConfig.priceToWei(priceInMatic);

      console.log('Minting NFT for producer:', producerAddress);
      console.log('Price in MATIC:', priceInMatic);
      console.log('Price in Wei:', priceInWei.toString());

      // Call smart contract function
      const tx = await this.contract.verifyAndMintToListing(
        producerAddress,
        priceInWei,
        tokenURI
      );

      console.log('Transaction sent:', tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed in block:', receipt.blockNumber);

      // Extract token ID from events
      const creditListedEvent = receipt.events?.find(
        event => event.event === 'CreditListed'
      );

      if (!creditListedEvent) {
        throw new Error('CreditListed event not found in transaction receipt');
      }

      const tokenId = creditListedEvent.args.tokenId.toString();

      return {
        success: true,
        tokenId,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('Error minting and listing credit:', error);
      throw new Error(`Failed to mint credit: ${error.message}`);
    }
  }

  /**
   * Get all active marketplace listings
   * @returns {Promise<Array>} Array of active listings
   */
  async getActiveListings() {
    try {
      console.log('Fetching active listings from contract...');
      
      const result = await this.contract.getActiveListings();
      const [tokenIds, producers, prices] = result;

      const listings = [];
      for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = tokenIds[i].toString();
        const producer = producers[i];
        const priceInWei = prices[i];
        const priceInMatic = blockchainConfig.weiToMatic(priceInWei);

        // Get token metadata
        let tokenURI = '';
        try {
          tokenURI = await this.contract.tokenURI(tokenIds[i]);
        } catch (error) {
          console.warn(`Failed to get tokenURI for token ${tokenId}:`, error.message);
        }

        listings.push({
          tokenId,
          producer,
          price: priceInMatic,
          priceInWei: priceInWei.toString(),
          tokenURI,
          metadata: this.parseMetadataURI(tokenURI)
        });
      }

      console.log(`Found ${listings.length} active listings`);
      return listings;

    } catch (error) {
      console.error('Error fetching active listings:', error);
      throw new Error(`Failed to fetch listings: ${error.message}`);
    }
  }

  /**
   * Get specific listing details
   * @param {string} tokenId - Token ID to query
   * @returns {Promise<object>} Listing details
   */
  async getListing(tokenId) {
    try {
      const result = await this.contract.getListing(tokenId);
      const [producer, priceInWei, isActive] = result;

      const tokenURI = await this.contract.tokenURI(tokenId);
      
      return {
        tokenId,
        producer,
        price: blockchainConfig.weiToMatic(priceInWei),
        priceInWei: priceInWei.toString(),
        isActive,
        tokenURI,
        metadata: this.parseMetadataURI(tokenURI)
      };

    } catch (error) {
      console.error(`Error fetching listing for token ${tokenId}:`, error);
      throw new Error(`Failed to fetch listing: ${error.message}`);
    }
  }

  /**
   * Get total supply of minted tokens
   * @returns {Promise<number>} Total supply
   */
  async getTotalSupply() {
    try {
      const totalSupply = await this.contract.totalSupply();
      return totalSupply.toNumber();
    } catch (error) {
      console.error('Error fetching total supply:', error);
      throw new Error(`Failed to fetch total supply: ${error.message}`);
    }
  }

  /**
   * Create metadata URI (simplified version - in production use IPFS)
   * @param {object} metadata - Metadata object
   * @returns {string} Metadata URI
   */
  createMetadataURI(metadata) {
    // In production, this should upload to IPFS and return the IPFS hash
    // For now, we'll create a simple JSON string
    const metadataJson = {
      name: `Green Hydrogen Credit #${Date.now()}`,
      description: 'Verified Green Hydrogen Production Credit',
      image: 'https://example.com/hydrogen-credit-image.png', // Placeholder
      attributes: [
        {
          trait_type: 'Production Date',
          value: metadata.productionDate || new Date().toISOString().split('T')[0]
        },
        {
          trait_type: 'Quantity (kg)',
          value: metadata.quantity || 'N/A'
        },
        {
          trait_type: 'Location',
          value: metadata.location || 'N/A'
        },
        {
          trait_type: 'Verification Date',
          value: new Date().toISOString().split('T')[0]
        }
      ]
    };

    // In production: return IPFS hash
    // For demo: return base64 encoded JSON
    return `data:application/json;base64,${Buffer.from(JSON.stringify(metadataJson)).toString('base64')}`;
  }

  /**
   * Parse metadata URI to extract metadata
   * @param {string} tokenURI - Token URI
   * @returns {object} Parsed metadata
   */
  parseMetadataURI(tokenURI) {
    try {
      if (tokenURI.startsWith('data:application/json;base64,')) {
        const base64Data = tokenURI.replace('data:application/json;base64,', '');
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
        return JSON.parse(jsonString);
      }
      
      // If it's an IPFS or HTTP URL, return URL (frontend can fetch)
      return { uri: tokenURI };
    } catch (error) {
      console.warn('Failed to parse metadata URI:', error.message);
      return { uri: tokenURI };
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
