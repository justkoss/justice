const { queryAll, queryOne, runQuery, transaction } = require('../config/database');
const path = require('path');
const fs = require('fs');

class Document {
  /**
   * Create new document record
   */
  static create(documentData) {
    const {
      filename,
      original_filename,
      file_path,
      file_size,
      bureau,
      registre_type,
      year,
      registre_number,
      acte_number,
      uploaded_by,
      desktop_document_id,
      processed_at
    } = documentData;
    
    // Generate virtual path: Bureau/RegistreType/Year/RegistreNumber/ActeNumber.pdf
    const virtual_path = `${bureau}/${registre_type}/${year}/${registre_number}/${acte_number}.pdf`;
    
    const documentId = runQuery(`
      INSERT INTO documents (
        filename, original_filename, file_path, file_size,
        bureau, registre_type, year, registre_number, acte_number,
        uploaded_by, desktop_document_id, processed_at, virtual_path, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      filename, original_filename, file_path, file_size,
      bureau, registre_type, year, registre_number, acte_number,
      uploaded_by, desktop_document_id, processed_at, virtual_path, 'pending'
    ]);
    const debugInfo = queryAll('SELECT * FROM documents ');
    console.log('Current documents in DB:', debugInfo);
    console.log(`Inserted document with ID: ${documentId}`);
    // Log document creation
    this.logHistory(documentId, 'uploaded', uploaded_by, {
      filename: original_filename,
      bureau, registre_type, year, registre_number, acte_number
    });
    
    return this.findById(documentId);
  }
  
  /**
   * Find document by ID
   */
  static findById(id) {
    const sql = `
      SELECT 
        d.*,
        u_uploaded.username as uploaded_by_username,
        u_uploaded.full_name as uploaded_by_name,
        u_reviewed.username as reviewed_by_username,
        u_reviewed.full_name as reviewed_by_name
      FROM documents d
      LEFT JOIN users u_uploaded ON d.uploaded_by = u_uploaded.id
      LEFT JOIN users u_reviewed ON d.reviewed_by = u_reviewed.id
      WHERE d.id = ?
    `;
    
    return queryOne(sql, [id]);
  }
  
  /**
   * Find all documents with filters
   */
  static findAll(filters = {}) {
    let sql = `
      SELECT 
        d.*,
        u_uploaded.username as uploaded_by_username,
        u_uploaded.full_name as uploaded_by_name,
        u_reviewed.username as reviewed_by_username,
        u_reviewed.full_name as reviewed_by_name
      FROM documents d
      LEFT JOIN users u_uploaded ON d.uploaded_by = u_uploaded.id
      LEFT JOIN users u_reviewed ON d.reviewed_by = u_reviewed.id
      WHERE 1=1
    `;
    const params = [];
    
    // Status filter
    if (filters.status) {
      sql += ' AND d.status = ?';
      params.push(filters.status);
    }
    
    // Bureau filter
    if (filters.bureau) {
      sql += ' AND d.bureau = ?';
      params.push(filters.bureau);
    }
    
    // Registre type filter
    if (filters.registre_type) {
      sql += ' AND d.registre_type = ?';
      params.push(filters.registre_type);
    }
    
    // Year filter
    if (filters.year) {
      sql += ' AND d.year = ?';
      params.push(filters.year);
    }
    
    // Uploaded by user
    if (filters.uploaded_by) {
      sql += ' AND d.uploaded_by = ?';
      params.push(filters.uploaded_by);
    }
    
    // Reviewed by user
    if (filters.reviewed_by) {
      sql += ' AND d.reviewed_by = ?';
      params.push(filters.reviewed_by);
    }
    
    // Search in acte number, registre number, or filename
    if (filters.search) {
      sql += ' AND (d.acte_number LIKE ? OR d.registre_number LIKE ? OR d.original_filename LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Date range filter
    if (filters.date_from) {
      sql += ' AND d.uploaded_at >= ?';
      params.push(filters.date_from);
    }
    
    if (filters.date_to) {
      sql += ' AND d.uploaded_at <= ?';
      params.push(filters.date_to);
    }
    
    // Supervisor bureau restriction
    if (filters.supervisor_bureaux && filters.supervisor_bureaux.length > 0) {
      const placeholders = filters.supervisor_bureaux.map(() => '?').join(',');
      sql += ` AND d.bureau IN (${placeholders})`;
      params.push(...filters.supervisor_bureaux);
    }
    
    // Sorting
    const sortBy = filters.sort_by || 'uploaded_at';
    const sortOrder = filters.sort_order || 'DESC';
    sql += ` ORDER BY d.${sortBy} ${sortOrder}`;
    
    // Pagination
    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
      
      if (filters.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }
    }
    
    return queryAll(sql, params);
  }
  
  /**
   * Count documents with filters
   */
  static count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM documents WHERE 1=1';
    const params = [];
    
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.bureau) {
      sql += ' AND bureau = ?';
      params.push(filters.bureau);
    }
    
    if (filters.uploaded_by) {
      sql += ' AND uploaded_by = ?';
      params.push(filters.uploaded_by);
    }
    
    if (filters.supervisor_bureaux && filters.supervisor_bureaux.length > 0) {
      const placeholders = filters.supervisor_bureaux.map(() => '?').join(',');
      sql += ` AND bureau IN (${placeholders})`;
      params.push(...filters.supervisor_bureaux);
    }
    
    const result = queryOne(sql, params);
    return result ? result.count : 0;
  }
  
  /**
   * Update document status to reviewing
   */
  static startReview(documentId, reviewerId) {
    runQuery(`
      UPDATE documents 
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, ['reviewing', reviewerId, documentId]);
    
    this.logHistory(documentId, 'reviewed', reviewerId, { action: 'started_review' });
    
    return this.findById(documentId);
  }
  
