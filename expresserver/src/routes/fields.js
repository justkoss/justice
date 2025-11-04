const express = require('express');
const router = express.Router();
const DocumentField = require('../models/DocumentField');
const Document = require('../models/Document');
const { authenticate, isSupervisorOrAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const fs = require('fs');
const path = require('path');

/**
 * @route   GET /api/documents/:id/fields
 * @desc    Get all extracted fields for a document
 * @access  Private (Supervisor, Admin)
 */
router.get('/:id/fields', authenticate, isSupervisorOrAdmin, asyncHandler(async (req, res) => {
  const documentId = parseInt(req.params.id);
  
  // Check if document exists
  const document = Document.findById(documentId);
  if (!document) {
    return res.status(404).json({
      success: false,
      error: 'Document not found'
    });
  }

  // Get fields
  const fields = DocumentField.getByDocumentId(documentId);
  const fieldsObject = DocumentField.getFieldsAsObject(documentId);

  res.json({
    success: true,
    data: {
      fields: fields,
      fieldsObject: fieldsObject,
      hasFields: fields.length > 0,
      lastUpdated: fields.length > 0 ? fields[0].updated_at : null
    }
  });
}));

/**
 * @route   POST /api/documents/:id/fields
 * @desc    Save/update fields for a document
 * @access  Private (Supervisor, Admin)
 */
router.post('/:id/fields', authenticate, isSupervisorOrAdmin, asyncHandler(async (req, res) => {
  const documentId = parseInt(req.params.id);
  const { fields, submit } = req.body;

  // Validate request
  if (!fields || !Array.isArray(fields)) {
    return res.status(400).json({
      success: false,
      error: 'Fields array is required'
    });
  }

  // Check if document exists and is stored
  const document = Document.findById(documentId);
  if (!document) {
    return res.status(404).json({
      success: false,
      error: 'Document not found'
    });
  }

  if (document.status !== 'stored' && document.status !== 'processing' && document.status !== 'fields_extracted') {
    return res.status(400).json({
      success: false,
      error: 'Only stored documents can have fields extracted'
    });
  }

  // Save fields
  DocumentField.saveFields(documentId, fields, req.user.id);

  // Update document status if submitting
  let newStatus = document.status;
  if (submit) {
    newStatus = 'fields_extracted';
    Document.updateStatus(documentId, newStatus);

    // Log in history
    Document.logHistory(documentId, 'fields_submitted', req.user.id, {
      field_count: fields.length,
      submitted_at: new Date().toISOString()
    });
  } else {
    // Just update status to processing if not already
    if (document.status === 'stored') {
      newStatus = 'processing';
      Document.updateStatus(documentId, newStatus);
    }

    // Log in history
    Document.logHistory(documentId, 'fields_updated', req.user.id, {
      field_count: fields.length
    });
  }

  res.json({
    success: true,
    message: submit ? 'Fields submitted successfully' : 'Fields saved successfully',
    data: {
      fieldCount: fields.length,
      status: newStatus
    }
  });
}));

/**
 * @route   POST /api/documents/:id/ocr
 * @desc    Mock OCR endpoint - extracts text from document
 * @access  Private (Supervisor, Admin)
 */
router.post('/:id/ocr', authenticate, isSupervisorOrAdmin, asyncHandler(async (req, res) => {
  const documentId = parseInt(req.params.id);

  // Check if document exists
  const document = Document.findById(documentId);
  if (!document) {
    return res.status(404).json({
      success: false,
      error: 'Document not found'
    });
  }

  if (document.status !== 'stored' && document.status !== 'processing' && document.status !== 'fields_extracted') {
    return res.status(400).json({
      success: false,
      error: 'Only stored documents can be processed'
    });
  }

  // Simulate OCR processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock OCR result - in production, this would call actual OCR API
  const mockOcrResult = {
    "الصفحة": null,
    "رسم ولادة رقم": "1025 ياسن -تايك",
    "في يوم": "عاشر شعبان",
    "عام": "ألف و أربعمائة YASSINE - TAIK و أربعة و عشرون",
    "هجرية موافق": "ستة أكتوبر ألفان و ثلاثة",
    "على الساعة": "السادسة",
    "والدقيقة": "و خمسين",
    "ولد ب": "سلا ياسين - YASSINE",
    "اسمه العائلي": "تايك TAIK",
    "من والد": "عبد المجيد بن عبد اللة",
    "جنسيته": "مغربية",
    "المولود ب": "بني ملال",
    "في": null,
    "موافق": null,
    "حرفته": "موظف",
    "ووالدت": "فاطمة الزهراء بنت محمد",
    "جنسيتها": "مغربية",
    "المولودة ب": "أبي جعد , خريبكة",
    "في_2": null,
    "موافق_2": null,
    "حرفتها": "صيدلانية",
    "الساكنان ب": "حي السلام بلوك ب . رقم 22 سلا",
    "بناء على": "ما صرح به والده",
    "و حرر أو نقل في": "عشرون شعبان ألف و أربعمائة و أربعة و عشرون",
    "هجرية موافق_2": "سادس عشر أكتوبر ألفان و ثلاثة",
    "من طرفنا نحن": "أشرف الناصري متصرف مساعد بالمقاطعة الحضرية الأولى",
    "و ضابط الحالة المدنية": "بالتفويض"
  };

  // Map Arabic keys to our schema field names (for naissances type)
  const fieldMapping = {
    "الصفحة": "page",
    "رسم ولادة رقم": "acte_number_text",
    "في يوم": "day_text",
    "عام": "year_hijri",
    "هجرية موافق": "date_match",
    "على الساعة": "time_hour",
    "والدقيقة": "time_minute",
    "ولد ب": "born_in",
    "اسمه العائلي": "family_name",
    "من والد": "father_name",
    "جنسيته": "father_nationality",
    "المولود ب": "father_born_in",
    "في": "father_born_date",
    "موافق": "father_born_match",
    "حرفته": "father_profession",
    "ووالدت": "mother_name",
    "جنسيتها": "mother_nationality",
    "المولودة ب": "mother_born_in",
    "في_2": "mother_born_date",
    "موافق_2": "mother_born_match",
    "حرفتها": "mother_profession",
    "الساكنان ب": "residence",
    "بناء على": "declaration_basis",
    "و حرر أو نقل في": "written_or_transferred",
    "هجرية موافق_2": "written_match",
    "من طرفنا نحن": "by_us",
    "و ضابط الحالة المدنية": "civil_status_officer"
  };

  // Convert to our field format
  const extractedFields = {};
  Object.keys(mockOcrResult).forEach(arabicKey => {
    const fieldName = fieldMapping[arabicKey];
    if (fieldName) {
      extractedFields[fieldName] = mockOcrResult[arabicKey];
    }
  });

  // Update document status to processing
  Document.updateStatus(documentId, 'processing');

  // Log OCR action
  Document.logHistory(documentId, 'fields_extracted', req.user.id, {
    method: 'ocr',
    field_count: Object.keys(extractedFields).length,
    ocr_confidence: 0.95 // Mock confidence
  });

  res.json({
    success: true,
    message: 'OCR processing completed',
    data: {
      fields: extractedFields,
      confidence: 0.95,
      processedAt: new Date().toISOString()
    }
  });
}));

/**
 * @route   GET /api/forms/schema/:type
 * @desc    Get form schema for a document type
 * @access  Private (Supervisor, Admin)
 */
router.get('/forms/schema/:type', authenticate, isSupervisorOrAdmin, asyncHandler(async (req, res) => {
  const { type } = req.params;

  // Map registre_type to schema file
  const schemaMap = {
    'naissances': 'naissances',
    'deces': 'generic',
    'jugements': 'generic',
    'transcriptions': 'generic',
    'etrangers': 'generic'
  };

  const schemaFile = schemaMap[type] || 'generic';
  const schemaPath = path.join(__dirname, '../schemas', `${schemaFile}.json`);

  // Check if schema exists
  if (!fs.existsSync(schemaPath)) {
    return res.status(404).json({
      success: false,
      error: 'Schema not found for this document type'
    });
  }

  // Read and return schema
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  res.json({
    success: true,
    data: schema
  });
}));

/**
 * @route   DELETE /api/documents/:id/fields
 * @desc    Delete all fields for a document
 * @access  Private (Admin only)
 */
router.delete('/:id/fields', authenticate, asyncHandler(async (req, res) => {
  // Only admin can delete fields
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Only administrators can delete fields'
    });
  }

  const documentId = parseInt(req.params.id);

  // Check if document exists
  const document = Document.findById(documentId);
  if (!document) {
    return res.status(404).json({
      success: false,
      error: 'Document not found'
    });
  }

  // Delete fields
  DocumentField.deleteByDocumentId(documentId);

  // Update document status back to stored
  Document.updateStatus(documentId, 'stored');

  // Log action
  Document.logHistory(documentId, 'fields_deleted', req.user.id, {
    deleted_at: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Fields deleted successfully'
  });
}));

module.exports = router;
