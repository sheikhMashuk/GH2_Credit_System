const axios = require('axios');
const FormData = require('form-data');

class IPFSService {
  constructor() {
    // Load environment variables from root directory
    require('dotenv').config({ path: '../.env' });
    
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY;
    this.pinataBaseUrl = 'https://api.pinata.cloud';
    
    console.log(`[IPFS] Environment loaded from: ${process.cwd()}`);
    console.log(`[IPFS] Pinata API Key: ${this.pinataApiKey ? 'Found (' + this.pinataApiKey.substring(0, 8) + '...)' : 'Missing'}`);
    console.log(`[IPFS] Pinata Secret Key: ${this.pinataSecretKey ? 'Found (' + this.pinataSecretKey.substring(0, 8) + '...)' : 'Missing'}`);
    
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      console.warn('[IPFS] PINATA_API_KEY or PINATA_SECRET_KEY not found. IPFS features will be disabled.');
    }
  }

  /**
   * Pin JSON data to IPFS via Pinata
   * @param {Object} jsonData - The JSON data to pin
   * @param {string} name - Name for the pinned content
   * @returns {Promise<string>} - IPFS hash
   */
  async pinJSONToIPFS(jsonData, name) {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      console.warn('[IPFS] Pinata credentials not configured - skipping IPFS upload');
      return null;
    }

    try {
      console.log(`[IPFS] Uploading ${name} to Pinata...`);
      console.log(`[IPFS] Data preview:`, JSON.stringify(jsonData, null, 2).substring(0, 200) + '...');
      
      const payload = {
        pinataContent: jsonData,
        pinataMetadata: {
          name: name,
          keyvalues: {
            type: 'hydrogen-credit',
            timestamp: new Date().toISOString(),
            producer: jsonData.producer?.address || 'unknown',
            creditId: jsonData.creditId || 'unknown'
          }
        }
      };
      
      console.log(`[IPFS] Payload size: ${JSON.stringify(payload).length} bytes`);
      
      const response = await axios.post(
        `${this.pinataBaseUrl}/pinning/pinJSONToIPFS`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log(`[IPFS] ✓ Successfully pinned to IPFS: ${response.data.IpfsHash}`);
      console.log(`[IPFS] View at: https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } catch (error) {
      console.error('[IPFS] ✗ Error pinning to IPFS:', error.response?.data || error.message);
      console.error('[IPFS] Status:', error.response?.status);
      console.error('[IPFS] Request URL:', `${this.pinataBaseUrl}/pinning/pinJSONToIPFS`);
      console.error('[IPFS] API Key (first 8 chars):', this.pinataApiKey?.substring(0, 8));
      if (error.response?.data) {
        console.error('[IPFS] Full error response:', JSON.stringify(error.response.data, null, 2));
      }
      // Return null instead of throwing to prevent breaking the flow
      return null;
    }
  }

  /**
   * Pin file to IPFS via Pinata
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Name of the file
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<string>} - IPFS hash
   */
  async pinFileToIPFS(fileBuffer, fileName, mimeType) {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      throw new Error('Pinata credentials not configured');
    }

    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: mimeType
      });

      const metadata = JSON.stringify({
        name: fileName,
        keyvalues: {
          type: 'hydrogen-credit-document',
          timestamp: new Date().toISOString()
        }
      });
      formData.append('pinataMetadata', metadata);

      const response = await axios.post(
        `${this.pinataBaseUrl}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          }
        }
      );

      console.log('Successfully pinned file to IPFS:', response.data.IpfsHash);
      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error pinning file to IPFS:', error.response?.data || error.message);
      throw new Error('Failed to pin file to IPFS');
    }
  }

  /**
   * Retrieve data from IPFS
   * @param {string} ipfsHash - IPFS hash
   * @returns {Promise<Object>} - Retrieved data
   */
  async getFromIPFS(ipfsHash) {
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      return response.data;
    } catch (error) {
      console.error('Error retrieving from IPFS:', error.message);
      throw new Error('Failed to retrieve data from IPFS');
    }
  }

  /**
   * Create credit metadata for IPFS storage
   * @param {Object} submission - Submission data
   * @param {Object} creditData - Credit data from blockchain
   * @returns {Object} - Formatted metadata
   */
  createCreditMetadata(submission, creditData) {
    return {
      version: '1.0',
      type: 'green-hydrogen-credit',
      creditId: creditData.creditId,
      producer: {
        address: submission.producerId,
        name: submission.producerName || 'Unknown Producer'
      },
      production: {
        date: submission.productionData.productionDate,
        quantity: submission.productionData.quantity,
        location: submission.productionData.location,
        method: submission.productionData.method || 'Electrolysis',
        additionalNotes: submission.productionData.additionalNotes
      },
      credits: {
        amount: creditData.credits,
        generatedAt: creditData.generatedAt,
        approvedBy: creditData.approvedBy,
        approvedAt: creditData.approvedAt,
        status: 'active',
        ownership: {
          currentOwner: submission.producerId,
          transferHistory: []
        }
      },
      verification: {
        submissionId: submission.id || submission._id,
        status: submission.status,
        verificationHash: this.generateVerificationHash(submission, creditData)
      },
      metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        standard: 'GH2-Credit-v1.0',
        network: process.env.BLOCKCHAIN_NETWORK || 'development'
      }
    };
  }

  /**
   * Generate verification hash for credit authenticity
   * @param {Object} submission - Submission data
   * @param {Object} creditData - Credit data
   * @returns {string} - Verification hash
   */
  generateVerificationHash(submission, creditData) {
    const crypto = require('crypto');
    const dataToHash = JSON.stringify({
      submissionId: submission.id,
      creditId: creditData.creditId,
      producer: submission.producerId,
      quantity: submission.productionData.quantity,
      approvedAt: creditData.approvedAt
    });
    
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
  }

  /**
   * Store complete credit data to IPFS
   * @param {Object} submission - Submission data
   * @param {Object} creditData - Credit data from blockchain
   * @returns {Promise<string>} - IPFS hash
   */
  async storeCreditToIPFS(submission, creditData) {
    const metadata = this.createCreditMetadata(submission, creditData);
    const name = `hydrogen-credit-${creditData.creditId}-${Date.now()}`;
    
    console.log(`[IPFS] Storing credit ${creditData.creditId} for producer ${submission.producerId}`);
    return await this.pinJSONToIPFS(metadata, name);
  }

  /**
   * Store credit data directly to IPFS (for testing/sample data)
   * @param {Object} creditData - Complete credit data object
   * @returns {Promise<string>} - IPFS hash
   */
  async storeCreditInIPFS(creditData) {
    const name = `hydrogen-credit-${creditData.creditId}-${Date.now()}`;
    console.log(`[IPFS] Storing credit ${creditData.creditId} directly to IPFS`);
    return await this.pinJSONToIPFS(creditData, name);
  }

  /**
   * Update existing credit in IPFS with new status/ownership
   * @param {Object} creditData - Updated credit data
   * @param {string} changeType - Type of change (sale, transfer, etc.)
   * @returns {Promise<string>} - New IPFS hash
   */
  async updateCreditInIPFS(creditData, changeType = 'update') {
    const updatedMetadata = {
      ...creditData,
      lastUpdated: new Date().toISOString(),
      updateType: changeType,
      version: creditData.version || '1.0'
    };
    
    const name = `hydrogen-credit-${creditData.creditId}-${changeType}-${Date.now()}`;
    console.log(`[IPFS] Updating credit ${creditData.creditId} - ${changeType}`);
    
    return await this.pinJSONToIPFS(updatedMetadata, name);
  }

  /**
   * Retrieve credit data from IPFS by hash
   * @param {string} ipfsHash - IPFS hash to retrieve
   * @returns {Promise<Object>} - Credit data from IPFS
   */
  async getCreditFromIPFS(ipfsHash) {
    try {
      console.log(`[IPFS] Retrieving credit data from hash: ${ipfsHash}`);
      const creditData = await this.getFromIPFS(ipfsHash);
      console.log(`[IPFS] ✓ Successfully retrieved credit data`);
      return creditData;
    } catch (error) {
      console.error(`[IPFS] ✗ Error retrieving credit from IPFS:`, error.message);
      throw new Error(`Failed to retrieve credit from IPFS: ${error.message}`);
    }
  }

  /**
   * Search for credits by producer address in Pinata
   * @param {string} producerAddress - Producer's wallet address
   * @returns {Promise<Array>} - Array of credit IPFS hashes
   */
  async searchCreditsByProducer(producerAddress) {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      console.warn('[IPFS] Pinata credentials not configured - cannot search');
      return [];
    }

    try {
      console.log(`[IPFS] Searching credits for producer: ${producerAddress}`);
      
      const response = await axios.get(
        `${this.pinataBaseUrl}/data/pinList?status=pinned&metadata[keyvalues][producer]=${producerAddress}&pageLimit=100`,
        {
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          },
          timeout: 30000
        }
      );

      const creditHashes = response.data.rows
        .filter(item => item.metadata.keyvalues?.type === 'hydrogen-credit')
        .map(item => ({
          ipfsHash: item.ipfs_pin_hash,
          name: item.metadata.name,
          dateUploaded: item.date_pinned,
          size: item.size
        }));

      console.log(`[IPFS] ✓ Found ${creditHashes.length} credits for producer`);
      return creditHashes;

    } catch (error) {
      console.error('[IPFS] ✗ Error searching credits by producer:', error.message);
      return [];
    }
  }

  /**
   * Get all hydrogen credits from Pinata
   * @returns {Promise<Array>} - Array of all credit IPFS data
   */
  async getAllCreditsFromIPFS() {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      console.warn('[IPFS] Pinata credentials not configured - cannot fetch credits');
      return [];
    }

    try {
      console.log('[IPFS] Fetching all hydrogen credits from Pinata...');
      
      // Get all pinned files first, then filter
      const response = await axios.get(
        `${this.pinataBaseUrl}/data/pinList`,
        {
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey
          },
          params: {
            status: 'pinned',
            pageLimit: 100
          },
          timeout: 30000
        }
      );

      // Filter for hydrogen credit files
      const allFiles = response.data.rows || [];
      const creditFiles = allFiles.filter(item => 
        item.metadata?.name?.includes('hydrogen-credit') ||
        item.metadata?.keyvalues?.type === 'hydrogen-credit' ||
        item.metadata?.keyvalues?.type === 'green-hydrogen-credit'
      );

      const credits = [];
      
      // Get detailed credit data for each file
      for (const item of creditFiles) {
        try {
          const creditData = await this.getCreditFromIPFS(item.ipfs_pin_hash);
          credits.push({
            ipfsHash: item.ipfs_pin_hash,
            name: item.metadata?.name || 'Unnamed Credit',
            dateUploaded: item.date_pinned,
            size: item.size,
            producer: creditData.producer?.address || item.metadata?.keyvalues?.producer || 'unknown',
            creditId: creditData.creditId || item.metadata?.keyvalues?.creditId || 'unknown',
            creditData: creditData,
            source: 'pinata'
          });
        } catch (error) {
          // Include failed items with error info
          credits.push({
            ipfsHash: item.ipfs_pin_hash,
            name: item.metadata?.name || 'Unnamed Credit',
            dateUploaded: item.date_pinned,
            size: item.size,
            producer: item.metadata?.keyvalues?.producer || 'unknown',
            creditId: item.metadata?.keyvalues?.creditId || 'unknown',
            creditData: null,
            source: 'pinata',
            error: `Failed to load credit data: ${error.message}`
          });
        }
      }

      console.log(`[IPFS] ✓ Found ${credits.length} total credits in IPFS`);
      return credits;

    } catch (error) {
      console.error('[IPFS] ✗ Error fetching all credits from IPFS:', error.message);
      if (error.response) {
        console.error('[IPFS] Response data:', error.response.data);
      }
      return [];
    }
  }
}

module.exports = new IPFSService();
