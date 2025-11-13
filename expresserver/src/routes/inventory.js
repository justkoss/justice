const express = require('express');
const router = express.Router();
const { authenticate} = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');

/**
 * @route   POST /api/inventory/upload
 * @desc    Upload inventory from Excel
 * @access  Private (Admin, Supervisor)
 */
router.post(
  '/upload',
  authenticate,
  // authorize(['admin', 'supervisor']),
  inventoryController.uploadInventory
);

/**
 * @route   GET /api/inventory/batches
 * @desc    Get all inventory batches
 * @access  Private
 */
router.get(
  '/batches',
  authenticate,
  inventoryController.getInventoryBatches
);

/**
 * @route   GET /api/inventory/batches/:batchId
 * @desc    Get inventory by batch ID
 * @access  Private
 */
router.get(
  '/batches/:batchId',
  authenticate,
  inventoryController.getInventoryByBatch
);

/**
 * @route   DELETE /api/inventory/batches/:batchId
 * @desc    Delete inventory batch
 * @access  Private (Admin, Supervisor)
 */
router.delete(
  '/batches/:batchId',
  authenticate,
  // authorize(['admin', 'supervisor']),
  inventoryController.deleteInventoryBatch
);

/**
 * @route   GET /api/inventory/compare/:batchId
 * @desc    Compare inventory with actual documents
 * @access  Private
 */
router.get(
  '/compare/:batchId',
  authenticate,
  inventoryController.compareInventory
);

/**
 * @route   GET /api/inventory/tree/:batchId
 * @desc    Get tree comparison statistics
 * @access  Private
 */
router.get(
  '/tree/:batchId',
  authenticate,
  inventoryController.getTreeComparison
);

module.exports = router;
