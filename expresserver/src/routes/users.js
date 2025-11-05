const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * All user management routes require admin access
 */

/**
 * @route   GET /api/users
 * @desc    Get all users with filters
 * @access  Private (Admin only)
 */
router.get('/', authenticate, isAdmin, asyncHandler(userController.getUsers));

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', authenticate, isAdmin, asyncHandler(userController.getUser));

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post('/', authenticate, isAdmin, asyncHandler(userController.createUser));

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, isAdmin, asyncHandler(userController.updateUser));

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, isAdmin, asyncHandler(userController.deleteUser));

/**
 * @route   POST /api/users/:id/bureaus
 * @desc    Assign bureaux to supervisor
 * @access  Private (Admin only)
 */
router.post('/:id/bureaus', authenticate, isAdmin, asyncHandler(userController.assignBureaus));

/**
 * @route   GET /api/users/:id/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/:id/stats', authenticate, isAdmin, asyncHandler(userController.getUserStats));

module.exports = router;
