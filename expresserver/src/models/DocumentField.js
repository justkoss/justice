const { queryAll, queryOne, runQuery, transaction } = require('../config/database');

class DocumentField {
  /**
   * Get all fields for a document
   */
  static getByDocumentId(documentId) {
    const sql = `
      SELECT 
        df.*,
        u.username as updated_by_username,
        u.full_name as updated_by_name
      FROM document_fields df
      LEFT JOIN users u ON df.updated_by = u.id
      WHERE df.document_id = ?
      ORDER BY df.field_order ASC, df.id ASC
    `;
    
    return queryAll(sql, [documentId]);
  }

  /**
   * Get fields as key-value object
   */
  static getFieldsAsObject(documentId) {
    const fields = this.getByDocumentId(documentId);
    const result = {};
    
    fields.forEach(field => {
      result[field.field_name] = field.field_value;
    });
    
    return result;
  }

  /**
   * Save or update multiple fields for a document
   * @param {number} documentId 
   * @param {Array} fields - Array of {field_name, field_value, field_type, field_order}
   * @param {number} userId - User making the change
   */
  static saveFields(documentId, fields, userId) {
    return transaction(() => {
      // Delete existing fields for this document
      runQuery('DELETE FROM document_fields WHERE document_id = ?', [documentId]);
      
      // Insert new fields
      fields.forEach((field, index) => {
        runQuery(`
          INSERT INTO document_fields (
            document_id, 
            field_name, 
            field_value, 
            field_type,
            field_order,
            updated_by,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          documentId,
          field.field_name,
          field.field_value || '',
          field.field_type || 'text',
          field.field_order !== undefined ? field.field_order : index,
          userId
        ]);
      });
    });
  }

  /**
   * Update a single field
   */
  static updateField(documentId, fieldName, fieldValue, userId) {
    const existing = queryOne(
      'SELECT id FROM document_fields WHERE document_id = ? AND field_name = ?',
      [documentId, fieldName]
    );

    if (existing) {
      runQuery(`
        UPDATE document_fields 
        SET field_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE document_id = ? AND field_name = ?
      `, [fieldValue, userId, documentId, fieldName]);
    } else {
      runQuery(`
        INSERT INTO document_fields (
          document_id, field_name, field_value, updated_by
        ) VALUES (?, ?, ?, ?)
      `, [documentId, fieldName, fieldValue, userId]);
    }
  }

  /**
   * Delete all fields for a document
   */
  static deleteByDocumentId(documentId) {
    runQuery('DELETE FROM document_fields WHERE document_id = ?', [documentId]);
  }

  /**
   * Check if document has fields
   */
  static hasFields(documentId) {
    const result = queryOne(
      'SELECT COUNT(*) as count FROM document_fields WHERE document_id = ?',
      [documentId]
    );
    return result ? result.count > 0 : false;
  }

  /**
   * Get field history (from document_history)
   */
  static getFieldHistory(documentId) {
    const sql = `
      SELECT 
        h.*,
        u.username,
        u.full_name
      FROM document_history h
      LEFT JOIN users u ON h.performed_by = u.id
      WHERE h.document_id = ? 
        AND h.action IN ('fields_extracted', 'fields_updated', 'fields_submitted')
      ORDER BY h.created_at DESC
    `;
    
    return queryAll(sql, [documentId]);
  }

  /**
   * Search documents by field values (for future elasticsearch integration)
   */
  static searchByFields(query, filters = {}) {
    let sql = `
      SELECT DISTINCT d.*, COUNT(df.id) as field_match_count
      FROM documents d
      INNER JOIN document_fields df ON d.id = df.document_id
      WHERE df.field_value LIKE ?
    `;
    const params = [`%${query}%`];

    if (filters.bureau) {
      sql += ' AND d.bureau = ?';
      params.push(filters.bureau);
    }

    if (filters.registre_type) {
      sql += ' AND d.registre_type = ?';
      params.push(filters.registre_type);
    }

    if (filters.year) {
      sql += ' AND d.year = ?';
      params.push(filters.year);
    }

    sql += ' GROUP BY d.id ORDER BY field_match_count DESC LIMIT 50';

    return queryAll(sql, params);
  }
}

module.exports = DocumentField;
