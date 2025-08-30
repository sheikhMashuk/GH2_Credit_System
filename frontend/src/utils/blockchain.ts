import { ethers } from 'ethers';

// Contract ABI - Essential functions only
export const CONTRACT_ABI = [
  "function buyCredit(uint256 tokenId) public payable",
  "function getActiveListings() external view returns (uint256[] memory tokenIds, address[] memory producers, uint256[] memory prices)",
  "function getListing(uint256 tokenId) external view returns (address producer, uint256 price, bool isActive)",
  "function totalSupply() external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "event CreditListed(uint256 indexed tokenId, address indexed producer, uint256 price)",
  "event CreditSold(uint256 indexed tokenId, address indexed buyer, address indexed producer)"
];

export const BLOCKCHAIN_CONFIG = {
  contractAddress: import.meta.env.VITE_SMART_CONTRACT_ADDRESS || '',
  rpcUrl: import.meta.env.VITE_ETHEREUM_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID',
  chainId: 11155111,
  chainName: 'Ethereum Sepolia Testnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID'],
  blockExplorerUrls: ['https://sepolia.etherscan.io/']
};

export class BlockchainUtils {
  static formatEther(value: string | ethers.BigNumber): string {
    return ethers.utils.formatEther(value);
  }

  static parseEther(value: string): ethers.BigNumber {
    return ethers.utils.parseEther(value);
  }

  static isValidAddress(address: string): boolean {
    return ethers.utils.isAddress(address);
  }

  static shortenAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  static async switchToSepolia(provider: any): Promise<boolean> {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BLOCKCHAIN_CONFIG.chainId.toString(16)}` }],
      });
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${BLOCKCHAIN_CONFIG.chainId.toString(16)}`,
              chainName: BLOCKCHAIN_CONFIG.chainName,
              nativeCurrency: BLOCKCHAIN_CONFIG.nativeCurrency,
              rpcUrls: BLOCKCHAIN_CONFIG.rpcUrls,
              blockExplorerUrls: BLOCKCHAIN_CONFIG.blockExplorerUrls,
            }],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          return false;
        }
      }
      console.error('Failed to switch to Sepolia network:', switchError);
      return false;
    }
  }

  static getContract(signerOrProvider: ethers.Signer | ethers.providers.Provider) {
    return new ethers.Contract(
      BLOCKCHAIN_CONFIG.contractAddress,
      CONTRACT_ABI,
      signerOrProvider
    );
  }

  static async getGasPrice(provider: ethers.providers.Provider): Promise<ethers.BigNumber> {
    try {
      return await provider.getGasPrice();
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return ethers.utils.parseUnits('20', 'gwei'); // Fallback gas price
    }
  }

  static formatTokenId(tokenId: string | number): string {
    return tokenId.toString();
  }

  static parseMetadata(tokenURI: string): any {
    try {
      if (tokenURI.startsWith('data:application/json;base64,')) {
        const base64Data = tokenURI.replace('data:application/json;base64,', '');
        const jsonString = atob(base64Data);
        return JSON.parse(jsonString);
      }
      return { uri: tokenURI };
    } catch (error) {
      console.warn('Failed to parse metadata:', error);
      return { uri: tokenURI };
    }
  }
}
