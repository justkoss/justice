const express = require('express');
const router = express.Router();
const { queryAll } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const User = require('../models/User');

/**
 * @route   GET /api/tree
 * @desc    Get document tree structure
 * @access  Private (Supervisor, Admin)
 * 
 * Query params:
 * - status: Filter by document status (default: 'stored')
 * - bureau: Filter by specific bureau
 * - registre_type: Filter by registre type
 * - year: Filter by year
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status = 'stored,processing,fields_extracted', bureau, registre_type, year } = req.query;
  const user = req.user;

  // Parse multiple statuses
  const statuses = status.split(',').map(s => s.trim());

  // Build query
  let sql = `
    SELECT 
      bureau,
      registre_type,
      year,
      registre_number,
      COUNT(*) as count
    FROM documents
    WHERE status IN (${statuses.map(() => '?').join(',')})
  `;
  const params = [...statuses];

  // Role-based filtering
  if (user.role === 'supervisor') {
    // Supervisors only see their assigned bureaus
    const assignedBureaux = User.getBureaus(user.id);
    if (assignedBureaux.length > 0) {
      const placeholders = assignedBureaux.map(() => '?').join(',');
      sql += ` AND bureau IN (${placeholders})`;
      params.push(...assignedBureaux);
    } else {
      // Supervisor with no assigned bureaus sees nothing
      return res.json({
        success: true,
        data: []
      });
    }
  }

  // Additional filters
  if (bureau) {
    sql += ' AND bureau = ?';
    params.push(bureau);
  }

  if (registre_type) {
    sql += ' AND registre_type = ?';
    params.push(registre_type);
  }

  if (year) {
    sql += ' AND year = ?';
    params.push(parseInt(year));
  }

  // Group by hierarchy
  sql += `
    GROUP BY bureau, registre_type, year, registre_number
    ORDER BY bureau, registre_type, year DESC, registre_number
  `;

  const treeNodes = queryAll(sql, params);

  res.json({
    success: true,
    data: treeNodes
  });
}));

/**
 * @route   GET /api/tree/stats
 * @desc    Get tree statistics
 * @access  Private
 */
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  const user = req.user;

  let sql = `
    SELECT 
      COUNT(DISTINCT bureau) as totalBureaux,
      COUNT(DISTINCT registre_type) as totalTypes,
      COUNT(DISTINCT year) as totalYears,
      COUNT(DISTINCT registre_number) as totalRegistres,
      COUNT(*) as totalDocuments
    FROM documents
    WHERE status = 'stored'
  `;
  const params = [];

  // Role-based filtering
  if (user.role === 'supervisor') {
    const assignedBureaux = User.getBureaus(user.id);
    if (assignedBureaux.length > 0) {
      const placeholders = assignedBureaux.map(() => '?').join(',');
      sql += ` AND bureau IN (${placeholders})`;
      params.push(...assignedBureaux);
    }
  }

  const stats = queryAll(sql, params)[0] || {
    totalBureaux: 0,
    totalTypes: 0,
    totalYears: 0,
    totalRegistres: 0,
    totalDocuments: 0
  };

  res.json({
    success: true,
    stats
  });
}));

/**
 * @route   GET /api/tree/bureaux
 * @desc    Get list of bureaux with document counts
 * @access  Private
 */
router.get('/bureaux', authenticate, asyncHandler(async (req, res) => {
  const user = req.user;

  let sql = `
    SELECT 
      bureau,
      COUNT(*) as count
    FROM documents
    WHERE status = 'stored'
  `;
  const params = [];

  // Role-based filtering
  if (user.role === 'supervisor') {
    const assignedBureaux = User.getBureaus(user.id);
    if (assignedBureaux.length > 0) {
      const placeholders = assignedBureaux.map(() => '?').join(',');
      sql += ` AND bureau IN (${placeholders})`;
      params.push(...assignedBureaux);
    }
  }

  sql += ' GROUP BY bureau ORDER BY bureau';

  const bureaux = queryAll(sql, params);

  res.json({
    success: true,
    data: bureaux
  });
}));

module.exports = router;
