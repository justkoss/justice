const Document = require('../models/Document');
const User = require('../models/User');
const { queryAll, queryOne } = require('../config/database');

/**
 * Advanced document search
 * GET /api/search
 */
async function advancedSearch(req, res) {
  try {
    const {
      // Text search
      query,
      
      // Metadata filters
      bureau,
      registre_type,
      year,
      registre_number,
      acte_number,
      
      // Status filters
      status,
      
      // User filters
      uploaded_by,
      reviewed_by,
      agent_name,
      supervisor_name,
      
      // Date filters
      date_from,
      date_to,
      uploaded_from,
      uploaded_to,
      reviewed_from,
      reviewed_to,
      
      // Sorting
      sort_by = 'uploaded_at',
      sort_order = 'DESC',
      
      // Pagination
      page = 1,
      limit = 20,
    } = req.query;

    // Build SQL query dynamically
    let sql = `
      SELECT 
        d.*,
        u_uploaded.username as uploaded_by_username,
        u_uploaded.full_name as uploaded_by_name,
        u_reviewed.username as reviewed_by_username,
        u_reviewed.full_name as reviewed_by_name
      FROM documents d
      LEFT JOIN users u_uploaded ON d.uploaded_by = u_uploaded.id
      LEFT JOIN users u_reviewed ON d.reviewed_by = u_reviewed.id
      WHERE 1=1
    `;
    
    const params = [];

    // Apply role-based access control
    if (req.user.role === 'agent') {
      sql += ' AND d.uploaded_by = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'supervisor') {
      const bureaux = User.getBureaus(req.user.id);
      if (bureaux.length > 0) {
        const placeholders = bureaux.map(() => '?').join(',');
        sql += ` AND d.bureau IN (${placeholders})`;
        params.push(...bureaux);
      }
    }

    // Text search across multiple fields
    if (query) {
      sql += ` AND (
        d.original_filename LIKE ? OR
        d.acte_number LIKE ? OR
        d.registre_number LIKE ? OR
        d.bureau LIKE ? OR
        u_uploaded.username LIKE ? OR
        u_uploaded.full_name LIKE ? OR
        u_reviewed.username LIKE ? OR
        u_reviewed.full_name LIKE ?
      )`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Bureau filter
    if (bureau) {
      if (bureau.includes(',')) {
        const bureaux = bureau.split(',').map(b => b.trim());
        const placeholders = bureaux.map(() => '?').join(',');
        sql += ` AND d.bureau IN (${placeholders})`;
        params.push(...bureaux);
      } else {
        sql += ' AND d.bureau = ?';
        params.push(bureau);
      }
    }

    // Registre type filter
    if (registre_type) {
      if (registre_type.includes(',')) {
        const types = registre_type.split(',').map(t => t.trim());
        const placeholders = types.map(() => '?').join(',');
        sql += ` AND d.registre_type IN (${placeholders})`;
        params.push(...types);
      } else {
        sql += ' AND d.registre_type = ?';
        params.push(registre_type);
      }
    }

    // Year filter
    if (year) {
      if (year.includes(',')) {
        const years = year.split(',').map(y => parseInt(y.trim()));
        const placeholders = years.map(() => '?').join(',');
        sql += ` AND d.year IN (${placeholders})`;
        params.push(...years);
      } else if (year.includes('-')) {
        // Year range (e.g., "2020-2024")
        const [startYear, endYear] = year.split('-').map(y => parseInt(y.trim()));
        sql += ' AND d.year BETWEEN ? AND ?';
        params.push(startYear, endYear);
      } else {
        sql += ' AND d.year = ?';
        params.push(parseInt(year));
      }
    }

    // Registre number filter
    if (registre_number) {
      sql += ' AND d.registre_number LIKE ?';
      params.push(`%${registre_number}%`);
    }

    // Acte number filter
    if (acte_number) {
      sql += ' AND d.acte_number LIKE ?';
      params.push(`%${acte_number}%`);
    }

    // Status filter
    if (status) {
      if (status.includes(',')) {
        const statuses = status.split(',').map(s => s.trim());
        const placeholders = statuses.map(() => '?').join(',');
        sql += ` AND d.status IN (${placeholders})`;
        params.push(...statuses);
      } else {
        sql += ' AND d.status = ?';
        params.push(status);
      }
    }

    // Uploaded by user ID
    if (uploaded_by) {
      sql += ' AND d.uploaded_by = ?';
      params.push(parseInt(uploaded_by));
    }

    // Reviewed by user ID
    if (reviewed_by) {
      sql += ' AND d.reviewed_by = ?';
      params.push(parseInt(reviewed_by));
    }

    // Agent name search
    if (agent_name) {
      sql += ' AND (u_uploaded.username LIKE ? OR u_uploaded.full_name LIKE ?)';
      const nameTerm = `%${agent_name}%`;
      params.push(nameTerm, nameTerm);
    }

    // Supervisor name search
    if (supervisor_name) {
      sql += ' AND (u_reviewed.username LIKE ? OR u_reviewed.full_name LIKE ?)';
      const nameTerm = `%${supervisor_name}%`;
      params.push(nameTerm, nameTerm);
    }

    // Date range filters
    if (date_from || uploaded_from) {
      sql += ' AND d.uploaded_at >= ?';
      params.push(date_from || uploaded_from);
    }

    if (date_to || uploaded_to) {
      sql += ' AND d.uploaded_at <= ?';
      params.push(date_to || uploaded_to);
    }

    if (reviewed_from) {
      sql += ' AND d.reviewed_at >= ?';
      params.push(reviewed_from);
    }

    if (reviewed_to) {
      sql += ' AND d.reviewed_at <= ?';
      params.push(reviewed_to);
    }

    // Get total count (before pagination)
    const countSql = sql.replace(/SELECT[\s\S]*FROM/, 'SELECT COUNT(*) as count FROM');
    const countResult = queryOne(countSql, params);
    const total = countResult ? countResult.count : 0;

    // Add sorting
    const allowedSortFields = [
      'uploaded_at',
      'reviewed_at',
      'bureau',
      'year',
      'registre_number',
      'acte_number',
      'status',
      'original_filename',
    ];
    
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'uploaded_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    sql += ` ORDER BY d.${sortField} ${sortDirection}`;

    // Add pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    // Execute query
    const documents = queryAll(sql, params);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasMore = pageNum < totalPages;

    res.json({
      success: true,
      query: {
        text: query,
        filters: {
          bureau,
          registre_type,
          year,
          status,
          agent_name,
          supervisor_name,
        },
        sort: `${sortField} ${sortDirection}`,
      },
      results: documents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasMore,
        showing: `${offset + 1}-${Math.min(offset + limitNum, total)}`,
      },
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
    });
  }
}

