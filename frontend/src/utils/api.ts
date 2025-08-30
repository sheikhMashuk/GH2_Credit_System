import axios from 'axios';
import { User, Submission, MarketplaceListing } from '../types';

// Force API URL to port 5000 since backend runs there
const API_BASE_URL = 'http://localhost:5000';

console.log('API_BASE_URL configured:', API_BASE_URL);
console.log('Environment VITE_API_URL:', import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and auth token
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  
  // Add wallet address for wallet-based authentication (for producers/verifiers)
  const walletAddress = localStorage.getItem('walletAddress');
  console.log('Wallet address from localStorage:', walletAddress);
  
  if (walletAddress) {
    config.headers['x-wallet-address'] = walletAddress;
    console.log('Added x-wallet-address header:', walletAddress);
  }
  
  // Add auth token if available (for regulatory authorities) - only if no wallet address
  const token = localStorage.getItem('authToken');
  if (token && !walletAddress) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Using JWT token for authentication');
  }
  
  console.log('Request headers:', config.headers);
  
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class ApiService {
  // User endpoints
  static async signUp(name: string, walletAddress: string): Promise<User> {
    const response = await api.post('/api/users/signup', { name, walletAddress });
    return response.data.user;
  }

  static async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await api.post('/api/users/login', { email, password });
    return response.data;
  }

  static async getUserByWallet(walletAddress: string): Promise<User> {
    const response = await api.get(`/api/users/${walletAddress}`);
    return response.data.user;
  }

  static async updateUserRole(userId: string, role: 'PRODUCER' | 'VERIFIER'): Promise<User> {
    const response = await api.put(`/api/users/${userId}/role`, { role });
    return response.data.user;
  }

  static async getAllUsers(role?: 'PRODUCER' | 'VERIFIER'): Promise<User[]> {
    const params = role ? { role } : {};
    const response = await api.get('/api/users', { params });
    return response.data.users;
  }

  // Submission endpoints
  static async createSubmission(
    productionData: any,
    price: number
  ): Promise<Submission> {
    const response = await api.post('/api/submissions', {
      productionData,
      price,
    });
    return response.data.submission;
  }

  static async getPendingSubmissions(): Promise<Submission[]> {
    const response = await api.get('/api/submissions/pending');
    return response.data.submissions;
  }

  static async verifySubmission(submissionId: string): Promise<any> {
    const response = await api.post(`/api/submissions/${submissionId}/verify`, {});
    return response.data;
  }

  static async getSubmissionsByProducer(producerId: string): Promise<Submission[]> {
    const response = await api.get(`/api/submissions/producer/${producerId}`);
    console.log('API getSubmissionsByProducer response:', response.data);
    // Backend returns direct array, not nested in submissions property
    return Array.isArray(response.data) ? response.data : response.data.submissions || [];
  }

  static async getMySubmissions(): Promise<Submission[]> {
    const response = await api.get('/api/submissions/my-submissions');
    console.log('API getMySubmissions response:', response.data);
    // Backend returns direct array, not nested in submissions property
    return Array.isArray(response.data) ? response.data : response.data.submissions || [];
  }

  static async getAllSubmissions(status?: string): Promise<Submission[]> {
    const params = status ? { status } : {};
    const response = await api.get('/api/submissions', { params });
    console.log('API getAllSubmissions response:', response.data);
    // Backend returns direct array, not nested in submissions property
    return Array.isArray(response.data) ? response.data : response.data.submissions || [];
  }

  // Marketplace endpoints
  static async getMarketplaceListings(): Promise<MarketplaceListing[]> {
    const response = await api.get('/api/marketplace');
    return response.data.listings;
  }

  static async getListingDetails(tokenId: string): Promise<MarketplaceListing> {
    const response = await api.get(`/api/marketplace/${tokenId}`);
    return response.data.listing;
  }

  static async getMarketplaceStats(): Promise<any> {
    const response = await api.get('/api/marketplace/stats');
    return response.data.stats;
  }

  static async getConnectionStatus(): Promise<any> {
    const response = await api.get('/api/marketplace/connection/status');
    return response.data.blockchain;
  }

  // Health check
  static async healthCheck(): Promise<any> {
    const response = await api.get('/health');
    return response.data;
  }
}

export default api;
