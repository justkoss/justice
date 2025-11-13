const { getDb, saveDatabase } = require('../config/database');

class Inventory {

  /**
   * Insert inventory records in batch
   */
  static async insertBatch(records, batchId, uploadedBy) {
    const db = getDb();
    
    const sql = `
      INSERT INTO inventory (
        bureau, registre_type, year, registre_number, 
        acte_number, upload_batch_id, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const stmt = db.prepare(sql);
    
    for (const record of records) {
      stmt.run([
        record.bureau,
        record.registreType,
        record.year,
        record.registreNumber,
        record.acteNumber,
        batchId,
        uploadedBy
      ]);
    }
    
    stmt.free();
    saveDatabase();
  }

  /**
   * Get all inventory records
   */
  static async getAll(filters = {}) {
    const db = getDb();
    let sql = 'SELECT * FROM inventory WHERE 1=1';
    const params = [];

    if (filters.batchId) {
      sql += ' AND upload_batch_id = ?';
      params.push(filters.batchId);
    }

    if (filters.bureau) {
      sql += ' AND bureau = ?';
      params.push(filters.bureau);
    }

    if (filters.registreType) {
      sql += ' AND registre_type = ?';
      params.push(filters.registreType);
    }

    if (filters.year) {
      sql += ' AND year = ?';
      params.push(filters.year);
    }

    sql += ' ORDER BY bureau, registre_type, year, registre_number, acte_number';

    const stmt = db.prepare(sql);
    stmt.bind(params); // ✅ this just sets the params

    const records = [];

    while (stmt.step()) {
      records.push(stmt.getAsObject());
    }

    stmt.free();
    return records;
  }


  /**
   * Get inventory batches
   */
  static async getBatches(uploadedBy = null) {
    const db = getDb();
    
    let sql = `
      SELECT 
        upload_batch_id,
        COUNT(*) as record_count,
        MIN(uploaded_at) as uploaded_at,
        uploaded_by,
        u.username as uploaded_by_username
      FROM inventory i
      LEFT JOIN users u ON i.uploaded_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (uploadedBy) {
      sql += ' AND i.uploaded_by = ?';
      params.push(uploadedBy);
    }
    
    sql += `
      GROUP BY upload_batch_id, uploaded_by, u.username
      ORDER BY uploaded_at DESC
    `;
    
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const batches = [];

    while (stmt.step()) {
      batches.push(stmt.getAsObject());
    }

    stmt.free();
    return batches;
  }

  /**
   * Get inventory by batch ID
   */
  static async getByBatchId(batchId) {
    const db = getDb();
    
    const sql = `
      SELECT * FROM inventory
      WHERE upload_batch_id = ?
      ORDER BY bureau, registre_type, year, registre_number, acte_number
    `;
    
    const stmt = db.prepare(sql);
    stmt.bind(batchId);
    const batches = [];

    while (stmt.step()) {
      batches.push(stmt.getAsObject());
    }

    stmt.free();
    return batches;
  }

  /**
   * Delete inventory batch
   */
  static async deleteBatch(batchId, userId) {
    const db = getDb();
    
    // Check if batch exists and user has permission
    const checkSql = `
      SELECT uploaded_by FROM inventory 
      WHERE upload_batch_id = ? 
      LIMIT 1
    `;
    
    const checkStmt = db.prepare(checkSql);
    checkStmt.bind([batchId]);
    
    if (!checkStmt.step()) {
      checkStmt.free();
      throw new Error('Batch not found');
    }
    
    const uploadedBy = checkStmt.getAsObject().uploaded_by;
    checkStmt.free();
    
    // Delete the batch
    const deleteSql = 'DELETE FROM inventory WHERE upload_batch_id = ?';
    const stmt = db.prepare(deleteSql);
    stmt.run([batchId]);
    stmt.free();
    
    saveDatabase();
    return true;
  }

  /**
   * Get inventory statistics
   */
  static async getStats(batchId = null) {
    const db = getDb();
    
    let sql = `
      SELECT 
        COUNT(DISTINCT bureau) as total_bureaux,
        COUNT(DISTINCT registre_type) as total_types,
        COUNT(DISTINCT year) as total_years,
        COUNT(DISTINCT registre_number) as total_registres,
        COUNT(*) as total_actes
      FROM inventory
      WHERE 1=1
    `;
    
    const params = [];
    
    if (batchId) {
      sql += ' AND upload_batch_id = ?';
      params.push(batchId);
    }
    
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    const stats = stmt.getAsObject();
    stmt.free();
    return stats;
  }
}

module.exports = Inventory;
