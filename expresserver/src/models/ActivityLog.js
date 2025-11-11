const { query, queryOne, queryAll, runQuery } = require('../config/database');

/**
 * ActivityLog Model
 * Tracks all user actions in the system
 */
class ActivityLog {
  /**
   * Log an activity
   * @param {Object} logData - Activity data
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

    return result ? result.lastID : null;
  }

  /**
   * Get activity logs with filters
   * @param {Object} filters - Filter options
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

    // Parse metadata JSON
    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : {}
    }));
  }

  /**
   * Get activity logs for a specific document
   * @param {number} documentId - Document ID
   */
  static getDocumentHistory(documentId) {
    const sql = `
      SELECT 
        al.*,
        u.username,
        u.full_name as user_full_name,
        u.role as user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = 'document' AND al.entity_id = ?
      ORDER BY al.created_at DESC
    `;

    const logs = queryAll(sql, [documentId]);
    
    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : {}
    }));
  }

  /**
   * Get user activity summary
   * @param {number} userId - User ID
   * @param {string} dateFrom - Start date
   * @param {string} dateTo - End date
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
   * Get recent activity (system-wide)
   * @param {number} limit - Number of records
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
   * @param {string} dateFrom - Start date
   * @param {string} dateTo - End date
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
   * @param {number} daysToKeep - Number of days to keep
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
