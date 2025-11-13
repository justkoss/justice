const { queryAll, queryOne, runQuery } = require('../config/database');

/**
 * ActivityLog Model - Extended with Performance Analytics
 * Uses existing activity_logs table for tracking all user activities
 */
class ActivityLog {
  /**
   * Log an activity
   */
  static create(logData) {
    const {
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      ip_address,
      user_agent,
      metadata = {}
    } = logData;

    const sql = `
      INSERT INTO activity_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        ip_address,
        user_agent,
        metadata,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    const metadataJson = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);

    const result = runQuery(sql, [
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      ip_address || null,
      user_agent || null,
      metadataJson
    ]);

    return result;
  }

  /**
   * Log work session (login/logout)
   */
  static logWorkSession(userId, sessionType, ipAddress = null, userAgent = null) {
    const sql = `
      INSERT INTO work_sessions (user_id, session_type, ip_address, user_agent, timestamp)
      VALUES (?, ?, ?, ?, datetime('now'))
    `;

    return runQuery(sql, [userId, sessionType, ipAddress, userAgent]);
  }

  /**
   * Get activity logs with filters
   */
  static getAll(filters = {}) {
    const {
      user_id,
      entity_type,
      entity_id,
      action,
      date_from,
      date_to,
      limit = 100,
      offset = 0
    } = filters;

    let sql = `
      SELECT 
        al.*,
        u.username,
        u.full_name as user_full_name,
        u.role as user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];

    if (user_id) {
      sql += ' AND al.user_id = ?';
      params.push(user_id);
    }

    if (entity_type) {
      sql += ' AND al.entity_type = ?';
      params.push(entity_type);
    }

    if (entity_id) {
      sql += ' AND al.entity_id = ?';
      params.push(entity_id);
    }

    if (action) {
      sql += ' AND al.action = ?';
      params.push(action);
    }

    if (date_from) {
      sql += ' AND al.created_at >= ?';
      params.push(date_from);
    }

    if (date_to) {
      sql += ' AND al.created_at <= ?';
      params.push(date_to);
    }

