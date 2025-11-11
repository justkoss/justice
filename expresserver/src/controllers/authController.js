const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { runQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Login endpoint - Compatible with desktop app
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Authenticate user
    const result = User.authenticate(username, password);
    
    if (!result.success) {
      // Log failed login attempt
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      logger.logAuthFailure(username, result.message, ipAddress, userAgent);
      
      return res.status(401).json(result);
    }
    
    // Generate tokens
    const token = generateToken(result.user);
    const refreshToken = generateRefreshToken(result.user);
    
    // Log session
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    runQuery(`
      INSERT INTO login_sessions (user_id, token, ip_address, user_agent)
      VALUES (?, ?, ?, ?)
    `, [result.user.id, token, ipAddress, userAgent]);
    
    // Log successful login
    // Create a temporary req object with user for logging
    const tempReq = { 
      ...req, 
      user: result.user,
      ip: ipAddress,
      get: (header) => req.headers[header.toLowerCase()]
    };
    logger.logUserLogin(tempReq, result.user.id, username);
    
    console.log(`✅ User logged in: ${username} (${result.user.role})`);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: result.user,
      token,
      refreshToken
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Verify user endpoint - Compatible with desktop app
 * POST /api/auth/verify
 */
async function verify(req, res) {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    const user = User.findByUsername(username);
    
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json({
        success: true,
        exists: true,
        user: userWithoutPassword
      });
    } else {
      res.json({
        success: true,
        exists: false
      });
    }
    
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Get current user
 * GET /api/auth/me
 */
async function getCurrentUser(req, res) {
  try {
    // User is already attached by auth middleware
    const user = User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Logout
 * POST /api/auth/logout
 */
async function logout(req, res) {
  try {
    // Mark session as logged out
    const token = req.headers.authorization?.substring(7);
    
    if (token) {
      runQuery(`
        UPDATE login_sessions 
        SET logout_time = CURRENT_TIMESTAMP 
        WHERE token = ?
      `, [token]);
    }
    
    // Log logout
    logger.logUserLogout(req, req.user.id, req.user.username);
    
    console.log(`✅ User logged out: ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Refresh token
 * POST /api/auth/refresh
 */
async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    // Get user
    const user = User.findById(decoded.id);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    // Generate new tokens
    const { password, ...userWithoutPassword } = user;
    const newToken = generateToken(userWithoutPassword);
    const newRefreshToken = generateRefreshToken(userWithoutPassword);
    
    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = {
  login,
  verify,
  getCurrentUser,
  logout,
  refreshToken
};