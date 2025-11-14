const { queryAll, queryOne, runQuery } = require('../config/database');

class MarginalMention {
  /**
   * Create a new marginal mention
   */
  static create(mentionData) {
    const {
      document_id,
      mention_type,
      mention_date,
      mention_text,
      civil_officer_signature,
      person_first_name,
      person_last_name,
      officer_title,
      changes_occurred,
      change_description,
      created_by
    } = mentionData;

    const id = runQuery(`
      INSERT INTO marginal_mentions (
        document_id, mention_type, mention_date, mention_text,
        civil_officer_signature, person_first_name, person_last_name,
        officer_title, changes_occurred, change_description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      document_id, mention_type, mention_date, mention_text,
      civil_officer_signature ? 1 : 0, person_first_name, person_last_name,
      officer_title, changes_occurred, change_description, created_by
    ]);

    return this.findById(id);
  }

  /**
   * Find marginal mention by ID
   */
  static findById(id) {
    return queryOne(`
      SELECT 
        mm.*,
        u.username as created_by_username,
        u.full_name as created_by_name
      FROM marginal_mentions mm
      LEFT JOIN users u ON mm.created_by = u.id
      WHERE mm.id = ?
    `, [id]);
  }

  /**
   * Get all marginal mentions for a document
   */
  static findByDocumentId(documentId) {
    return queryAll(`
      SELECT 
        mm.*,
        u.username as created_by_username,
        u.full_name as created_by_name
      FROM marginal_mentions mm
      LEFT JOIN users u ON mm.created_by = u.id
      WHERE mm.document_id = ?
      ORDER BY mm.created_at DESC
    `, [documentId]);
  }

  /**
   * Update a marginal mention
   */
  static update(id, mentionData) {
    const {
      mention_type,
      mention_date,
      mention_text,
      civil_officer_signature,
      person_first_name,
      person_last_name,
      officer_title,
      changes_occurred,
      change_description
    } = mentionData;

    runQuery(`
      UPDATE marginal_mentions 
      SET mention_type = ?, mention_date = ?, mention_text = ?,
          civil_officer_signature = ?, person_first_name = ?, person_last_name = ?,
          officer_title = ?, changes_occurred = ?, change_description = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      mention_type, mention_date, mention_text,
      civil_officer_signature ? 1 : 0, person_first_name, person_last_name,
      officer_title, changes_occurred, change_description, id
    ]);

    return this.findById(id);
  }

  /**
   * Delete a marginal mention
   */
  static delete(id) {
    runQuery('DELETE FROM marginal_mentions WHERE id = ?', [id]);
    return true;
  }

  /**
   * Delete all marginal mentions for a document
   */
  static deleteByDocumentId(documentId) {
    runQuery('DELETE FROM marginal_mentions WHERE document_id = ?', [documentId]);
    return true;
  }

  /**
   * Count marginal mentions for a document
   */
  static countByDocumentId(documentId) {
    const result = queryOne(
      'SELECT COUNT(*) as count FROM marginal_mentions WHERE document_id = ?',
      [documentId]
    );
    return result ? result.count : 0;
  }
}

module.exports = MarginalMention;