  /**
   * Approve document and move to stored
   */
  static approve(documentId, reviewerId, storagePath) {
    runQuery(`
      UPDATE documents 
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, 
          stored_at = CURRENT_TIMESTAMP, file_path = ?
      WHERE id = ?
    `, ['stored', reviewerId, storagePath, documentId]);
    
    this.logHistory(documentId, 'approved', reviewerId, { action: 'approved' });
    
    return this.findById(documentId);
  }
  
  /**
   * Reject document with reason
   */
  static reject(documentId, reviewerId, rejectionData) {
    const { error_type, message } = rejectionData;
    
    runQuery(`
      UPDATE documents 
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP,
          rejection_error_type = ?, rejection_reason = ?
      WHERE id = ?
    `, ['rejected_for_update', reviewerId, error_type, message, documentId]);
    
    this.logHistory(documentId, 'rejected', reviewerId, {
      error_type,
      message
    });
    
    return this.findById(documentId);
  }
  
  /**
   * Re-upload document (replace file)
   */
  static reupload(documentId, newFilePath, newFilename, fileSize) {
    const document = this.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Delete old file
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }
    
    // Update document
    runQuery(`
      UPDATE documents 
      SET file_path = ?, filename = ?, file_size = ?,
          status = 'pending', rejection_error_type = NULL, rejection_reason = NULL,
          reviewed_by = NULL, reviewed_at = NULL
      WHERE id = ?
    `, [newFilePath, newFilename, fileSize, documentId]);
    
    this.logHistory(documentId, 're-uploaded', document.uploaded_by, {
      new_file: newFilename
    });
    
