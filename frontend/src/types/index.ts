export interface User {
  id: string;
  name: string;
  walletAddress?: string;
  email?: string;
  role: 'PRODUCER' | 'VERIFIER' | 'REGULATORY_AUTHORITY';
  createdAt: string;
}

export interface Submission {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  tokenId?: string;
  productionData: {
    productionDate: string;
    quantity: number;
    location: string;
    [key: string]: any;
  };
  price: string;
  createdAt: string;
  updatedAt: string;
  producer: {
    id: string;
    name: string;
    walletAddress: string;
  };
}

export interface MarketplaceListing {
  tokenId: string;
  producer: string;
  price: string;
  priceInWei: string;
  tokenURI: string;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
    uri?: string;
  };
}

export interface AuthContextType {
  account: string | null;
  provider: any;
  signer: any;
  user: User | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  signUp: (name?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface BlockchainConfig {
  contractAddress: string;
  rpcUrl: string;
  chainId: number;
  chainName: string;
}
