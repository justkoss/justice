const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const performanceController = require('../controllers/performanceController');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/performance/session
 * @desc    Log work session (login/logout)
 * @access  Authenticated users
 */
router.post('/session', performanceController.logWorkSession);

/**
 * @route   GET /api/performance/user/:userId
 * @desc    Get user performance report
 * @access  Admin or own user
 */
router.get('/user/:userId', performanceController.getUserPerformance);

/**
 * @route   GET /api/performance/user/:userId/hourly
 * @desc    Get hourly activity distribution for a user
 * @access  Admin or own user
 */
router.get('/user/:userId/hourly', performanceController.getHourlyDistribution);

/**
 * @route   GET /api/performance/user/:userId/daily
 * @desc    Get daily activity for a user
 * @access  Admin or own user
 */
router.get('/user/:userId/daily', performanceController.getDailyActivity);

/**
 * @route   GET /api/performance/user/:userId/work-hours
 * @desc    Get work hours for a user
 * @access  Admin or own user
 */
router.get('/user/:userId/work-hours', performanceController.getWorkHours);

/**
 * @route   GET /api/performance/weekly
 * @desc    Get weekly performance comparison
 * @access  Admin only
 */
router.get('/weekly', performanceController.getWeeklyComparison);

/**
 * @route   GET /api/performance/monthly
 * @desc    Get monthly performance
 * @access  Admin only
 */
router.get('/monthly', performanceController.getMonthlyPerformance);

/**
 * @route   GET /api/performance/top-performers
 * @desc    Get top performers
 * @access  Admin only
 */
router.get('/top-performers', performanceController.getTopPerformers);

/**
 * @route   GET /api/performance/all-users
 * @desc    Get all users performance data
 * @access  Admin only
 */
router.get('/all-users', performanceController.getAllUsersPerformance);

/**
 * @route   GET /api/performance/export/csv
 * @desc    Export performance data to CSV
 * @access  Admin only
 */
router.get('/export/csv', performanceController.exportPerformanceCSV);

/**
 * @route   GET /api/performance/dashboard
 * @desc    Get performance dashboard overview
 * @access  Admin only
 */
router.get('/dashboard', performanceController.getDashboardOverview);

module.exports = router;
