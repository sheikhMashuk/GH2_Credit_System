const User = require('../../models/User');
const InMemoryUser = require('../../models/InMemoryUser');
const blockchainConfig = require('../../config/blockchain.config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Always use in-memory store for simplicity
const UserModel = InMemoryUser;

class UserController {
  /**
   * Sign up a new user (Producer by default)
   * POST /api/users/signup
   */
  async signup(req, res) {
    try {
      console.log('Signup request received:', req.body);
      const { name, walletAddress, role } = req.body;

      // Validate input - only walletAddress is required
      if (!walletAddress) {
        console.log('Missing required field - walletAddress:', !!walletAddress);
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'WalletAddress is required'
        });
      }

      // Auto-generate name from wallet address if not provided
      const displayName = name && name.trim() 
        ? name.trim() 
        : `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
      
      console.log('Using display name:', displayName);

      // Validate wallet address format
      console.log('Validating wallet address:', walletAddress);
      if (!blockchainConfig.isValidAddress(walletAddress)) {
        console.log('Invalid wallet address format');
        return res.status(400).json({
          error: 'Invalid wallet address',
          message: 'Please provide a valid Ethereum wallet address'
        });
      }

      // Check if user already exists
      console.log('Checking for existing user with wallet:', walletAddress.toLowerCase());
      const existingUser = await UserModel.findOne({
        walletAddress: walletAddress.toLowerCase()
      });

      if (existingUser) {
        console.log('User already exists:', existingUser._id);
        return res.status(409).json({
          error: 'User already exists',
          message: 'A user with this wallet address already exists',
          user: {
            id: existingUser._id,
            name: existingUser.name,
            walletAddress: existingUser.walletAddress,
            role: existingUser.role
          }
        });
      }

      // Create new user - role is required
      const validRoles = ['PRODUCER', 'BUYER', 'REGULATORY_AUTHORITY'];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Role is required',
          message: 'Please specify a valid role: PRODUCER, BUYER, or REGULATORY_AUTHORITY'
        });
      }
      const userRole = role;
      console.log('Creating new user with data:', { name: displayName, walletAddress: walletAddress.toLowerCase(), role: userRole });
      const newUser = await UserModel.create({
        name: displayName,
        walletAddress: walletAddress.toLowerCase(),
        role: userRole
      });

      console.log('New user created:', newUser._id, newUser.walletAddress);

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: newUser._id,
          name: newUser.name,
          walletAddress: newUser.walletAddress,
          role: newUser.role,
          createdAt: newUser.createdAt
        }
      });

    } catch (error) {
      console.error('Error in signup:', error);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      // Handle specific MongoDB errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation error',
          message: error.message,
          details: error.errors
        });
      }
      
      if (error.code === 11000) {
        return res.status(409).json({
          error: 'Duplicate entry',
          message: 'User with this wallet address already exists'
        });
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create user',
        details: error.message
      });
    }
  }

  /**
   * Login for regulatory authority
   * POST /api/users/login
   */
  async login(req, res) {
    try {
      console.log('Login request received:', req.body);
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await UserModel.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Check if user is regulatory authority
      if (user.role !== 'REGULATORY_AUTHORITY') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'This login is only for regulatory authorities'
        });
      }

      // Compare password
      const isPasswordValid = await InMemoryUser.comparePassword(user, password);

      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Error in login:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to login'
      });
    }
  }

  /**
   * Get user by wallet address
   * GET /api/users/:walletAddress
   */
  async getUserByWallet(req, res) {
    try {
      const { walletAddress } = req.params;

      if (!blockchainConfig.isValidAddress(walletAddress)) {
        return res.status(400).json({
          error: 'Invalid wallet address',
          message: 'Please provide a valid Ethereum wallet address'
        });
      }

      const user = await UserModel.findOne({
        walletAddress: walletAddress.toLowerCase()
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'No user found with this wallet address'
        });
      }

      res.json({
        user: {
          id: user._id,
          name: user.name,
          walletAddress: user.walletAddress,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });

    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch user'
      });
    }
  }

  /**
   * Update user role (admin function)
   * PUT /api/users/:id/role
   */
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['PRODUCER', 'BUYER', 'VERIFIER'].includes(role)) {
        return res.status(400).json({
          error: 'Invalid role',
          message: 'Role must be PRODUCER, BUYER, or VERIFIER'
        });
      }

      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        { role },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          error: 'User not found',
          message: 'No user found with this ID'
        });
      }

      console.log('User role updated:', updatedUser._id, 'to', role);

      res.json({
        message: 'User role updated successfully',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          walletAddress: updatedUser.walletAddress,
          role: updatedUser.role,
          updatedAt: updatedUser.updatedAt
        }
      });

    } catch (error) {
      console.error('Error updating user role:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update user role'
      });
    }
  }

  /**
   * Get all users (admin function)
   * GET /api/users
   */
  async getAllUsers(req, res) {
    try {
      const { role } = req.query;

      const whereClause = role ? { role } : {};

      const users = await UserModel.find(whereClause)
        .sort({ createdAt: -1 });

      res.json({
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          walletAddress: user.walletAddress,
          role: user.role,
          createdAt: user.createdAt,
          submissionCount: 0 // TODO: Add submission count aggregation
        }))
      });

    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch users'
      });
    }
  }
}

module.exports = new UserController();
