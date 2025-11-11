const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin, authenticateToken, requireAdmin  } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const ActivityLog = require('../models/ActivityLog');

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


/**
 * @route   GET /api/users/:userId/logs
 * @desc    Get activity logs for a specific user
 * @access  Admin
 */
// router.get('/:userId/logs', authenticateToken, requireAdmin, async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { 
//       page = 1, 
//       limit = 50, 
//       startDate, 
//       endDate, 
//       actionType 
//     } = req.query;

//     // Build query
//     const query = { userId };

//     // Add date filters if provided
//     if (startDate || endDate) {
//       query.timestamp = {};
//       if (startDate) {
//         query.timestamp.$gte = new Date(startDate);
//       }
//       if (endDate) {
//         query.timestamp.$lte = new Date(endDate);
//       }
//     }

//     // Add action type filter if provided
//     if (actionType) {
//       query.action = actionType;
//     }

//     // Calculate pagination
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // Fetch logs
//     const logs = await ActivityLog.find(query)
//       .sort({ timestamp: -1 })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .lean();

//     // Get total count for pagination
//     const total = await ActivityLog.countDocuments(query);

//     res.json({
//       logs,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages: Math.ceil(total / parseInt(limit))
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching user logs:', error);
//     res.status(500).json({ 
//       error: 'Erreur lors de la récupération des logs',
//       message: error.message 
//     });
//   }
// });

module.exports = router;
