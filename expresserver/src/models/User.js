const bcrypt = require('bcryptjs');
const { queryAll, queryOne, runQuery, transaction } = require('../config/database');

class User {
  /**
   * Find user by username
   */
  static findByUsername(username) {
    return queryOne('SELECT * FROM users WHERE username = ?', [username]);
  }
  
  /**
   * Find user by ID
   */
  static findById(id) {
    return queryOne('SELECT * FROM users WHERE id = ?', [id]);
  }
  
  /**
   * Find user by email
   */
  static findByEmail(email) {
    return queryOne('SELECT * FROM users WHERE email = ?', [email]);
  }
  
  /**
   * Get all users with optional filters
   */
  static findAll(filters = {}) {
    let sql = 'SELECT id, username, email, full_name, phone, role, status, created_at, updated_at, last_login FROM users WHERE 1=1';
    const params = [];
    
    if (filters.role) {
      sql += ' AND role = ?';
      params.push(filters.role);
    }
    
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.search) {
      sql += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
      
      if (filters.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }
    }
    
    return queryAll(sql, params);
  }
  
  /**
   * Create new user
   */
  static create(userData) {
    const { username, password, email, full_name, phone, role = 'agent' } = userData;
    
    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const userId = runQuery(`
      INSERT INTO users (username, password, email, full_name, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [username, hashedPassword, email, full_name, phone, role, 'active']);
    
    return this.findById(userId);
  }
  
  /**
   * Update user
   */
  static update(id, userData) {
    const updates = [];
    const params = [];
    
    if (userData.email !== undefined) {
      updates.push('email = ?');
      params.push(userData.email);
    }
    
    if (userData.full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(userData.full_name);
    }
    
    if (userData.phone !== undefined) {
      updates.push('phone = ?');
      params.push(userData.phone);
    }
    
    if (userData.role !== undefined) {
      updates.push('role = ?');
      params.push(userData.role);
    }
    
    if (userData.status !== undefined) {
      updates.push('status = ?');
      params.push(userData.status);
    }
    
    if (userData.password) {
      updates.push('password = ?');
      params.push(bcrypt.hashSync(userData.password, 10));
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    if (updates.length === 1) {
      return this.findById(id);
    }
    
    runQuery(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);
    
    return this.findById(id);
  }
  
  /**
   * Delete user (soft delete by setting status to inactive)
   */
  static delete(id) {
    runQuery('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['inactive', id]);
    return true;
  }
  
  /**
   * Hard delete user (permanent)
   */
  static hardDelete(id) {
    runQuery('DELETE FROM users WHERE id = ?', [id]);
    return true;
  }
  
  /**
   * Authenticate user with username and password
   */
  static authenticate(username, password) {
    const user = this.findByUsername(username);
    
    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }
    
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid username or password' };
    }
    
    if (user.status !== 'active') {
      return { success: false, message: 'User account is inactive' };
    }
    
    // Update last login
    runQuery('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      success: true,
      user: userWithoutPassword
    };
  }
  
  /**
   * Update password
   */
  static updatePassword(id, newPassword) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    runQuery('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, id]);
    return true;
  }
  
  /**
   * Get user statistics
   */
  static getStats(userId) {
    const stats = {
      uploaded: 0,
      pending: 0,
      reviewing: 0,
      rejected: 0,
      stored: 0
    };
    
    const user = this.findById(userId);
    if (!user) return stats;
    
    if (user.role === 'agent') {
      // Stats for agent
      stats.uploaded = queryOne('SELECT COUNT(*) as count FROM documents WHERE uploaded_by = ?', [userId])?.count || 0;
      stats.pending = queryOne('SELECT COUNT(*) as count FROM documents WHERE uploaded_by = ? AND status = ?', [userId, 'pending'])?.count || 0;
      stats.rejected = queryOne('SELECT COUNT(*) as count FROM documents WHERE uploaded_by = ? AND status = ?', [userId, 'rejected_for_update'])?.count || 0;
      stats.stored = queryOne('SELECT COUNT(*) as count FROM documents WHERE uploaded_by = ? AND status = ?', [userId, 'stored'])?.count || 0;
    } else if (user.role === 'supervisor') {
      // Stats for supervisor
      stats.reviewed = queryOne('SELECT COUNT(*) as count FROM documents WHERE reviewed_by = ?', [userId])?.count || 0;
      stats.approved = queryOne('SELECT COUNT(*) as count FROM documents WHERE reviewed_by = ? AND status = ?', [userId, 'stored'])?.count || 0;
      stats.rejected = queryOne('SELECT COUNT(*) as count FROM documents WHERE reviewed_by = ? AND status = ?', [userId, 'rejected_for_update'])?.count || 0;
    }
    
    return stats;
  }
  
  /**
   * Assign bureaus to supervisor
   */
  static assignBureaus(supervisorId, bureaux) {
    const user = this.findById(supervisorId);
    
    if (!user || user.role !== 'supervisor') {
      throw new Error('User is not a supervisor');
    }
    
    // Remove existing assignments
    runQuery('DELETE FROM supervisor_bureaus WHERE supervisor_id = ?', [supervisorId]);
    
    // Add new assignments
    if (bureaux && bureaux.length > 0) {
      bureaux.forEach(bureau => {
        runQuery('INSERT INTO supervisor_bureaus (supervisor_id, bureau) VALUES (?, ?)', [supervisorId, bureau]);
      });
    }
    
    return this.getBureaus(supervisorId);
  }
  
  /**
   * Get assigned bureaus for supervisor
   */
  static getBureaus(supervisorId) {
    const bureaux = queryAll('SELECT bureau FROM supervisor_bureaus WHERE supervisor_id = ?', [supervisorId]);
    return bureaux.map(b => b.bureau);
  }
}

module.exports = User;
