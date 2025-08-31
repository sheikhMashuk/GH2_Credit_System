export interface User {
  id: string;
  name: string;
  walletAddress?: string;
  email?: string;
  role: 'PRODUCER' | 'VERIFIER' | 'REGULATORY_AUTHORITY' | 'BUYER';
  createdAt: string;
}

export interface Submission {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  creditId?: string;
  credits?: number;
  productionData: {
    productionDate: string;
    quantity: number;
    location: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  producer: {
    id: string;
    name: string;
    walletAddress: string;
  };
}

export interface CreditListing {
  creditId: string;
  producer: string;
  quantity: string;
  credits: string;
  location: string;
  productionDate: string;
  isApproved: boolean;
  price?: number;
  isForSale?: boolean;
  listedAt?: string;
}

export interface MarketplaceListing {
  id: string;
  creditId: string;
  producerId: string;
  producer: {
    name: string;
    walletAddress: string;
  };
  credits: number;
  pricePerCredit: number;
  totalPrice: number;
  quantity: number;
  location: string;
  productionDate: string;
  listedAt: string;
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED';
}

export interface Transaction {
  _id: string;
  id?: string;
  type: 'CREDIT_PURCHASE' | 'CREDIT_GENERATION';
  fromAddress: string;
  toAddress: string;
  credits: number;
  price?: number;
  transactionHash: string;
  blockNumber?: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  createdAt: string;
  listingId?: string;
  creditsBurned?: number;
  burnStatus?: 'BURNED_AND_RETIRED' | 'TRANSFERRED';
  ipfsHash?: string;
}

export interface AuthContextType {
  account: string | null;
  provider: any;
  signer: any;
  user: User | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  signUp: (name?: string, role?: 'PRODUCER' | 'BUYER') => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface BlockchainConfig {
  contractAddress: string;
  rpcUrl: string;
  chainId: number;
  chainName: string;
}