    sql += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = queryAll(sql, params);

    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : {}
    }));
  }

  /**
   * Get user activity summary by action type
   */
  static getUserActivitySummary(userId, dateFrom, dateTo) {
    const sql = `
      SELECT 
        action,
        COUNT(*) as count
      FROM activity_logs
      WHERE user_id = ?
        AND created_at >= ?
        AND created_at <= ?
      GROUP BY action
      ORDER BY count DESC
    `;

    return queryAll(sql, [userId, dateFrom, dateTo]);
  }

  /**
   * Get hourly activity distribution (productive hours analysis)
   */
  static getHourlyDistribution(userId, dateFrom, dateTo) {
    const sql = `
      SELECT 
        strftime('%H', created_at) as hour,
        COUNT(*) as activity_count
      FROM activity_logs
      WHERE user_id = ?
        AND created_at >= ?
        AND created_at <= ?
      GROUP BY hour
      ORDER BY hour ASC
    `;

    return queryAll(sql, [userId, dateFrom, dateTo]);
  }

  /**
   * Get daily activity summary
   */
  static getDailyActivity(userId, dateFrom, dateTo) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_activities,
        COUNT(DISTINCT action) as activity_types
      FROM activity_logs
      WHERE user_id = ?
        AND created_at >= ?
        AND created_at <= ?
      GROUP BY date
      ORDER BY date ASC
    `;

    return queryAll(sql, [userId, dateFrom, dateTo]);
  }

  /**
   * Get work sessions for a user
   */
  static getWorkSessions(userId, dateFrom, dateTo) {
    const sql = `
      SELECT 
        id,
        user_id,
        session_type,
        ip_address,
        user_agent,
        timestamp
      FROM work_sessions
      WHERE user_id = ?
        AND timestamp >= ?
        AND timestamp <= ?
      ORDER BY timestamp ASC
    `;

    return queryAll(sql, [userId, dateFrom, dateTo]);
  }

  /**
   * Calculate work hours based on login/logout sessions
   */
  static calculateWorkHours(userId, dateFrom, dateTo) {
    const sessions = this.getWorkSessions(userId, dateFrom, dateTo);
    
    let totalMinutes = 0;
    let loginTime = null;
    
    for (const session of sessions) {
      if (session.session_type === 'login') {
        loginTime = new Date(session.timestamp);
      } else if (session.session_type === 'logout' && loginTime) {
        const logoutTime = new Date(session.timestamp);
        const diffMinutes = (logoutTime - loginTime) / 1000 / 60;
        totalMinutes += diffMinutes;
        loginTime = null;
      }
    }
    
    return {
      total_hours: Math.floor(totalMinutes / 60),
      total_minutes: Math.round(totalMinutes % 60),
      total_minutes_raw: Math.round(totalMinutes)
    };
  }

  /**
   * Get comprehensive performance report for a user
   */
  static getUserPerformanceReport(userId, dateFrom, dateTo) {
    const activities = this.getUserActivitySummary(userId, dateFrom, dateTo);
    const hourlyDist = this.getHourlyDistribution(userId, dateFrom, dateTo);
    const dailyActivity = this.getDailyActivity(userId, dateFrom, dateTo);
    const workHours = this.calculateWorkHours(userId, dateFrom, dateTo);
    
    const totalActivities = activities.reduce((sum, a) => sum + a.count, 0);
    const activeDays = dailyActivity.length;
    
    return {
      user_id: userId,
      date_range: { start: dateFrom, end: dateTo },
      summary: {
        total_activities: totalActivities,
        active_days: activeDays,
        avg_activities_per_day: activeDays > 0 ? (totalActivities / activeDays).toFixed(2) : 0,
        work_hours: workHours
      },
      activities_by_type: activities,
      hourly_distribution: hourlyDist,
      daily_activity: dailyActivity
    };
  }

  /**
   * Get weekly performance comparison for all users
   */
  static getWeeklyComparison(dateFrom, dateTo) {
    const sql = `
      SELECT 
        u.id as user_id,
        u.username,
        u.full_name,
        u.role,
        COUNT(al.id) as total_activities,
        strftime('%W', al.created_at) as week_number,
        strftime('%Y', al.created_at) as year
      FROM users u
      LEFT JOIN activity_logs al ON u.id = al.user_id
        AND al.created_at >= ?
        AND al.created_at <= ?
      WHERE u.status = 'active'
      GROUP BY u.id, week_number, year
      ORDER BY year DESC, week_number DESC, total_activities DESC
    `;

    return queryAll(sql, [dateFrom, dateTo]);
  }

  /**
   * Get monthly performance for all users
   */
  static getMonthlyPerformance(year, month) {
    const sql = `
      SELECT 
        u.id as user_id,
        u.username,
        u.full_name,
        u.role,
        COUNT(al.id) as total_activities,
        COUNT(DISTINCT DATE(al.created_at)) as active_days
      FROM users u
      LEFT JOIN activity_logs al ON u.id = al.user_id
        AND strftime('%Y', al.created_at) = ?
        AND strftime('%m', al.created_at) = ?
      WHERE u.status = 'active'
      GROUP BY u.id
      ORDER BY total_activities DESC
    `;

    return queryAll(sql, [year.toString(), month.toString().padStart(2, '0')]);
  }

  /**
   * Get top performers
   */
  static getTopPerformers(dateFrom, dateTo, limit = 10) {
    const sql = `
      SELECT 
        u.id as user_id,
        u.username,
        u.full_name,
        u.role,
        COUNT(al.id) as total_activities,
        COUNT(DISTINCT DATE(al.created_at)) as active_days,
        ROUND(COUNT(al.id) * 1.0 / COUNT(DISTINCT DATE(al.created_at)), 2) as avg_activities_per_day
      FROM users u
      LEFT JOIN activity_logs al ON u.id = al.user_id
        AND al.created_at >= ?
        AND al.created_at <= ?
      WHERE u.status = 'active' AND al.id IS NOT NULL
      GROUP BY u.id
      ORDER BY total_activities DESC
      LIMIT ?
    `;

    return queryAll(sql, [dateFrom, dateTo, limit]);
  }

  /**
   * Get all users performance data for CSV export
   */
  static getAllUsersPerformanceData(dateFrom, dateTo) {
    const sql = `
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.email,
        u.role,
        COUNT(al.id) as total_activities,
        COUNT(DISTINCT DATE(al.created_at)) as active_days,
        COUNT(DISTINCT CASE WHEN al.action = 'document_upload' THEN al.id END) as documents_uploaded,
        COUNT(DISTINCT CASE WHEN al.action = 'field_update' THEN al.id END) as fields_filled,
        COUNT(DISTINCT CASE WHEN al.action = 'document_review' THEN al.id END) as documents_reviewed,
        COUNT(DISTINCT CASE WHEN al.action = 'document_approve' THEN al.id END) as documents_approved,
        COUNT(DISTINCT CASE WHEN al.action = 'document_reject' THEN al.id END) as documents_rejected,
        COUNT(DISTINCT CASE WHEN al.action = 'ocr_process' THEN al.id END) as ocr_processed
      FROM users u
      LEFT JOIN activity_logs al ON u.id = al.user_id
        AND al.created_at >= ?
        AND al.created_at <= ?
      WHERE u.status = 'active'
      GROUP BY u.id
      ORDER BY total_activities DESC
    `;

    const usersData = queryAll(sql, [dateFrom, dateTo]);
    
    // Add work hours for each user
    return usersData.map(user => {
      const workHours = this.calculateWorkHours(user.id, dateFrom, dateTo);
      return {
        ...user,
        work_hours: workHours.total_hours,
        work_minutes: workHours.total_minutes
      };
    });
  }

  /**
   * Get recent activity (system-wide)
   */
  static getRecent(limit = 20) {
    const sql = `
      SELECT 
        al.*,
        u.username,
        u.full_name as user_full_name,
        u.role as user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `;

    const logs = queryAll(sql, [limit]);
    
    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : {}
    }));
  }

  /**
   * Get activity statistics
   */
  static getStatistics(dateFrom, dateTo) {
    const sql = `
      SELECT 
        COUNT(*) as total_actions,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(DISTINCT entity_id) as affected_entities,
        action,
        COUNT(action) as action_count
      FROM activity_logs
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY action
      ORDER BY action_count DESC
    `;

    return queryAll(sql, [dateFrom, dateTo]);
  }

  /**
   * Delete old activity logs (cleanup)
   */
  static deleteOldLogs(daysToKeep = 90) {
    const sql = `
      DELETE FROM activity_logs
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `;

    return runQuery(sql, [daysToKeep]);
  }
}

module.exports = ActivityLog;
