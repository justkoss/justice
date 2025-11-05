const User = require('../models/User');
const { runQuery } = require('../config/database');

/**
 * Get all users with filters
 * GET /api/users
 */
async function getUsers(req, res) {
  try {
    const filters = {
      role: req.query.role,
      status: req.query.status,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const users = User.findAll(filters);
    const total = users.length;

    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      success: true,
      users: usersWithoutPasswords,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset + filters.limit) < total,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve users',
    });
  }
}

/**
 * Get single user by ID
 * GET /api/users/:id
 */
async function getUser(req, res) {
  try {
    const user = User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { password, ...userWithoutPassword } = user;

    // Get assigned bureaux for supervisors
    let assignedBureaux = [];
    if (user.role === 'supervisor') {
      assignedBureaux = User.getBureaus(user.id);
    }

    res.json({
      success: true,
      user: {
        ...userWithoutPassword,
        assignedBureaux,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user',
    });
  }
}

/**
 * Create new user
 * POST /api/users
 */
async function createUser(req, res) {
  try {
    const { username, password, email, full_name, phone, role } = req.body;

    // Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Username, password, and role are required',
      });
    }

    // Check if username already exists
    const existingUser = User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists',
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists',
        });
      }
    }

    // Create user
    const user = User.create({
      username,
      password,
      email,
      full_name,
      phone,
      role,
    });

    const { password: _, ...userWithoutPassword } = user;

    console.log(`✅ User created: ${username} (${role}) by ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      details: error.message,
    });
  }
}

/**
 * Update user
 * PUT /api/users/:id
 */
async function updateUser(req, res) {
  try {
    const userId = parseInt(req.params.id);
    const { email, full_name, phone, role, status, password } = req.body;

    const user = User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Prevent user from changing their own role or status
    if (userId === req.user.id && (role || status)) {
      return res.status(403).json({
        success: false,
        error: 'Cannot change your own role or status',
      });
    }

    // Check if email already exists (if changing email)
    if (email && email !== user.email) {
      const existingEmail = User.findByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists',
        });
      }
    }

    // Update user
    const updatedUser = User.update(userId, {
      email,
      full_name,
      phone,
      role,
      status,
      password,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    console.log(`✅ User updated: ${updatedUser.username} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      details: error.message,
    });
  }
}

/**
 * Delete user (soft delete - set status to inactive)
 * DELETE /api/users/:id
 */
async function deleteUser(req, res) {
  try {
    const userId = parseInt(req.params.id);

    const user = User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Prevent user from deleting themselves
    if (userId === req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete your own account',
      });
    }

    // Soft delete (set status to inactive)
    User.delete(userId);

    console.log(`✅ User deleted: ${user.username} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
}

/**
 * Assign bureaux to supervisor
 * POST /api/users/:id/bureaus
 */
async function assignBureaus(req, res) {
  try {
    const userId = parseInt(req.params.id);
    const { bureaux } = req.body;

    if (!Array.isArray(bureaux)) {
      return res.status(400).json({
        success: false,
        error: 'Bureaux must be an array',
      });
    }

    const user = User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (user.role !== 'supervisor') {
      return res.status(400).json({
        success: false,
        error: 'User is not a supervisor',
      });
    }

    // Assign bureaux
    const assignedBureaux = User.assignBureaus(userId, bureaux);

    console.log(`✅ Bureaux assigned to ${user.username}: ${bureaux.join(', ')}`);

    res.json({
      success: true,
      message: 'Bureaux assigned successfully',
      bureaux: assignedBureaux,
    });
  } catch (error) {
    console.error('Assign bureaux error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign bureaux',
      details: error.message,
    });
  }
}

/**
 * Get user statistics
 * GET /api/users/:id/stats
 */
async function getUserStats(req, res) {
  try {
    const userId = parseInt(req.params.id);

    const user = User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const stats = User.getStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user statistics',
    });
  }
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  assignBureaus,
  getUserStats,
};
