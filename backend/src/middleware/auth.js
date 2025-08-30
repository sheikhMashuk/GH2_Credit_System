const jwt = require('jsonwebtoken');
const User = require('../models/User');
const InMemoryUser = require('../models/InMemoryUser');
const blockchainConfig = require('../config/blockchain.config');

// Always use InMemoryUser for consistency with controllers
const UserModel = InMemoryUser;

// Middleware to authenticate wallet users or JWT token users
const authenticateToken = async (req, res, next) => {
  try {
    console.log('Auth middleware - Request headers:', req.headers);
    const authHeader = req.headers['authorization'];
    const walletAddress = req.headers['x-wallet-address'];
    
    console.log('Auth middleware - authHeader:', authHeader);
    console.log('Auth middleware - walletAddress:', walletAddress);
    
    // Try JWT authentication first (for regulatory authorities)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('Auth middleware - Trying JWT authentication');
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await UserModel.findById(decoded.userId);
        
        if (!user) {
          console.log('Auth middleware - JWT user not found');
          return res.status(401).json({
            error: 'Invalid token',
            message: 'User not found'
          });
        }
        
        console.log('Auth middleware - JWT authentication successful:', user._id);
        req.user = user;
        return next();
      } catch (jwtError) {
        console.log('Auth middleware - JWT verification failed:', jwtError.message);
        // JWT verification failed, continue to wallet auth
      }
    }
    
    // Try wallet address authentication (for producers/verifiers)
    if (walletAddress) {
      console.log('Auth middleware - Trying wallet authentication for:', walletAddress);
      
      if (!blockchainConfig.isValidAddress(walletAddress)) {
        console.log('Auth middleware - Invalid wallet address format');
        return res.status(400).json({
          error: 'Invalid wallet address',
          message: 'Please provide a valid Ethereum wallet address'
        });
      }
      
      // Debug the user lookup
      UserModel.debugFindByWallet(walletAddress);
      
      const user = await UserModel.findOne({ 
        walletAddress: walletAddress.toLowerCase() 
      });
      
      console.log('Auth middleware - User lookup result:', user ? user._id : 'Not found');
      
      if (!user) {
        console.log('Auth middleware - No user found for wallet:', walletAddress);
        return res.status(401).json({
          error: 'User not found',
          message: 'No user found with this wallet address'
        });
      }
      
      console.log('Auth middleware - Wallet authentication successful:', user._id, user.name);
      req.user = user;
      return next();
    }
    
    // No valid authentication method provided
    console.log('Auth middleware - No authentication method provided');
    return res.status(401).json({
      error: 'Access denied',
      message: 'No valid authentication provided. Include either Bearer token or x-wallet-address header'
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to authenticate user'
    });
  }
};

// Middleware to check if user is regulatory authority
const requireRegulatoryAuth = (req, res, next) => {
  if (req.user.role !== 'REGULATORY_AUTHORITY') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Regulatory authority access required'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRegulatoryAuth
};
