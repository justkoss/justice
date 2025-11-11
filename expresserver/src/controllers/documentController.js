const Document = require('../models/Document');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { STORED_DIR, PENDING_DIR } = require('../config/multer');
const logger = require('../utils/logger');

/**
 * Sync document from desktop app
 * POST /api/sync
 * Compatible with existing desktop app
 */
async function syncDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    // Parse metadata
    const metadata = JSON.parse(req.body.metadata);
    
    // Validate required fields
    const requiredFields = ['bureau', 'registreType', 'year', 'acteNumber', 'registreNumber'];
    const missingFields = requiredFields.filter(field => !metadata[field]);
    
    if (missingFields.length > 0) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Create document record
    const documentData = {
      filename: req.file.filename,
      original_filename: metadata.filename || req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      bureau: metadata.bureau,
      registre_type: metadata.registreType,
      year: parseInt(metadata.year),
      registre_number: metadata.registreNumber,
      acte_number: metadata.acteNumber,
      uploaded_by: req.user.id,
      desktop_document_id: metadata.desktopDocumentId,
      processed_at: metadata.processedAt || new Date().toISOString()
    };
    console.log('Document data to sync:', documentData);
    const document = Document.create(documentData);
    // console.log('Document created with ID:', document.id);
    console.log('Full document record:', document);
    
    // Log the upload action
    logger.logDocumentUpload(req, document.id, 
      `Uploaded ${document.original_filename} to ${document.bureau}/${document.registre_type}/${document.year}`);
    
    console.log(`✅ Document synchronized: ${document?.original_filename || "no_name.pdf" } by ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Document synchronized successfully',
      document: {
        id: document.id,
        originalFilename: document.original_filename,
        bureau: document.bureau,
        registreType: document.registre_type,
        year: document.year,
        registreNumber: document.registre_number,
        acteNumber: document.acte_number,
        status: document.status,
        uploadedAt: document.uploaded_at
      }
    });
    
  } catch (error) {
    console.error('Sync document error:', error);
    
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to synchronize document',
      details: error.message
    });
  }
}

/**
 * Get all documents with filters
 * GET /api/documents
 */
async function getDocuments(req, res) {
  try {
    const filters = {
      status: req.query.status,
      bureau: req.query.bureau,
      registre_type: req.query.registre_type,
      year: req.query.year,
      search: req.query.search,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      sort_by: req.query.sort_by || 'uploaded_at',
      sort_order: req.query.sort_order || 'DESC',
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    
    // Apply role-based filtering
    if (req.user.role === 'agent') {
      filters.uploaded_by = req.user.id;
    } else if (req.user.role === 'supervisor') {
      const bureaux = User.getBureaus(req.user.id);
      if (bureaux.length > 0) {
        filters.supervisor_bureaux = bureaux;
      }
    }
    // Admin sees all documents
    
    const documents = Document.findAll(filters);
    const total = Document.count(filters);
    
    res.json({
      success: true,
      documents,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset + filters.limit) < total
      }
    });
    
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve documents'
    });
  }
}

/**
 * Get single document by ID
 * GET /api/documents/:id
 */
async function getDocument(req, res) {
  try {
    const document = Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    // Check permissions
    if (req.user.role === 'agent' && document.uploaded_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    if (req.user.role === 'supervisor') {
      const bureaux = User.getBureaus(req.user.id);
      if (bureaux.length > 0 && !bureaux.includes(document.bureau)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }
    
    // Log document view (optional - can be verbose)
    logger.logDocumentView(req, document.id);
    
    res.json({
      success: true,
      document
    });
    
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve document'
    });
  }
}

/**
 * Start reviewing a document (supervisor only)
 * PUT /api/documents/:id/review
 */
async function startReview(req, res) {
  try {
    const document = Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    // Check permissions
    if (req.user.role === 'supervisor') {
      const bureaux = User.getBureaus(req.user.id);
      if (bureaux.length > 0 && !bureaux.includes(document.bureau)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }
    
    // Only pending documents can be reviewed
    if (document.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Document is not in pending status'
      });
    }
    
    const updatedDocument = Document.startReview(req.params.id, req.user.id);
    
    // Log review start
    logger.logDocumentReviewStart(req, document.id, 
      `Started reviewing ${document.acte_number} from ${document.bureau}`);
    
    res.json({
      success: true,
      message: 'Review started',
      document: updatedDocument
    });
    
  } catch (error) {
    console.error('Start review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start review'
    });
  }
}

/**
 * Approve document (supervisor only)
 * POST /api/documents/:id/approve
 */
async function approveDocument(req, res) {
  try {
    const document = Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    // Check permissions
    if (req.user.role === 'supervisor') {
      const bureaux = User.getBureaus(req.user.id);
      if (bureaux.length > 0 && !bureaux.includes(document.bureau)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }
    
    // Move file to stored location
    const storedDir = path.join(STORED_DIR, document.bureau, document.registre_type, document.year.toString(), document.registre_number);
    
    // Create directory structure
    if (!fs.existsSync(storedDir)) {
      fs.mkdirSync(storedDir, { recursive: true });
    }
    
    const storedPath = path.join(storedDir, `${document.acte_number}.pdf`);
    
    // Move file
    if (fs.existsSync(document.file_path)) {
      fs.renameSync(document.file_path, storedPath);
    }
    
    const updatedDocument = Document.approve(req.params.id, req.user.id, storedPath);
    
    // Log approval
    logger.logDocumentApprove(req, document.id, 
      `Approved ${document.acte_number} - moved to ${storedPath}`, 
      { 
        bureau: document.bureau, 
        registre_type: document.registre_type, 
        year: document.year,
        virtual_path: storedPath 
      });
    
    console.log(`✅ Document approved: ${document.acte_number} by ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Document approved successfully',
      document: updatedDocument
    });
    
  } catch (error) {
    console.error('Approve document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve document'
    });
  }
}

