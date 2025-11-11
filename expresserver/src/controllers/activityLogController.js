const ActivityLog = require('../models/ActivityLog');

/**
 * Log an activity
 * POST /api/activity-logs
 */
async function logActivity(req, res) {
  try {
    const {
      action,
      entity_type,
      entity_id,
      details,
      metadata
    } = req.body;

    // Validate required fields
    if (!action || !entity_type) {
      return res.status(400).json({
        success: false,
        message: 'Action and entity_type are required'
      });
    }

    // Get IP and user agent from request
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('user-agent');

    // Create log entry
    const logId = ActivityLog.create({
      user_id: req.user.id,
      action,
      entity_type,
      entity_id,
      details,
      ip_address,
      user_agent,
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      logId
    });

  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log activity',
      error: error.message
    });
  }
}

/**
 * Get activity logs with filters
 * GET /api/activity-logs
 */
async function getActivityLogs(req, res) {
  try {
    const {
      user_id,
      entity_type,
      entity_id,
      action,
      date_from,
      date_to,
      limit = 100,
      offset = 0
    } = req.query;

    // Role-based access control
    let filters = {
      limit: Math.min(parseInt(limit), 500), // Max 500 records
      offset: parseInt(offset) || 0
    };

    // Admins can see all logs
    if (req.user.role === 'admin') {
      if (user_id) filters.user_id = parseInt(user_id);
      if (entity_type) filters.entity_type = entity_type;
      if (entity_id) filters.entity_id = parseInt(entity_id);
      if (action) filters.action = action;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;
    } else {
      // Non-admins can only see their own logs
      filters.user_id = req.user.id;
      if (entity_type) filters.entity_type = entity_type;
      if (entity_id) filters.entity_id = parseInt(entity_id);
      if (action) filters.action = action;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;
    }

    const logs = ActivityLog.getAll(filters);

    res.json({
      success: true,
      logs,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: logs.length
      }
    });

  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
}

/**
 * Get activity logs for a specific document
 * GET /api/activity-logs/document/:documentId
 */
async function getDocumentHistory(req, res) {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }

    const logs = ActivityLog.getDocumentHistory(parseInt(documentId));

    res.json({
      success: true,
      logs,
      count: logs.length
    });

  } catch (error) {
    console.error('Get document history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document history',
      error: error.message
    });
  }
}

/**
 * Get user activity summary
 * GET /api/activity-logs/user/:userId/summary
 */
async function getUserActivitySummary(req, res) {
  try {
    const { userId } = req.params;
    const { date_from, date_to } = req.query;

    // Role-based access control
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: 'date_from and date_to are required'
      });
    }

    const summary = ActivityLog.getUserActivitySummary(
      parseInt(userId),
      date_from,
      date_to
    );

    res.json({
      success: true,
      summary,
      period: {
        from: date_from,
        to: date_to
      }
    });

  } catch (error) {
    console.error('Get user activity summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity summary',
      error: error.message
    });
  }
}

/**
 * Get recent activity (system-wide)
 * GET /api/activity-logs/recent
 */
async function getRecentActivity(req, res) {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { limit = 20 } = req.query;
    const logs = ActivityLog.getRecent(Math.min(parseInt(limit), 100));

    res.json({
      success: true,
      logs
    });

  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message
    });
  }
}

/**
 * Get activity statistics
 * GET /api/activity-logs/statistics
 */
async function getActivityStatistics(req, res) {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { date_from, date_to } = req.query;

    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: 'date_from and date_to are required'
      });
    }

    const statistics = ActivityLog.getStatistics(date_from, date_to);

    res.json({
      success: true,
      statistics,
      period: {
        from: date_from,
        to: date_to
      }
    });

  } catch (error) {
    console.error('Get activity statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
}

/**
 * Helper function to log document actions
 * Can be called from other controllers
 */
function logDocumentAction(userId, action, documentId, details = '', metadata = {}) {
  try {
    return ActivityLog.create({
      user_id: userId,
      action,
      entity_type: 'document',
      entity_id: documentId,
      details,
      metadata
    });
  } catch (error) {
    console.error('Error logging document action:', error);
    return null;
  }
}

/**
 * Helper function to log user actions
 */
function logUserAction(userId, action, targetUserId, details = '', metadata = {}) {
  try {
    return ActivityLog.create({
      user_id: userId,
      action,
      entity_type: 'user',
      entity_id: targetUserId,
      details,
      metadata
    });
  } catch (error) {
    console.error('Error logging user action:', error);
    return null;
  }
}

module.exports = {
  logActivity,
  getActivityLogs,
  getDocumentHistory,
  getUserActivitySummary,
  getRecentActivity,
  getActivityStatistics,
  logDocumentAction,
  logUserAction
};
