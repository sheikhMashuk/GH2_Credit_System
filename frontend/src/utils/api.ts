import axios from 'axios';
import { User, Submission, MarketplaceListing } from '../types';

// Force API URL to port 3001 since backend runs there
const API_BASE_URL = 'http://localhost:3001';

console.log('API_BASE_URL configured:', API_BASE_URL);
console.log('Environment VITE_API_URL:', import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
    producerId: string,
    productionData: any,
    price: number
  ): Promise<Submission> {
    const response = await api.post('/api/submissions', {
      producerId,
      productionData,
      price,
    });
    return response.data.submission;
  }

  static async getPendingSubmissions(): Promise<Submission[]> {
    const response = await api.get('/api/submissions/pending');
    return response.data.submissions;
  }

  static async verifySubmission(submissionId: string, verifierId?: string): Promise<any> {
    const response = await api.post(`/api/submissions/${submissionId}/verify`, {
      verifierId,
    });
    return response.data;
  }

  static async getSubmissionsByProducer(producerId: string): Promise<Submission[]> {
    const response = await api.get(`/api/submissions/producer/${producerId}`);
    return response.data.submissions;
  }

  static async getAllSubmissions(status?: string): Promise<Submission[]> {
    const params = status ? { status } : {};
    const response = await api.get('/api/submissions', { params });
    return response.data.submissions;
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
