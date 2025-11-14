const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const ExcelRecord = require('../models/ExcelRecord');
const { authenticate, isSupervisorOrAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * @route   POST /api/verification/upload
 * @desc    Upload Excel file for verification
 * @access  Private (Supervisor, Admin)
 */
router.post('/upload', authenticate, isSupervisorOrAdmin, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }

  try {
    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Excel file is empty'
      });
    }

    // Transform data to match our schema
    const records = data.map(row => ({
      n_serie: row['N serie'] || null,
      bec: row['BEC'] || null,
      type: row['Type'] || null,
      annee_hegire: row['Année Hegire'] || null,
      annee_miladi: row['Année Miladi'] || null,
      nbre_actes: row['Nbre actes'] || 0,
      nbre_actes_anomalie: row['Nbre actes avec anomalie '] || 0,
      numero_actes_anomalie: row["numéro d'actes avec anomalie"] || null
    })).filter(record => record.bec && record.type); // Filter out empty rows

    // Generate batch ID
    const batchId = uuidv4();

    // Save to database
    const result = ExcelRecord.createBatch(records, batchId, req.user.id);

    res.json({
      success: true,
      message: 'Excel file uploaded successfully',
      data: {
        batchId: result.batchId,
        recordCount: result.count
      }
    });
  } catch (error) {
    console.error('Error processing Excel file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process Excel file'
    });
  }
}));

/**
 * @route   GET /api/verification/batches
 * @desc    Get all uploaded batches
 * @access  Private (Supervisor, Admin)
 */
router.get('/batches', authenticate, isSupervisorOrAdmin, asyncHandler(async (req, res) => {
  const batches = ExcelRecord.getAllBatches();

  res.json({
    success: true,
    data: batches
  });
}));

/**
 * @route   GET /api/verification/batch/:batchId
 * @desc    Get records for a specific batch
 * @access  Private (Supervisor, Admin)
 */
router.get('/batch/:batchId', authenticate, isSupervisorOrAdmin, asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const records = ExcelRecord.getByBatchId(batchId);

  res.json({
    success: true,
    data: records
  });
}));

/**
 * @route   GET /api/verification/compare/:batchId
 * @desc    Compare Excel data with database
 * @access  Private (Supervisor, Admin)
 */
router.get('/compare/:batchId', authenticate, isSupervisorOrAdmin, asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const comparison = ExcelRecord.getComparisonData(batchId);

  // Calculate summary
  const summary = {
    total: comparison.length,
    matched: comparison.filter(r => r.status === 'matched').length,
    missing: comparison.filter(r => r.status === 'missing').length,
    extra: comparison.filter(r => r.status === 'extra').length,
    matchRate: comparison.length > 0 
      ? Math.round((comparison.filter(r => r.status === 'matched').length / comparison.length) * 100) 
      : 0
  };

  res.json({
    success: true,
    data: {
      comparison,
      summary
    }
  });
}));

/**
 * @route   DELETE /api/verification/batch/:batchId
 * @desc    Delete a batch
 * @access  Private (Supervisor, Admin)
 */
router.delete('/batch/:batchId', authenticate, isSupervisorOrAdmin, asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  ExcelRecord.deleteBatch(batchId);

  res.json({
    success: true,
    message: 'Batch deleted successfully'
  });
}));

/**
 * @route   GET /api/verification/search-acte/:acteNumber
 * @desc    Search for document by acte number (for desktop app auto-fill)
 * @access  Private
 */
router.get('/search-acte/:acteNumber', authenticate, asyncHandler(async (req, res) => {
  const { acteNumber } = req.params;
  
  const document = ExcelRecord.searchByActeNumber(acteNumber);

  if (document) {
    res.json({
      success: true,
      data: document,
      found: true
    });
  } else {
    res.json({
      success: true,
      data: null,
      found: false
    });
  }
}));

/**
 * @route   GET /api/verification/debug/documents
 * @desc    Debug endpoint to see what's in the database
 * @access  Private (Supervisor, Admin)
 */
router.get('/debug/documents', authenticate, isSupervisorOrAdmin, asyncHandler(async (req, res) => {
  const Document = require('../models/Document');
  
  // Get sample documents
  const documents = Document.findAll({ limit: 20 });
  
  res.json({
    success: true,
    count: documents.documents?.length || 0,
    sample: documents.documents?.slice(0, 5).map(doc => ({
      id: doc.id,
      acte_number: doc.acte_number,
      bureau: doc.bureau,
      registre_type: doc.registre_type,
      year: doc.year,
      registre_number: doc.registre_number
    }))
  });
}));

module.exports = router;