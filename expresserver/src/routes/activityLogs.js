const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  logActivity,
  getActivityLogs,
  getDocumentHistory,
  getUserActivitySummary,
  getRecentActivity,
  getActivityStatistics
} = require('../controllers/activityLogController');

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   POST /api/activity-logs
 * @desc    Log an activity
 * @access  Private (All authenticated users)
 */
router.post('/', logActivity);

/**
 * @route   GET /api/activity-logs
 * @desc    Get activity logs with filters
 * @access  Private (Users see own logs, Admins see all)
 */
router.get('/', getActivityLogs);

/**
 * @route   GET /api/activity-logs/recent
 * @desc    Get recent system-wide activity
 * @access  Private (Admin only)
 */
router.get('/recent', getRecentActivity);

/**
 * @route   GET /api/activity-logs/statistics
 * @desc    Get activity statistics
 * @access  Private (Admin only)
 */
router.get('/statistics', getActivityStatistics);

/**
 * @route   GET /api/activity-logs/document/:documentId
 * @desc    Get activity history for a specific document
 * @access  Private (All authenticated users)
 */
router.get('/document/:documentId', getDocumentHistory);

/**
 * @route   GET /api/activity-logs/user/:userId/summary
 * @desc    Get user activity summary
 * @access  Private (User's own summary or Admin)
 */
router.get('/user/:userId/summary', getUserActivitySummary);

module.exports = router;
