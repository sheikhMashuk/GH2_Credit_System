const express = require('express');
const userController = require('../controllers/user.controller');

const router = express.Router();

/**
 * @route POST /api/users/signup
 * @desc Sign up a new user (Producer by default)
 * @access Public
 */
router.post('/signup', userController.signup);

/**
 * @route GET /api/users/:walletAddress
 * @desc Get user by wallet address
 * @access Public
 */
router.get('/:walletAddress', userController.getUserByWallet);

/**
 * @route PUT /api/users/:id/role
 * @desc Update user role (admin function)
 * @access Admin
 */
router.put('/:id/role', userController.updateUserRole);

/**
 * @route GET /api/users
 * @desc Get all users (admin function)
 * @access Admin
 */
router.get('/', userController.getAllUsers);

module.exports = router;
