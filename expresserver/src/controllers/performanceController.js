const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

/**
 * Log work session (login/logout)
 */
exports.logWorkSession = async (req, res, next) => {
  try {
    const { session_type } = req.body;
    const userId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    if (!session_type || !['login', 'logout'].includes(session_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session type. Must be "login" or "logout"'
      });
    }

    ActivityLog.logWorkSession(userId, session_type, ipAddress, userAgent);

    res.status(201).json({
      success: true,
      message: 'Work session logged successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user performance report
 */
exports.getUserPerformance = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { start_date, end_date } = req.query;

    // Admin can view any user's performance
    // Users can only view their own
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const report = ActivityLog.getUserPerformanceReport(userId, start_date, end_date);
    const user = User.findById(userId);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      },
      report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get hourly activity distribution (productive hours analysis)
 */
exports.getHourlyDistribution = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { start_date, end_date } = req.query;

    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const distribution = ActivityLog.getHourlyDistribution(userId, start_date, end_date);

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get daily activity for a user
 */
exports.getDailyActivity = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { start_date, end_date } = req.query;

    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const dailyActivity = ActivityLog.getDailyActivity(userId, start_date, end_date);

    res.json({
      success: true,
      data: dailyActivity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get weekly performance comparison (Admin only)
 */
exports.getWeeklyComparison = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const comparison = ActivityLog.getWeeklyComparison(start_date, end_date);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get monthly performance (Admin only)
 */
exports.getMonthlyPerformance = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }

    const performance = ActivityLog.getMonthlyPerformance(year, month);

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top performers (Admin only)
 */
exports.getTopPerformers = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { start_date, end_date, limit } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const topPerformers = ActivityLog.getTopPerformers(
      start_date,
      end_date,
      limit ? parseInt(limit) : 10
    );

    res.json({
      success: true,
      data: topPerformers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get work hours for a user
 */
exports.getWorkHours = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { start_date, end_date } = req.query;

    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const workHours = ActivityLog.calculateWorkHours(userId, start_date, end_date);

    res.json({
      success: true,
      data: workHours
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users performance data (Admin only)
 */
exports.getAllUsersPerformance = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const performanceData = ActivityLog.getAllUsersPerformanceData(start_date, end_date);

    res.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export all users performance to CSV (Admin only)
 */
exports.exportPerformanceCSV = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const performanceData = ActivityLog.getAllUsersPerformanceData(start_date, end_date);

    // Create CSV manually
    const headers = [
      'Username',
      'Full Name',
      'Email',
      'Role',
      'Total Activities',
      'Active Days',
      'Documents Uploaded',
      'Fields Filled',
      'Documents Reviewed',
      'Documents Approved',
      'Documents Rejected',
      'OCR Processed',
      'Work Hours',
      'Work Minutes'
    ];

    const csvRows = [
      headers.join(','),
      ...performanceData.map(user => [
        user.username,
        user.full_name || '',
        user.email || '',
        user.role,
        user.total_activities,
        user.active_days,
        user.documents_uploaded,
        user.fields_filled,
        user.documents_reviewed,
        user.documents_approved,
        user.documents_rejected,
        user.ocr_processed,
        user.work_hours,
        user.work_minutes
      ].join(','))
    ];

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=performance_report_${start_date}_${end_date}.csv`);
    res.send('\uFEFF' + csv); // Add BOM for Excel compatibility
  } catch (error) {
    next(error);
  }
};

/**
 * Get performance dashboard overview (Admin only)
 */
exports.getDashboardOverview = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Get top performers
    const topPerformers = ActivityLog.getTopPerformers(start_date, end_date, 5);
    
    // Get all users performance
    const allUsersPerformance = ActivityLog.getAllUsersPerformanceData(start_date, end_date);
    
    // Calculate totals
    const totalActivities = allUsersPerformance.reduce((sum, user) => sum + user.total_activities, 0);
    const totalUsers = allUsersPerformance.filter(u => u.total_activities > 0).length;
    const avgActivitiesPerUser = totalUsers > 0 ? (totalActivities / totalUsers).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          total_activities: totalActivities,
          active_users: totalUsers,
          avg_activities_per_user: parseFloat(avgActivitiesPerUser)
        },
        top_performers: topPerformers,
        all_users: allUsersPerformance
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
