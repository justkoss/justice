const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'auth.db');

let db;

async function initAuthDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);
  
  // Create sessions table for tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS login_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
  
  saveDatabase();
  console.log('✓ Base de données d\'authentification initialisée');
  
  // Seed initial user if no users exist
  seedDefaultUser();
  
  return db;
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function queryDb(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function runDb(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
}

function seedDefaultUser() {
  const users = queryDb('SELECT COUNT(*) as count FROM users');
  
  if (users[0].count === 0) {
    const defaultUsername = process.env.DEFAULT_USERNAME || 'admin';
    const defaultPassword = process.env.DEFAULT_PASSWORD || 'justice2024';
    
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
    
    runDb(`
      INSERT INTO users (username, password, email)
      VALUES (?, ?, ?)
    `, [defaultUsername, hashedPassword, 'admin@justice.local']);
    
    console.log('╔═══════════════════════════════════════╗');
    console.log('║  Utilisateur par défaut créé          ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`  Nom d'utilisateur: ${defaultUsername}`);
    console.log(`  Mot de passe: ${defaultPassword}`);
    console.log('  ⚠️  Veuillez changer ce mot de passe en production!\n');
  }
}

function authenticateUser(username, password) {
  const users = queryDb('SELECT * FROM users WHERE username = ?', [username]);
  
  if (users.length === 0) {
    return { success: false, message: 'Nom d\'utilisateur ou mot de passe invalide' };
  }
  
  const user = users[0];
  const isPasswordValid = bcrypt.compareSync(password, user.password);
  
  if (!isPasswordValid) {
    return { success: false, message: 'Nom d\'utilisateur ou mot de passe invalide' };
  }
  
  // Update last login
  runDb('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    success: true,
    user: userWithoutPassword
  };
}

function getUserByUsername(username) {
  const users = queryDb('SELECT * FROM users WHERE username = ?', [username]);
  return users.length > 0 ? users[0] : null;
}

function updateUserPassword(userId, newPassword) {
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  runDb(`
    UPDATE users 
    SET password = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `, [hashedPassword, userId]);
  return true;
}

function logLoginSession(userId, ipAddress, userAgent) {
  runDb(`
    INSERT INTO login_sessions (user_id, ip_address, user_agent)
    VALUES (?, ?, ?)
  `, [userId, ipAddress, userAgent]);
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

module.exports = {
  initAuthDatabase,
  authenticateUser,
  getUserByUsername,
  updateUserPassword,
  logLoginSession,
  hashPassword,
  comparePassword
};