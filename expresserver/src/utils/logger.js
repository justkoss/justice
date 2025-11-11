const ActivityLog = require('../models/ActivityLog');

/**
 * Centralized logging utility
 * Use this to log any action in the system
 */

/**
 * Main logging function - use this from any controller
 * @param {Object} req - Express request object (to get user, ip, user-agent)
 * @param {string} action - Action identifier (e.g., 'document_uploaded', 'user_created')
 * @param {string} entityType - Type of entity (e.g., 'document', 'user', 'system')
 * @param {number|null} entityId - ID of the entity affected (optional)
 * @param {string} details - Human-readable details about the action (optional)
 * @param {Object} metadata - Additional structured data (optional)
 */
function log(req, action, entityType, entityId = null, details = '', metadata = {}) {
  try {
    // Ensure we have a user
    if (!req.user || !req.user.id) {
      console.warn('Attempted to log action without authenticated user:', action);
      return null;
    }

    // Get IP and user agent from request
    const ip_address = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const user_agent = req.get('user-agent') || '';

    // Create log entry
    const logId = ActivityLog.create({
      user_id: req.user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address,
      user_agent,
      metadata: metadata || {}
    });

    console.log(`📝 Log: ${action} by ${req.user.username} (ID: ${logId})`);
    return logId;

  } catch (error) {
    console.error('Error creating activity log:', error);
    // Don't throw error - logging should never break the main flow
    return null;
  }
}

/**
 * Pre-defined logging functions for common actions
 * These provide consistency in action naming
 */

// ==================== DOCUMENT ACTIONS ====================

function logDocumentUpload(req, documentId, details = '') {
  return log(req, 'document_uploaded', 'document', documentId, details);
}

function logDocumentReviewStart(req, documentId, details = '') {
  return log(req, 'document_reviewed_started', 'document', documentId, details);
}

function logDocumentApprove(req, documentId, details = '', metadata = {}) {
  return log(req, 'document_approved', 'document', documentId, details, metadata);
}

function logDocumentReject(req, documentId, reason, metadata = {}) {
  return log(req, 'document_rejected', 'document', documentId, reason, metadata);
}

function logDocumentProcessingStart(req, documentId, details = '') {
  return log(req, 'document_processing_started', 'document', documentId, details);
}

function logDocumentProcessingComplete(req, documentId, details = '', metadata = {}) {
  return log(req, 'document_processing_completed', 'document', documentId, details, metadata);
}

function logDocumentView(req, documentId) {
  return log(req, 'document_viewed', 'document', documentId);
}

function logDocumentDownload(req, documentId, filename = '') {
  return log(req, 'document_downloaded', 'document', documentId, `Downloaded: ${filename}`);
}

function logDocumentUpdate(req, documentId, details = '', metadata = {}) {
  return log(req, 'document_updated', 'document', documentId, details, metadata);
}

function logDocumentDelete(req, documentId, details = '') {
  return log(req, 'document_deleted', 'document', documentId, details);
}

function logDocumentFieldsExtracted(req, documentId, fieldCount = 0) {
  return log(req, 'document_fields_extracted', 'document', documentId, 
    `Extracted ${fieldCount} fields`, { fieldCount });
}

function logDocumentFieldsSaved(req, documentId, fieldCount = 0) {
  return log(req, 'document_fields_saved', 'document', documentId, 
    `Saved ${fieldCount} fields`, { fieldCount });
}

// ==================== USER ACTIONS ====================

function logUserCreate(req, userId, username) {
  return log(req, 'user_created', 'user', userId, `Created user: ${username}`);
}

function logUserUpdate(req, userId, username, changes = {}) {
  return log(req, 'user_updated', 'user', userId, `Updated user: ${username}`, changes);
}

function logUserDelete(req, userId, username) {
  return log(req, 'user_deleted', 'user', userId, `Deleted user: ${username}`);
}

function logUserLogin(req, userId, username) {
  return log(req, 'user_login', 'user', userId, `User logged in: ${username}`);
}

function logUserLogout(req, userId, username) {
  return log(req, 'user_logout', 'user', userId, `User logged out: ${username}`);
}

function logUserPasswordChange(req, userId, username) {
  return log(req, 'user_password_changed', 'user', userId, `Password changed for: ${username}`);
}

function logUserBureauAssign(req, userId, username, bureaux = []) {
  return log(req, 'user_bureaux_assigned', 'user', userId, 
    `Assigned bureaux to: ${username}`, { bureaux });
}

// ==================== SEARCH ACTIONS ====================

function logSearch(req, query, filters = {}, resultCount = 0) {
  return log(req, 'search_performed', 'system', null, 
    `Searched: ${query}`, { query, filters, resultCount });
}

// ==================== SYSTEM ACTIONS ====================

function logSystemAction(req, action, details = '', metadata = {}) {
  return log(req, action, 'system', null, details, metadata);
}

// ==================== AUTHENTICATION ACTIONS ====================

function logAuthFailure(username, reason, ip, userAgent) {
  try {
    // For failed auth, we don't have req.user, so we create a special log
    ActivityLog.create({
      user_id: null, // No user for failed auth
      action: 'auth_failure',
      entity_type: 'system',
      entity_id: null,
      details: `Failed login attempt for: ${username}. Reason: ${reason}`,
      ip_address: ip,
      user_agent: userAgent,
      metadata: { username, reason }
    });
  } catch (error) {
    console.error('Error logging auth failure:', error);
  }
}

/**
 * Express middleware to automatically log all requests (optional)
 * Add this to routes where you want automatic logging
 * 
 * Example usage in routes:
 * router.post('/api/documents/:id/approve', auth, autoLog('document_approved'), approveDocument);
 */
function autoLog(action, entityType = 'unknown') {
  return (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Only log if request was successful
      if (data.success !== false && res.statusCode < 400) {
        // Try to extract entity ID from response or params
        const entityId = data.id || 
                        data.document?.id || 
                        data.user?.id || 
                        req.params.id || 
                        req.params.documentId ||
                        req.params.userId ||
                        null;
        
        log(req, action, entityType, entityId);
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

module.exports = {
  // Core logging function
  log,
  
  // Document actions
  logDocumentUpload,
  logDocumentReviewStart,
  logDocumentApprove,
  logDocumentReject,
  logDocumentProcessingStart,
  logDocumentProcessingComplete,
  logDocumentView,
  logDocumentDownload,
  logDocumentUpdate,
  logDocumentDelete,
  logDocumentFieldsExtracted,
  logDocumentFieldsSaved,
  
  // User actions
  logUserCreate,
  logUserUpdate,
  logUserDelete,
  logUserLogin,
  logUserLogout,
  logUserPasswordChange,
  logUserBureauAssign,
  
  // Search actions
  logSearch,
  
  // System actions
  logSystemAction,
  
  // Auth actions
  logAuthFailure,
  
  // Middleware
  autoLog
};
