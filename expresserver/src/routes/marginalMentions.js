const express = require('express');
const router = express.Router();
const MarginalMention = require('../models/MarginalMention');
const Document = require('../models/Document');
const { authenticate, isSupervisorOrAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/documents/:id/marginal-mentions
 * @desc    Get all marginal mentions for a document
 * @access  Private (Supervisor, Admin)
 */
router.get('/:id/marginal-mentions', authenticate, isSupervisorOrAdmin, asyncHandler(async (req, res) => {
  const documentId = parseInt(req.params.id);
  
  // Check if document exists
  const document = Document.findById(documentId);
  if (!document) {
    return res.status(404).json({
      success: false,
      error: 'Document not found'
    });
  }

  // Get all marginal mentions
  const mentions = MarginalMention.findByDocumentId(documentId);
  const count = MarginalMention.countByDocumentId(documentId);

  res.json({
    success: true,
    data: {
      mentions,
      count,
      documentId
    }
  });
}));

/**
 * @route   POST /api/documents/:id/marginal-mentions
 * @desc    Create a new marginal mention for a document
 * @access  Private (Supervisor, Admin)
 */
router.post('/:id/marginal-mentions', authenticate, isSupervisorOrAdmin, asyncHandler(async (req, res) => {
  const documentId = parseInt(req.params.id);
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
  } = req.body;

  // Validate required fields
  if (!mention_type) {
    return res.status(400).json({
      success: false,
      error: 'Mention type is required'
    });
  }

  // Check if document exists
  const document = Document.findById(documentId);
  if (!document) {
    return res.status(404).json({
      success: false,
      error: 'Document not found'
    });
  }

  // Create marginal mention
  const mention = MarginalMention.create({
    document_id: documentId,
    mention_type,
    mention_date,
    mention_text,
    civil_officer_signature,
    person_first_name,
    person_last_name,
    officer_title,
    changes_occurred,
    change_description,
    created_by: req.user.id
  });

  // Log in document history
  Document.logHistory(documentId, 'marginal_mention_added', req.user.id, {
    mention_id: mention.id,
    mention_type
  });

  res.status(201).json({
    success: true,
    message: 'Marginal mention created successfully',
    data: mention
  });
}));

/**
 * @route   PUT /api/marginal-mentions/:id
 * @desc    Update a marginal mention
 * @access  Private (Supervisor, Admin)
 */
router.put('/marginal-mentions/:id', authenticate, isSupervisorOrAdmin, asyncHandler(async (req, res) => {
  const mentionId = parseInt(req.params.id);
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
  } = req.body;

  // Check if mention exists
  const existingMention = MarginalMention.findById(mentionId);
  if (!existingMention) {
    return res.status(404).json({
      success: false,
      error: 'Marginal mention not found'
    });
  }

  // Update marginal mention
  const updatedMention = MarginalMention.update(mentionId, {
    mention_type,
    mention_date,
    mention_text,
    civil_officer_signature,
    person_first_name,
    person_last_name,
    officer_title,
    changes_occurred,
    change_description
  });

  // Log in document history
  Document.logHistory(existingMention.document_id, 'marginal_mention_updated', req.user.id, {
    mention_id: mentionId,
    mention_type
  });

  res.json({
    success: true,
    message: 'Marginal mention updated successfully',
    data: updatedMention
  });
}));

/**
 * @route   DELETE /api/marginal-mentions/:id
 * @desc    Delete a marginal mention
 * @access  Private (Supervisor, Admin)
 */
router.delete('/marginal-mentions/:id', authenticate, isSupervisorOrAdmin, asyncHandler(async (req, res) => {
  const mentionId = parseInt(req.params.id);

  // Check if mention exists
  const existingMention = MarginalMention.findById(mentionId);
  if (!existingMention) {
    return res.status(404).json({
      success: false,
      error: 'Marginal mention not found'
    });
  }

  // Delete marginal mention
  MarginalMention.delete(mentionId);

  // Log in document history
  Document.logHistory(existingMention.document_id, 'marginal_mention_deleted', req.user.id, {
    mention_id: mentionId,
    mention_type: existingMention.mention_type
  });

  res.json({
    success: true,
    message: 'Marginal mention deleted successfully'
  });
}));

module.exports = router;
