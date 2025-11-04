const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database.db');

let db;

/**
 * Initialize the database and create all tables
 */
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    console.log('📂 Loading existing database...');
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    console.log('🆕 Creating new database...');
    db = new SQL.Database();
  }
  
  // Create all tables
  createTables();
  
  // Save database to disk
  saveDatabase();
  
  console.log('✅ Database initialized successfully');
  
  // Seed default data
  await seedDefaultData();
  
  return db;
}

/**
 * Create all database tables
 */
function createTables() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT,
      full_name TEXT,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('agent', 'supervisor', 'admin')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Bureau assignments for supervisors
  db.run(`
    CREATE TABLE IF NOT EXISTS supervisor_bureaus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supervisor_id INTEGER NOT NULL,
      bureau TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(supervisor_id, bureau)
    )
  `);

  // Documents table (updated with new statuses)
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      
      -- Metadata from desktop app
      bureau TEXT NOT NULL,
      registre_type TEXT NOT NULL,
      year INTEGER NOT NULL,
      registre_number TEXT NOT NULL,
      acte_number TEXT NOT NULL,
      
      -- Status and workflow (updated to include processing and fields_extracted)
      status TEXT NOT NULL DEFAULT 'pending' 
        CHECK(status IN ('pending', 'reviewing', 'rejected_for_update', 'stored', 'processing', 'fields_extracted')),
      
      -- User tracking
      uploaded_by INTEGER NOT NULL,
      reviewed_by INTEGER,
      
      -- Timestamps
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME, 
      reviewed_at DATETIME,
      stored_at DATETIME,
      
      -- Rejection details
      rejection_reason TEXT,
      rejection_error_type TEXT,
      
      -- Virtual tree path (e.g., Anfa/naissances/2024/R001/A0001.pdf)
      virtual_path TEXT,
      
      -- Desktop app compatibility
      desktop_document_id TEXT,
      processed_at DATETIME,
      
      FOREIGN KEY (uploaded_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    )
  `);

  // Create indexes for documents table
  db.run(`CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_documents_bureau ON documents(bureau)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_documents_year ON documents(year)`);

  // Document fields table (NEW)
  db.run(`
    CREATE TABLE IF NOT EXISTS document_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      field_name TEXT NOT NULL,
      field_value TEXT,
      field_type TEXT DEFAULT 'text',
      field_order INTEGER DEFAULT 0,
      updated_by INTEGER NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )
  `);

  // Create indexes for document_fields table
  db.run(`CREATE INDEX IF NOT EXISTS idx_document_fields_document_id ON document_fields(document_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_document_fields_name ON document_fields(field_name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_document_fields_value ON document_fields(field_value)`);

  // Document history table
  db.run(`
    CREATE TABLE IF NOT EXISTS document_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      performed_by INTEGER NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (performed_by) REFERENCES users(id)
    )
  `);

  // Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      document_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
    )
  `);

  // Login sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS login_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      logout_time DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

/**
 * Seed default data (admin user, test users, bureaux, etc.)
 */
async function seedDefaultData() {
  // Check if admin exists
  const adminExists = queryOne('SELECT id FROM users WHERE role = ?', ['admin']);
  
  if (!adminExists) {
    console.log('👤 Creating default admin user...');
    
    const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'justice2024';
    const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@acteflow.local';
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    runQuery(`
      INSERT INTO users (username, password, email, full_name, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [username, hashedPassword, email, 'Administrator', 'admin', 'active']);
    
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   Default Admin User Created          ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
    console.log(`  Email: ${email}`);
    console.log('  ⚠️  Change this password in production!\n');
  }
}

/**
 * Save database to disk
 */
function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/**
 * Execute a query and return all results
 */
function queryAll(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * Execute a query and return first result
 */
function queryOne(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute a query that doesn't return results (INSERT, UPDATE, DELETE)
 */
function runQuery(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  try {
    db.run(sql, params);
    
    // Immediately get the last inserted ID before saving
    const result = queryOne('SELECT last_insert_rowid() AS id');

    // Only save after confirming insert succeeded
    saveDatabase();

    return result ? result.id : null;
  } catch (error) {
    console.error('Error running query:', error.message);
    throw error;
  }
}


/**
 * Execute multiple queries in a transaction
 */
function transaction(callback) {
  if (!db) throw new Error('Database not initialized');
  
  try {
    db.run('BEGIN TRANSACTION');
    callback();
    db.run('COMMIT');
    saveDatabase();
    return true;
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
}

/**
 * Get database instance
 */
function getDb() {
  return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  saveDatabase,
  queryAll,
  queryOne,
  runQuery,
  transaction,
  getDb,
  closeDatabase
};
