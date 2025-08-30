const User = require('../../models/User');
const InMemoryUser = require('../../models/InMemoryUser');
const blockchainConfig = require('../../config/blockchain.config');

// Use in-memory store if MongoDB Atlas has write restrictions
const USE_MEMORY_STORE = process.env.USE_MEMORY_STORE === 'true';
const UserModel = USE_MEMORY_STORE ? InMemoryUser : User;

class UserController {
  /**
   * Sign up a new user (Producer by default)
   * POST /api/users/signup
   */
  async signup(req, res) {
    try {
      console.log('Signup request received:', req.body);
      const { name, walletAddress } = req.body;

      // Validate input
      if (!name || !walletAddress) {
        console.log('Missing required fields - name:', !!name, 'walletAddress:', !!walletAddress);
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Name and walletAddress are required'
        });
      }

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

      // Create new user
      console.log('Creating new user with data:', { name: name.trim(), walletAddress: walletAddress.toLowerCase(), role: 'PRODUCER' });
      const newUser = await UserModel.create({
        name: name.trim(),
        walletAddress: walletAddress.toLowerCase(),
        role: 'PRODUCER' // Default role
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

      if (!role || !['PRODUCER', 'VERIFIER'].includes(role)) {
        return res.status(400).json({
          error: 'Invalid role',
          message: 'Role must be either PRODUCER or VERIFIER'
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
