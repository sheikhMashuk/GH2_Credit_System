import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { User } from '../types';
import { ApiService } from '../utils/api';
import { BlockchainUtils } from '../utils/blockchain';

const BLOCKCHAIN_CONFIG = {
  chainId: 11155111, // Sepolia testnet
};

export interface AuthContextType {
  account: string | null;
  provider: any;
  signer: any;
  user: User | null;
  isConnecting: boolean;
  needsRoleSelection: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  signUp: (name?: string, role?: 'PRODUCER' | 'BUYER') => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Check if wallet is already connected or JWT token exists on component mount
  useEffect(() => {
    // Check JWT token first - if valid, it takes priority over wallet connection
    const initializeAuth = async () => {
      await checkJWTToken();
      
      // Only check wallet connection if no JWT token was found
      const token = localStorage.getItem('authToken');
      if (!token) {
        // Don't auto-check connection - let user manually connect
        console.log('AuthContext - No JWT token, waiting for manual wallet connection');
      }
    };
    
    initializeAuth();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Don't auto-fetch user data - let manual role selection happen first
  useEffect(() => {
    if (!account && !localStorage.getItem('authToken')) {
      setUser(null);
      setNeedsRoleSelection(false);
    }
  }, [account]);


  const checkJWTToken = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Decode JWT to check if it's expired
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp > currentTime) {
          // Token is still valid, restore user data
          const userData = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            name: 'Green Energy Regulatory Authority', // Default name for regulatory authority
            createdAt: new Date().toISOString() // Add required createdAt field
          };
          
          // Clear wallet-related state for regulatory authority
          setAccount(null);
          setProvider(null);
          setSigner(null);
          localStorage.removeItem('walletAddress');
          
          setUser(userData);
          console.log('JWT token restored from localStorage:', userData);
        } else {
          // Token expired, remove it
          localStorage.removeItem('authToken');
          console.log('JWT token expired, removed from localStorage');
        }
      } catch (error) {
        console.error('Error checking JWT token:', error);
        localStorage.removeItem('authToken');
      }
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    // Only handle account changes if not using JWT auth
    if (!localStorage.getItem('authToken')) {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        localStorage.setItem('walletAddress', accounts[0]);
        
        // Check if new account needs role selection
        try {
          const userData = await ApiService.getUserByWallet(accounts[0]);
          setUser(userData);
          setNeedsRoleSelection(false);
        } catch (error: any) {
          if (error.response?.status === 404) {
            console.log('AuthContext - Account changed to new user, showing role selection');
            setUser(null);
            setNeedsRoleSelection(true);
          }
        }
      } else {
        disconnect();
      }
    }
  };

  const handleChainChanged = () => {
    // Reload the page when chain changes
    window.location.reload();
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await web3Provider.getNetwork();

      // Check if we're on the correct network
      if (network.chainId !== BLOCKCHAIN_CONFIG.chainId) {
        const switched = await BlockchainUtils.switchToSepolia(window.ethereum);
        if (!switched) {
          toast.error('Please switch to Ethereum Sepolia Testnet');
          setIsConnecting(false);
          return;
        }
      }

      const accounts = await web3Provider.listAccounts();
      const signerInstance = web3Provider.getSigner();

      // Clear any existing JWT auth when connecting wallet
      localStorage.removeItem('authToken');
      setUser(null);

      setProvider(web3Provider);
      setSigner(signerInstance);
      setAccount(accounts[0]);

      // Store wallet address for API authentication
      localStorage.setItem('walletAddress', accounts[0]);

      toast.success('Wallet connected successfully!');
      
      // Check if user exists, if not show role selection
      try {
        const userData = await ApiService.getUserByWallet(accounts[0]);
        console.log('AuthContext - Existing user found:', userData);
        setUser(userData);
        setNeedsRoleSelection(false);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('AuthContext - New wallet, showing role selection');
          setUser(null);
          setNeedsRoleSelection(true);
        } else {
          console.error('Error checking user:', error);
        }
      }
      
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        toast.error('Please connect to MetaMask.');
      } else {
        toast.error('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setUser(null);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('authToken'); // Clear any JWT tokens
    toast.success('Wallet disconnected');
  };


  const signUp = async (name?: string, role?: 'PRODUCER' | 'BUYER') => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (isSigningUp) {
      console.log('Signup already in progress, ignoring duplicate request');
      return;
    }

    setIsSigningUp(true);
    
    try {
      console.log('AuthContext - Creating user with role:', role, 'name:', name);
      
      // First check if user already exists
      try {
        const existingUser = await ApiService.getUserByWallet(account);
        console.log('AuthContext - User already exists:', existingUser);
        setUser(existingUser);
        setNeedsRoleSelection(false);
        toast.success('Welcome back!');
        return;
      } catch (error: any) {
        if (error.response?.status !== 404) {
          throw error; // Re-throw if it's not a "user not found" error
        }
        // User doesn't exist, continue with signup
      }
      
      // Create new user with selected role - role is required
      if (!role) {
        toast.error('Please select a role before registering');
        return;
      }
      const newUser = await ApiService.signUp(name || '', account, role);
      console.log('AuthContext - New user created:', newUser);
      setUser(newUser);
      setNeedsRoleSelection(false);
      toast.success(`${role} account created successfully!`);
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await ApiService.login(email, password);
      const { token, user: userData } = response;
      
      // Store token in localStorage
      localStorage.setItem('authToken', token);
      
      // Clear wallet-related state for regulatory authority login
      setAccount(null);
      setProvider(null);
      setSigner(null);
      localStorage.removeItem('walletAddress');
      
      // Set user data
      setUser(userData);
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Error logging in:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('walletAddress'); // Clear wallet data too
    setUser(null);
    setAccount(null);
    setProvider(null);
    setSigner(null);
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    account,
    provider,
    signer,
    user,
    isConnecting,
    needsRoleSelection,
    connectWallet,
    disconnect,
    signUp,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