/**
 * Reject document (supervisor only)
 * POST /api/documents/:id/reject
 */
async function rejectDocument(req, res) {
  try {
    const { error_type, message } = req.body;
    
    if (!error_type || !message) {
      return res.status(400).json({
        success: false,
        error: 'Error type and message are required'
      });
    }
    
    const document = Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    // Check permissions
    if (req.user.role === 'supervisor') {
      const bureaux = User.getBureaus(req.user.id);
      if (bureaux.length > 0 && !bureaux.includes(document.bureau)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }
    
    const updatedDocument = Document.reject(req.params.id, req.user.id, {
      error_type,
      message
    });
    
    // Log rejection
    logger.logDocumentReject(req, document.id, 
      `Rejected ${document.acte_number}: ${message}`, 
      { 
        error_type, 
        bureau: document.bureau, 
        registre_type: document.registre_type 
      });
    
    console.log(`❌ Document rejected: ${document.acte_number} by ${req.user.username}`);
    
    // TODO: Send notification to agent via WebSocket
    
    res.json({
      success: true,
      message: 'Document rejected',
      document: updatedDocument
    });
    
  } catch (error) {
    console.error('Reject document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject document'
    });
  }
}

/**
 * Get document history
 * GET /api/documents/:id/history
 */
async function getDocumentHistory(req, res) {
  try {
    const document = Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    // Check permissions
    if (req.user.role === 'agent' && document.uploaded_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const history = Document.getHistory(req.params.id);
    
    res.json({
      success: true,
      history
    });
    
  } catch (error) {
    console.error('Get document history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve document history'
    });
  }
}

/**
 * Get documents statistics
 * GET /api/documents/stats
 */
async function getStats(req, res) {
  try {
    const filters = {};
    
    // Apply role-based filtering
    if (req.user.role === 'supervisor') {
      const bureaux = User.getBureaus(req.user.id);
      if (bureaux.length > 0) {
        filters.supervisor_bureaux = bureaux;
      }
    }
    
    const stats = Document.getStats(filters);
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
}


async function getDocumentFile(req, res) {
  try {
    const document = Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    // Check permissions
    if (req.user.role === 'agent' && document.uploaded_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    if (req.user.role === 'supervisor') {
      const bureaux = User.getBureaus(req.user.id);
      if (bureaux.length > 0 && !bureaux.includes(document.bureau)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }
    
    // Check if file exists
    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
    }
    
    // Set headers for PDF display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.original_filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    
    // Stream the file
    const fileStream = fs.createReadStream(document.file_path);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to stream file'
        });
      }
    });
    
  } catch (error) {
    console.error('Get document file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve document file'
    });
  }
}

module.exports = {
  syncDocument,
  getDocuments,
  getDocument,
  startReview,
  approveDocument,
  rejectDocument,
  getDocumentHistory,
  getStats,
  getDocumentFile
};