import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { User, AuthContextType } from '../types';
import { ApiService } from '../utils/api';
import { BlockchainUtils, BLOCKCHAIN_CONFIG } from '../utils/blockchain';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    checkConnection();
    
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

  // Fetch user data when account changes
  useEffect(() => {
    if (account) {
      fetchUserData(account);
    } else {
      setUser(null);
    }
  }, [account]);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await web3Provider.listAccounts();
        
        if (accounts.length > 0) {
          const network = await web3Provider.getNetwork();
          
          if (network.chainId !== BLOCKCHAIN_CONFIG.chainId) {
            console.warn('Wrong network detected');
            return;
          }

          setProvider(web3Provider);
          setSigner(web3Provider.getSigner());
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
    } else {
      disconnect();
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

      setProvider(web3Provider);
      setSigner(signerInstance);
      setAccount(accounts[0]);

      toast.success('Wallet connected successfully!');
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
    toast.success('Wallet disconnected');
  };

  const fetchUserData = async (walletAddress: string) => {
    try {
      const userData = await ApiService.getUserByWallet(walletAddress);
      setUser(userData);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // User doesn't exist, they need to sign up
        setUser(null);
      } else {
        console.error('Error fetching user data:', error);
        toast.error('Failed to fetch user data');
      }
    }
  };

  const signUp = async (name: string) => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const newUser = await ApiService.signUp(name, account);
      setUser(newUser);
      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error('Error signing up:', error);
      if (error.response?.status === 409) {
        // User already exists, fetch their data
        await fetchUserData(account);
        toast.success('Welcome back!');
      } else {
        toast.error('Failed to create account. Please try again.');
      }
    }
  };

  const value: AuthContextType = {
    account,
    provider,
    signer,
    user,
    isConnecting,
    connectWallet,
    disconnect,
    signUp,
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
