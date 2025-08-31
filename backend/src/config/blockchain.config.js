const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABI - Updated for credit-based system
const CONTRACT_ABI = [
  // Credit generation functions
  "function generateCredits(address producer, uint256 quantity, string memory location, string memory productionDate) external returns (uint256)",
  "function getApprovedCredits(address producer) external view returns (uint256)",
  "function getCredit(uint256 creditId) external view returns (address producer, uint256 quantity, string memory location, string memory productionDate, bool isActive)",
  "function getTotalCredits() external view returns (uint256)",
  
  // Transfer functions
  "function transferCredits(address to, uint256 amount) external returns (bool)",
  "function getBalance(address account) external view returns (uint256)",
  
  // Events
  "event CreditGenerated(uint256 indexed creditId, address indexed producer, uint256 quantity)",
  "event CreditTransferred(address indexed from, address indexed to, uint256 amount)",
  
  // Legacy NFT functions (for backward compatibility)
  "function verifyAndMintToProducer(address producer, uint256 price, string memory tokenURI) external returns (uint256)",
  "function verifyAndMintToListing(address producer, uint256 price, string memory tokenURI) external",
  "function buyCredit(uint256 tokenId) external payable",
  "function getActiveListings() external view returns (uint256[] memory tokenIds, address[] memory producers, uint256[] memory prices)",
  "function getListing(uint256 tokenId) external view returns (address producer, uint256 price, bool isActive)",
  "function totalSupply() external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "event CreditListed(uint256 indexed tokenId, address indexed producer, uint256 price)",
  "event CreditSold(uint256 indexed tokenId, address indexed buyer, address indexed producer)"
];

class BlockchainConfig {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.initialize();
  }

  initialize() {
    try {
      // Initialize provider
      if (!process.env.ETHEREUM_SEPOLIA_RPC_URL) {
        console.warn('ETHEREUM_SEPOLIA_RPC_URL not found. Using default provider.');
        this.provider = ethers.getDefaultProvider('sepolia');
      } else {
        this.provider = new ethers.providers.JsonRpcProvider(
          process.env.ETHEREUM_SEPOLIA_RPC_URL
        );
      }

      // Initialize signer (server admin wallet)
      if (!process.env.SERVER_ADMIN_PRIVATE_KEY) {
        console.warn('SERVER_ADMIN_PRIVATE_KEY not found. Blockchain operations will be limited.');
        return;
      }

      this.signer = new ethers.Wallet(
        process.env.SERVER_ADMIN_PRIVATE_KEY,
        this.provider
      );

      // Initialize contract
      if (!process.env.SMART_CONTRACT_ADDRESS) {
        console.warn('SMART_CONTRACT_ADDRESS not found. Contract interactions will fail.');
        return;
      }

      this.contract = new ethers.Contract(
        process.env.SMART_CONTRACT_ADDRESS,
        CONTRACT_ABI,
        this.signer
      );

      console.log('Blockchain configuration initialized successfully');
      console.log('Signer address:', this.signer.address);
      console.log('Contract address:', process.env.SMART_CONTRACT_ADDRESS);

    } catch (error) {
      console.error('Failed to initialize blockchain configuration:', error.message);
      // Don't throw error, just log it to prevent app crash
      console.warn('Continuing without full blockchain configuration...');
    }
  }

  // Get provider instance
  getProvider() {
    return this.provider;
  }

  // Get signer instance
  getSigner() {
    return this.signer;
  }

  // Get contract instance
  getContract() {
    if (!this.contract) {
      throw new Error('Contract not initialized. Check SMART_CONTRACT_ADDRESS in environment.');
    }
    return this.contract;
  }

  // Utility function to convert price to wei
  priceToWei(priceInMatic) {
    return ethers.utils.parseEther(priceInMatic.toString());
  }

  // Utility function to convert wei to MATIC
  weiToMatic(weiAmount) {
    return ethers.utils.formatEther(weiAmount);
  }

  // Check if wallet address is valid
  isValidAddress(address) {
    try {
      return ethers.utils.isAddress(address);
    } catch (error) {
      console.error('Error validating address:', error);
      return false;
    }
  }

  // Get current gas price
  async getGasPrice() {
    try {
      return await this.provider.getGasPrice();
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return ethers.utils.parseUnits('20', 'gwei'); // Fallback gas price
    }
  }

  // Check network connection
  async checkConnection() {
    try {
      const network = await this.provider.getNetwork();
      const balance = await this.signer.getBalance();
      
      return {
        connected: true,
        network: network.name,
        chainId: network.chainId,
        signerBalance: this.weiToMatic(balance)
      };
    } catch (error) {
      console.error('Blockchain connection check failed:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const blockchainConfig = new BlockchainConfig();
module.exports = blockchainConfig;
