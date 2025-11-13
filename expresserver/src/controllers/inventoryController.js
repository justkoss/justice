const Inventory = require('../models/Inventory');
const Document = require('../models/Document');

/**
 * Upload inventory from Excel file
 */
exports.uploadInventory = async (req, res, next) => {
  try {
    const { records } = req.body;
    const userId = req.user.id;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No records provided'
      });
    }

    // Validate records
    const validRecords = records.filter(record => {
      return record.bureau && 
             record.registreType && 
             record.year && 
             record.registreNumber && 
             record.acteNumber;
    });

    if (validRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid records found'
      });
    }

    // Generate batch ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert records
    await Inventory.insertBatch(validRecords, batchId, userId);

    // Get stats
    const stats = await Inventory.getStats(batchId);

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${validRecords.length} inventory records`,
      data: {
        batchId,
        recordCount: validRecords.length,
        skippedCount: records.length - validRecords.length,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all inventory batches
 */
exports.getInventoryBatches = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const batches = await Inventory.getBatches(userId);

    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory by batch ID
 */
exports.getInventoryByBatch = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const records = await Inventory.getByBatchId(batchId);

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete inventory batch
 */
exports.deleteInventoryBatch = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const userId = req.user.id;

    await Inventory.deleteBatch(batchId, userId);

    res.json({
      success: true,
      message: 'Inventory batch deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Compare inventory with actual documents
 */
exports.compareInventory = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const { bureau, registreType, year } = req.query;

    // Get inventory records
    const filters = { batchId };
    if (bureau) filters.bureau = bureau;
    if (registreType) filters.registreType = registreType;
    if (year) filters.year = parseInt(year);

    const inventoryRecords = await Inventory.getAll(filters);

    // Get actual documents (only stored documents)
    const documents = await Document.findAll({
      bureau,
      registreType,
      year,
      status: 'stored'
    });

    // Create comparison
    const comparison = compareRecords(inventoryRecords, documents);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tree comparison statistics
 */
exports.getTreeComparison = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    // Get all inventory records for this batch
    const inventoryRecords = await Inventory.getByBatchId(batchId);

    // Get all stored documents
    const documents = await Document.findAll({ status: 'stored' });

    // Build tree structure with comparison
    const tree = buildComparisonTree(inventoryRecords, documents);

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to compare records
 */
function compareRecords(inventoryRecords, documents) {
  // Create maps for quick lookup
  const inventoryMap = new Map();
  inventoryRecords.forEach(record => {
    const key = `${record.bureau}|${record.registre_type}|${record.year}|${record.registre_number}|${record.acte_number}`;
    inventoryMap.set(key, record);
  });

  const documentMap = new Map();
  documents.forEach(doc => {
    const key = `${doc.bureau}|${doc.registre_type}|${doc.year}|${doc.registre_number}|${doc.acte_number}`;
    documentMap.set(key, doc);
  });

  // Find missing documents (in inventory but not in system)
  const missing = [];
  inventoryRecords.forEach(record => {
    const key = `${record.bureau}|${record.registre_type}|${record.year}|${record.registre_number}|${record.acte_number}`;
    if (!documentMap.has(key)) {
      missing.push({
        bureau: record.bureau,
        registreType: record.registre_type,
        year: record.year,
        registreNumber: record.registre_number,
        acteNumber: record.acte_number,
        status: 'missing'
      });
    }
  });

  // Find extra documents (in system but not in inventory)
  const extra = [];
  documents.forEach(doc => {
    const key = `${doc.bureau}|${doc.registre_type}|${doc.year}|${doc.registre_number}|${doc.acte_number}`;
    if (!inventoryMap.has(key)) {
      extra.push({
        id: doc.id,
        bureau: doc.bureau,
        registreType: doc.registre_type,
        year: doc.year,
        registreNumber: doc.registre_number,
        acteNumber: doc.acte_number,
        status: 'extra',
        uploadedBy: doc.uploaded_by_username,
        uploadedAt: doc.uploaded_at
      });
    }
  });

  // Find matched documents
  const matched = [];
  inventoryRecords.forEach(record => {
    const key = `${record.bureau}|${record.registre_type}|${record.year}|${record.registre_number}|${record.acte_number}`;
    if (documentMap.has(key)) {
      const doc = documentMap.get(key);
      matched.push({
        id: doc.id,
        bureau: record.bureau,
        registreType: record.registre_type,
        year: record.year,
        registreNumber: record.registre_number,
        acteNumber: record.acte_number,
        status: 'matched',
        uploadedBy: doc.uploaded_by_username,
        uploadedAt: doc.uploaded_at
      });
    }
  });

  return {
    summary: {
      totalInventory: inventoryRecords.length,
      totalDocuments: documents.length,
      matched: matched.length,
      missing: missing.length,
      extra: extra.length,
      matchRate: inventoryRecords.length > 0 
        ? ((matched.length / inventoryRecords.length) * 100).toFixed(2)
        : 0
    },
    matched,
    missing,
    extra
  };
}

/**
 * Helper function to build comparison tree
 */
function buildComparisonTree(inventoryRecords, documents) {
  const tree = {};

  // Process inventory records
  inventoryRecords.forEach(record => {
    const { bureau, registre_type, year, registre_number } = record;
    
    if (!tree[bureau]) {
      tree[bureau] = {
        name: bureau,
        types: {},
        stats: { inventory: 0, actual: 0, matched: 0, missing: 0, extra: 0 }
      };
    }
    tree[bureau].stats.inventory++;

    if (!tree[bureau].types[registre_type]) {
      tree[bureau].types[registre_type] = {
        name: registre_type,
        years: {},
        stats: { inventory: 0, actual: 0, matched: 0, missing: 0, extra: 0 }
      };
    }
    tree[bureau].types[registre_type].stats.inventory++;

    if (!tree[bureau].types[registre_type].years[year]) {
      tree[bureau].types[registre_type].years[year] = {
        name: year,
        registres: {},
        stats: { inventory: 0, actual: 0, matched: 0, missing: 0, extra: 0 }
      };
    }
    tree[bureau].types[registre_type].years[year].stats.inventory++;

    if (!tree[bureau].types[registre_type].years[year].registres[registre_number]) {
      tree[bureau].types[registre_type].years[year].registres[registre_number] = {
        name: registre_number,
        stats: { inventory: 0, actual: 0, matched: 0, missing: 0, extra: 0 }
      };
    }
    tree[bureau].types[registre_type].years[year].registres[registre_number].stats.inventory++;
  });

  // Process actual documents
  documents.forEach(doc => {
    const { bureau, registre_type, year, registre_number } = doc;
    
    if (!tree[bureau]) {
      tree[bureau] = {
        name: bureau,
        types: {},
        stats: { inventory: 0, actual: 0, matched: 0, missing: 0, extra: 0 }
      };
    }
    tree[bureau].stats.actual++;

    if (!tree[bureau].types[registre_type]) {
      tree[bureau].types[registre_type] = {
        name: registre_type,
        years: {},
        stats: { inventory: 0, actual: 0, matched: 0, missing: 0, extra: 0 }
      };
    }
    tree[bureau].types[registre_type].stats.actual++;

    if (!tree[bureau].types[registre_type].years[year]) {
      tree[bureau].types[registre_type].years[year] = {
        name: year,
        registres: {},
        stats: { inventory: 0, actual: 0, matched: 0, missing: 0, extra: 0 }
      };
    }
    tree[bureau].types[registre_type].years[year].stats.actual++;

    if (!tree[bureau].types[registre_type].years[year].registres[registre_number]) {
      tree[bureau].types[registre_type].years[year].registres[registre_number] = {
        name: registre_number,
        stats: { inventory: 0, actual: 0, matched: 0, missing: 0, extra: 0 }
      };
    }
    tree[bureau].types[registre_type].years[year].registres[registre_number].stats.actual++;
  });

  // Calculate matched, missing, and extra at each level
  const calculateStats = (node) => {
    if (node.stats) {
      const { inventory, actual } = node.stats;
      node.stats.matched = Math.min(inventory, actual);
      node.stats.missing = Math.max(0, inventory - actual);
      node.stats.extra = Math.max(0, actual - inventory);
      node.stats.matchRate = inventory > 0 
        ? ((node.stats.matched / inventory) * 100).toFixed(2)
        : 0;
    }

    if (node.types) {
      Object.values(node.types).forEach(type => {
        calculateStats(type);
      });
    }

    if (node.years) {
      Object.values(node.years).forEach(year => {
        calculateStats(year);
      });
    }

    if (node.registres) {
      Object.values(node.registres).forEach(registre => {
        calculateStats(registre);
      });
    }
  };

  Object.values(tree).forEach(bureau => calculateStats(bureau));

  return tree;
}

module.exports = exports;
