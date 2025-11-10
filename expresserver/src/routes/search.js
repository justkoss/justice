const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  advancedSearch,
  getSearchSuggestions,
  getPopularSearches,
  getSearchFacets,
} = require('../controllers/searchController');

/**
 * All search routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/search
 * @desc    Advanced document search with filters
 * @access  Private (Agent: own docs, Supervisor: assigned bureaux, Admin: all)
 * @query   {
 *   query: string,              // Text search
 *   bureau: string,             // Single or comma-separated
 *   registre_type: string,      // Single or comma-separated
 *   year: string,               // Single, comma-separated, or range (2020-2024)
 *   registre_number: string,
 *   acte_number: string,
 *   status: string,             // Single or comma-separated
 *   uploaded_by: number,
 *   reviewed_by: number,
 *   agent_name: string,
 *   supervisor_name: string,
 *   date_from: string,
 *   date_to: string,
 *   uploaded_from: string,
 *   uploaded_to: string,
 *   reviewed_from: string,
 *   reviewed_to: string,
 *   sort_by: string,            // Default: uploaded_at
 *   sort_order: string,         // ASC or DESC
 *   page: number,               // Default: 1
 *   limit: number               // Default: 20, Max: 100
 * }
 */
router.get('/', advancedSearch);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get autocomplete suggestions
 * @access  Private
 * @query   {
 *   type: string,    // acte_number, registre_number, agent, supervisor
 *   query: string,   // Search term (min 2 chars)
 *   limit: number    // Default: 10
 * }
 */
router.get('/suggestions', getSearchSuggestions);

/**
 * @route   GET /api/search/popular
 * @desc    Get popular search terms
 * @access  Private
 */
router.get('/popular', getPopularSearches);

/**
 * @route   GET /api/search/facets
 * @desc    Get facet counts for filters
 * @access  Private
 * @query   {
 *   query: string  // Optional text search to filter facets
 * }
 */
router.get('/facets', getSearchFacets);

module.exports = router;
