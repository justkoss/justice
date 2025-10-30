const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticate, requireRole, isSupervisorOrAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { upload } = require('../config/multer');

/**
 * @route   POST /api/sync
 * @desc    Sync document from desktop app (compatible with existing desktop app)
 * @access  Private (Agent)
 */
router.post('/sync', authenticate, upload.single('file'), asyncHandler(documentController.syncDocument));

/**
 * @route   GET /api/documents/stats
 * @desc    Get document statistics
 * @access  Private
 */
router.get('/documents/stats', authenticate, asyncHandler(documentController.getStats));

/**
 * @route   GET /api/documents
 * @desc    Get all documents with filters
 * @access  Private
 */
router.get('/documents', authenticate, asyncHandler(documentController.getDocuments));

/**
 * @route   GET /api/documents/:id
 * @desc    Get single document
 * @access  Private
 */
router.get('/documents/:id', authenticate, asyncHandler(documentController.getDocument));

/**
 * @route   PUT /api/documents/:id/review
 * @desc    Start reviewing a document
 * @access  Private (Supervisor, Admin)
 */
router.put('/documents/:id/review', authenticate, isSupervisorOrAdmin, asyncHandler(documentController.startReview));

/**
 * @route   POST /api/documents/:id/approve
 * @desc    Approve document
 * @access  Private (Supervisor, Admin)
 */
router.post('/documents/:id/approve', authenticate, isSupervisorOrAdmin, asyncHandler(documentController.approveDocument));

/**
 * @route   POST /api/documents/:id/reject
 * @desc    Reject document
 * @access  Private (Supervisor, Admin)
 */
router.post('/documents/:id/reject', authenticate, isSupervisorOrAdmin, asyncHandler(documentController.rejectDocument));

/**
 * @route   GET /api/documents/:id/history
 * @desc    Get document history
 * @access  Private
 */
router.get('/documents/:id/history', authenticate, asyncHandler(documentController.getDocumentHistory));


/**
 * @route   GET /api/documents/:id/file
 * @desc    Get document file (PDF) with authentication
 * @access  Private
 */
router.get('/documents/:id/file', authenticate, asyncHandler(documentController.getDocumentFile));

module.exports = router;