    return this.findById(documentId);
  }
  
  /**
   * Delete document
   */
  static delete(documentId) {
    const document = this.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Delete file
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }
    
    // Delete from database
    runQuery('DELETE FROM documents WHERE id = ?', [documentId]);
    
    return true;
  }
  
  /**
   * Log document history
   */
  static logHistory(documentId, action, performedBy, details = {}) {
    runQuery(`
      INSERT INTO document_history (document_id, action, performed_by, details)
      VALUES (?, ?, ?, ?)
    `, [documentId, action, performedBy, JSON.stringify(details)]);
  }
  
  /**
   * Get document history
   */
  static getHistory(documentId) {
    const sql = `
      SELECT 
        h.*,
        u.username,
        u.full_name,
        u.role
      FROM document_history h
      LEFT JOIN users u ON h.performed_by = u.id
      WHERE h.document_id = ?
      ORDER BY h.created_at DESC
    `;
    
    const history = queryAll(sql, [documentId]);
    
    // Parse details JSON
    return history.map(entry => ({
      ...entry,
      details: entry.details ? JSON.parse(entry.details) : {}
    }));
  }
  
  /**
   * Get document tree structure
   */
  static getTree(filters = {}) {
    let sql = 'SELECT bureau, registre_type, year, registre_number, COUNT(*) as count FROM documents';
    const params = [];
    const conditions = [];
    
    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    
    if (filters.supervisor_bureaux && filters.supervisor_bureaux.length > 0) {
      const placeholders = filters.supervisor_bureaux.map(() => '?').join(',');
      conditions.push(`bureau IN (${placeholders})`);
      params.push(...filters.supervisor_bureaux);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' GROUP BY bureau, registre_type, year, registre_number ORDER BY bureau, registre_type, year, registre_number';
    
    return queryAll(sql, params);
  }
  
  /**
   * Get statistics
   */
  static getStats(filters = {}) {
    let baseCondition = '1=1';
    const params = [];
    
    if (filters.supervisor_bureaux && filters.supervisor_bureaux.length > 0) {
      const placeholders = filters.supervisor_bureaux.map(() => '?').join(',');
      baseCondition += ` AND bureau IN (${placeholders})`;
      params.push(...filters.supervisor_bureaux);
    }
    
    const stats = {
      total: queryOne(`SELECT COUNT(*) as count FROM documents WHERE ${baseCondition}`, params)?.count || 0,
      pending: queryOne(`SELECT COUNT(*) as count FROM documents WHERE ${baseCondition} AND status = 'pending'`, params)?.count || 0,
      reviewing: queryOne(`SELECT COUNT(*) as count FROM documents WHERE ${baseCondition} AND status = 'reviewing'`, params)?.count || 0,
      rejected: queryOne(`SELECT COUNT(*) as count FROM documents WHERE ${baseCondition} AND status = 'rejected_for_update'`, params)?.count || 0,
      stored: queryOne(`SELECT COUNT(*) as count FROM documents WHERE ${baseCondition} AND status = 'stored'`, params)?.count || 0
    };
    
    return stats;
  }

  /**
   * Update document status
   */
  static updateStatus(documentId, newStatus) {
    const validStatuses = ['pending', 'reviewing', 'rejected_for_update', 'stored', 'processing', 'fields_extracted'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    runQuery(`
      UPDATE documents 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, documentId]);

    return this.findById(documentId);
  }

  /**
   * Get documents by status (updated to include new statuses)
   */
  static getByStatus(status, filters = {}) {
    const params = [status];
    let sql = `
      SELECT 
        d.*,
        u_uploaded.username as uploaded_by_username,
        u_uploaded.full_name as uploaded_by_name
      FROM documents d
      LEFT JOIN users u_uploaded ON d.uploaded_by = u_uploaded.id
      WHERE d.status = ?
    `;

    if (filters.bureau) {
      sql += ' AND d.bureau = ?';
      params.push(filters.bureau);
    }

    if (filters.supervisor_bureaux && filters.supervisor_bureaux.length > 0) {
      const placeholders = filters.supervisor_bureaux.map(() => '?').join(',');
      sql += ` AND d.bureau IN (${placeholders})`;
      params.push(...filters.supervisor_bureaux);
    }

    sql += ' ORDER BY d.uploaded_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    return queryAll(sql, params);
  }

  /**
   * Get statistics (updated to include new statuses)
   */
  static getStats(filters = {}) {
    let baseCondition = '1=1';
    const params = [];
    
    if (filters.supervisor_bureaux && filters.supervisor_bureaux.length > 0) {
      const placeholders = filters.supervisor_bureaux.map(() => '?').join(',');
      baseCondition += ` AND bureau IN (${placeholders})`;
      params.push(...filters.supervisor_bureaux);
    }
    
    const stats = {
      total: queryOne(`SELECT COUNT(*) as count FROM documents WHERE ${baseCondition}`, params)?.count || 0,
      pending: queryOne(`SELECT COUNT(*) as count FROM documents WHERE ${baseCondition} AND status = 'pending'`, params)?.count || 0,
      reviewing: queryOne(`SELECT COUNT(*) as count FROM documents WHERE ${baseCondition} AND status = 'reviewing'`, params)?.count || 0,
      rejected: queryOne(`SELECT COUNT(*) as count FROM documents WHERE ${baseCondition} AND status = 'rejected_for_update'`, params)?.count || 0,
      stored: queryOne(`SELECT COUNT(*) as count FROM documents WHERE ${baseCondition} AND status = 'stored'`, params)?.count || 0,
      processing: queryOne(`SELECT COUNT(*) as count FROM documents WHERE ${baseCondition} AND status = 'processing'`, params)?.count || 0,
      fields_extracted: queryOne(`SELECT COUNT(*) as count FROM documents WHERE ${baseCondition} AND status = 'fields_extracted'`, params)?.count || 0
    };
    
    return stats;
  }

}

module.exports = Document;
