const { queryAll, queryOne, runQuery } = require('../config/database');

class ExcelRecord {
  /**
   * Create multiple excel records from batch
   */
  static createBatch(records, batchId, uploadedBy) {
    const stmt = `
      INSERT INTO excel_records (
        batch_id, n_serie, bec, type, annee_hegire, annee_miladi,
        nbre_actes, nbre_actes_anomalie, numero_actes_anomalie, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    records.forEach(record => {
      runQuery(stmt, [
        batchId,
        record.n_serie,
        record.bec,
        record.type,
        record.annee_hegire,
        record.annee_miladi,
        record.nbre_actes,
        record.nbre_actes_anomalie,
        record.numero_actes_anomalie,
        uploadedBy
      ]);
    });

    return { batchId, count: records.length };
  }

  /**
   * Get all batches with summary
   */
  static getAllBatches() {
    return queryAll(`
      SELECT 
        batch_id,
        COUNT(*) as record_count,
        uploaded_by,
        MIN(uploaded_at) as uploaded_at,
        u.username as uploaded_by_username,
        u.full_name as uploaded_by_name
      FROM excel_records er
      LEFT JOIN users u ON er.uploaded_by = u.id
      GROUP BY batch_id
      ORDER BY uploaded_at DESC
    `);
  }

  /**
   * Get records by batch ID
   */
  static getByBatchId(batchId) {
    return queryAll(`
      SELECT * FROM excel_records
      WHERE batch_id = ?
      ORDER BY id
    `, [batchId]);
  }

  /**
   * Delete batch
   */
  static deleteBatch(batchId) {
    runQuery('DELETE FROM excel_records WHERE batch_id = ?', [batchId]);
    return true;
  }

  /**
   * Get comparison data (Excel vs Database)
   */
  static getComparisonData(batchId) {
    const excelRecords = queryAll(`
      SELECT 
        bec,
        type,
        annee_miladi,
        SUM(nbre_actes) as expected_count
      FROM excel_records
      WHERE batch_id = ?
      GROUP BY bec, type, annee_miladi
    `, [batchId]);

    const results = excelRecords.map(record => {
      // Get actual count from documents table
      const actual = queryOne(`
        SELECT COUNT(*) as actual_count
        FROM documents
        WHERE bureau = ?
        AND registre_type = ?
        AND year = ?
        AND status IN ('stored', 'processing', 'fields_extracted')
      `, [record.bec, record.type, record.annee_miladi]);

      return {
        bec: record.bec,
        type: record.type,
        year: record.annee_miladi,
        expected: record.expected_count,
        actual: actual ? actual.actual_count : 0,
        difference: (actual ? actual.actual_count : 0) - record.expected_count,
        status: (actual ? actual.actual_count : 0) === record.expected_count ? 'matched' : 
                (actual ? actual.actual_count : 0) < record.expected_count ? 'missing' : 'extra'
      };
    });

    return results;
  }

  /**
   * Search by acte number for desktop app auto-fill
   * Searches in excel_records table (official inventory) NOT documents table
   * Handles multi-value acte numbers like "N5466$N3221$N7890" or "N5466,N3221,N7890"
   */
  static searchByActeNumber(acteNumber) {
    // Clean the input - remove spaces and convert to uppercase
    const cleanActe = acteNumber.trim().toUpperCase();
    
    if (!cleanActe) {
      return null;
    }

    // Search in excel_records table where numero_actes_anomalie contains the acte number
    // The field can contain multiple acte numbers separated by $ or ,
    // Examples: "N5466", "N5466$N3221", "N3221$N5466$N7890", "N5466,N3221,N7890"
    
    // Strategy: Use LIKE with multiple patterns to match:
    // 1. Exact match: "N5466"
    // 2. At start with separator: "N5466$..." or "N5466,..."
    // 3. In middle with separators: "...$N5466$..." or "...,N5466,..."
    // 4. At end with separator: "...$N5466" or "...,N5466"
    
    const record = queryOne(`
      SELECT 
        bec as bureau,
        type as registre_type,
        annee_miladi as year,
        n_serie as registre_number,
        batch_id,
        nbre_actes,
        numero_actes_anomalie
      FROM excel_records
      WHERE UPPER(numero_actes_anomalie) = ?
         OR UPPER(numero_actes_anomalie) LIKE ?
         OR UPPER(numero_actes_anomalie) LIKE ?
         OR UPPER(numero_actes_anomalie) LIKE ?
         OR UPPER(numero_actes_anomalie) LIKE ?
         OR UPPER(numero_actes_anomalie) LIKE ?
         OR UPPER(numero_actes_anomalie) LIKE ?
      LIMIT 1
    `, [
      cleanActe,                    // Exact match: "N5466"
      `${cleanActe}$%`,             // Start with $: "N5466$..."
      `${cleanActe},%`,             // Start with ,: "N5466,..."
      `%$${cleanActe}$%`,           // Middle with $: "...$N5466$..."
      `%,${cleanActe},%`,           // Middle with ,: "...,N5466,..."
      `%$${cleanActe}`,             // End with $: "...$N5466"
      `%,${cleanActe}`              // End with ,: "...,N5466"
    ]);

    if (record) {
      // Return only the fields needed for auto-fill
      return {
        bureau: record.bureau,
        registre_type: record.registre_type,
        year: record.year,
        registre_number: record.registre_number
      };
    }

    // If no match with exact format, try more flexible search
    // Remove special characters and try again (handles format variations)
    const alphanumericOnly = cleanActe.replace(/[^A-Z0-9]/g, '');
    
    if (alphanumericOnly && alphanumericOnly !== cleanActe) {
      const flexibleRecord = queryOne(`
        SELECT 
          bec as bureau,
          type as registre_type,
          annee_miladi as year,
          n_serie as registre_number
        FROM excel_records
        WHERE REPLACE(REPLACE(REPLACE(UPPER(numero_actes_anomalie), '$', ''), ',', ''), ' ', '') LIKE ?
        LIMIT 1
      `, [`%${alphanumericOnly}%`]);

      if (flexibleRecord) {
        return {
          bureau: flexibleRecord.bureau,
          registre_type: flexibleRecord.registre_type,
          year: flexibleRecord.year,
          registre_number: flexibleRecord.registre_number
        };
      }
    }

    return null;
  }
}

module.exports = ExcelRecord;