/**
 * Get search suggestions (autocomplete)
 * GET /api/search/suggestions
 */
async function getSearchSuggestions(req, res) {
  try {
    const { type, query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        suggestions: [],
      });
    }

    let suggestions = [];
    const searchTerm = `%${query}%`;

    switch (type) {
      case 'acte_number':
        suggestions = queryAll(
          `SELECT DISTINCT acte_number as value, acte_number as label 
           FROM documents 
           WHERE acte_number LIKE ? 
           LIMIT ?`,
          [searchTerm, parseInt(limit)]
        );
        break;

      case 'registre_number':
        suggestions = queryAll(
          `SELECT DISTINCT registre_number as value, registre_number as label 
           FROM documents 
           WHERE registre_number LIKE ? 
           LIMIT ?`,
          [searchTerm, parseInt(limit)]
        );
        break;

      case 'agent':
        suggestions = queryAll(
          `SELECT DISTINCT u.id as value, 
                  COALESCE(u.full_name, u.username) as label,
                  u.username
           FROM users u
           WHERE u.role = 'agent' 
             AND (u.username LIKE ? OR u.full_name LIKE ?)
           LIMIT ?`,
          [searchTerm, searchTerm, parseInt(limit)]
        );
        break;

      case 'supervisor':
        suggestions = queryAll(
          `SELECT DISTINCT u.id as value, 
                  COALESCE(u.full_name, u.username) as label,
                  u.username
           FROM users u
           WHERE u.role = 'supervisor' 
             AND (u.username LIKE ? OR u.full_name LIKE ?)
           LIMIT ?`,
          [searchTerm, searchTerm, parseInt(limit)]
        );
        break;

      default:
        suggestions = [];
    }

    res.json({
      success: true,
      suggestions,
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message,
    });
  }
}

/**
 * Get popular search terms
 * GET /api/search/popular
 */
async function getPopularSearches(req, res) {
  try {
    // This would typically come from a search_history table
    // For now, return some static popular searches
    const popular = [
      { term: 'pending', count: 0, type: 'status' },
      { term: 'rejected', count: 0, type: 'status' },
      { term: '2024', count: 0, type: 'year' },
      { term: 'Anfa', count: 0, type: 'bureau' },
    ];

    res.json({
      success: true,
      popular,
    });

  } catch (error) {
    console.error('Get popular searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular searches',
      error: error.message,
    });
  }
}

/**
 * Get search facets (counts for each filter option)
 * GET /api/search/facets
 */
async function getSearchFacets(req, res) {
  try {
    const { query } = req.query;
    
    let baseCondition = '1=1';
    const params = [];

    // Apply role-based filtering
    if (req.user.role === 'agent') {
      baseCondition += ' AND uploaded_by = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'supervisor') {
      const bureaux = User.getBureaus(req.user.id);
      if (bureaux.length > 0) {
        const placeholders = bureaux.map(() => '?').join(',');
        baseCondition += ` AND bureau IN (${placeholders})`;
        params.push(...bureaux);
      }
    }

    // Add text search if provided
    if (query) {
      baseCondition += ` AND (
        original_filename LIKE ? OR
        acte_number LIKE ? OR
        registre_number LIKE ? OR
        bureau LIKE ?
      )`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get facets for each dimension
    const bureauFacets = queryAll(
      `SELECT bureau as value, COUNT(*) as count 
       FROM documents 
       WHERE ${baseCondition} 
       GROUP BY bureau 
       ORDER BY count DESC`,
      params
    );

    const typeFacets = queryAll(
      `SELECT registre_type as value, COUNT(*) as count 
       FROM documents 
       WHERE ${baseCondition} 
       GROUP BY registre_type 
       ORDER BY count DESC`,
      params
    );

    const yearFacets = queryAll(
      `SELECT year as value, COUNT(*) as count 
       FROM documents 
       WHERE ${baseCondition} 
       GROUP BY year 
       ORDER BY year DESC`,
      params
    );

    const statusFacets = queryAll(
      `SELECT status as value, COUNT(*) as count 
       FROM documents 
       WHERE ${baseCondition} 
       GROUP BY status 
       ORDER BY count DESC`,
      params
    );

    res.json({
      success: true,
      facets: {
        bureaux: bureauFacets,
        types: typeFacets,
        years: yearFacets,
        statuses: statusFacets,
      },
    });

  } catch (error) {
    console.error('Get search facets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search facets',
      error: error.message,
    });
  }
}

module.exports = {
  advancedSearch,
  getSearchSuggestions,
  getPopularSearches,
  getSearchFacets,
};
