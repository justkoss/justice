const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const chokidar = require('chokidar');
const bcrypt = require('bcryptjs');

// Fix UTF-8 encoding for file operations
const fsPromises = fs.promises;

// Fix console encoding for Windows
if (process.platform === 'win32') {
  try {
    require('child_process').execSync('chcp 65001', { stdio: 'ignore' });
  } catch (e) {
    // Ignore errors
  }
}

let mainWindow;
let db;
let watcher;
let watchedFolder = null;
let dbPath;
let isAuthenticated = false;
let jwtToken = null; // Store JWT token
let serverUrl = 'http://localhost:3000'; // Default server URL

async function initDatabase() {
  dbPath = path.join(app.getPath('userData'), 'documents.db');
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Documents table with bureau field
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL UNIQUE,
      bureau TEXT,
      acte_number TEXT,
      registre_number TEXT,
      year INTEGER,
      registre_type TEXT,
      processed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Auth table with token storage
  db.run(`
    CREATE TABLE IF NOT EXISTS local_auth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT,
      server_user_id INTEGER,
      jwt_token TEXT,
      refresh_token TEXT,
      last_sync DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reuploaded_docs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_doc_id INTEGER NOT NULL UNIQUE,
      new_filepath TEXT NOT NULL,
      reuploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  saveDatabase();
  
  // Load watched folder
  const savedFolder = queryDb('SELECT value FROM settings WHERE key = ?', ['watched_folder']);
  if (savedFolder.length > 0 && fs.existsSync(savedFolder[0].value)) {
    watchedFolder = savedFolder[0].value;
    startFolderWatch(watchedFolder);
  }
  
  // Load server URL
  const savedServerUrl = queryDb('SELECT value FROM settings WHERE key = ?', ['server_url']);
  if (savedServerUrl.length > 0) {
    serverUrl = savedServerUrl[0].value;
  }
  
  // Load JWT token if exists
  const savedToken = queryDb('SELECT jwt_token FROM local_auth LIMIT 1');
  if (savedToken.length > 0 && savedToken[0].jwt_token) {
    jwtToken = savedToken[0].jwt_token;
  }
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
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

function startFolderWatch(folderPath) {
  if (watcher) {
    watcher.close();
  }
  
  watchedFolder = folderPath;
  
  // Save to settings
  const existing = queryDb('SELECT value FROM settings WHERE key = ?', ['watched_folder']);
  if (existing.length > 0) {
    runDb('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', 
      [folderPath, 'watched_folder']);
  } else {
    runDb('INSERT INTO settings (key, value) VALUES (?, ?)', 
      ['watched_folder', folderPath]);
  }
  
  watcher = chokidar.watch(folderPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: false,
    encoding: 'utf8'
  });

  watcher
    .on('add', (filePath) => {
      if (path.extname(filePath).toLowerCase() === '.pdf') {
        const filename = path.basename(filePath);
        
        const existing = queryDb('SELECT * FROM documents WHERE filepath = ?', [filePath]);
        
        if (existing.length === 0) {
          runDb('INSERT INTO documents (filename, filepath) VALUES (?, ?)', [filename, filePath]);
          mainWindow.webContents.send('document-added', {
            filename,
            filepath: filePath
          });
        }
      }
    })
    .on('unlink', (filePath) => {
      runDb('DELETE FROM documents WHERE filepath = ?', [filePath]);
      mainWindow.webContents.send('document-removed', filePath);
    });
}

async function isServerOnline(url) {
  try {
    const res = await fetch(`${url}/api/health`, { method: 'GET', timeout: 4000 });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok' || data.success === true;
  } catch {
    return false;
  }
}


app.whenReady().then(async () => {
  await initDatabase();
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (watcher) {
    watcher.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Auth handlers
ipcMain.handle('check-local-auth', () => {
  const localUser = queryDb('SELECT * FROM local_auth LIMIT 1');
  return localUser.length > 0;
});

ipcMain.handle('local-login', async (event, username, password) => {
  try {
    const users = queryDb('SELECT * FROM local_auth WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return { success: false, message: 'Utilisateur introuvable' };
    }
    
    const user = users[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    
    if (!isPasswordValid) {
      return { success: false, message: 'Mot de passe invalide' };
    }
    
    isAuthenticated = true;
    jwtToken = user.jwt_token; // Load stored token
    return { 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      },
      token: user.jwt_token
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('check-server-health', async (event, url) => {
  try {
    const res = await fetch(`${url}/api/health`, { method: 'GET' });
    if (!res.ok) return false;
    const data = await res.json();
    // Accept either "ok" or "OK" or a success flag
    const status = String(data.status || '').toLowerCase();
    return status === 'ok' || data.success === true;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
});

ipcMain.handle('server-login', async (event, username, password, serverUrlParam) => {
  try {
    serverUrl = serverUrlParam || serverUrl;
    
    // Save server URL
    const existingUrl = queryDb('SELECT value FROM settings WHERE key = ?', ['server_url']);
    if (existingUrl.length > 0) {
      runDb('UPDATE settings SET value = ? WHERE key = ?', [serverUrl, 'server_url']);
    } else {
      runDb('INSERT INTO settings (key, value) VALUES (?, ?)', ['server_url', serverUrl]);
    }
    
    // Try to authenticate with server
    const response = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      return result;
    }
    
    // Store JWT token
    jwtToken = result.token;
    
    // Save user locally with tokens
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Check if user already exists locally
    const existingUser = queryDb('SELECT * FROM local_auth WHERE username = ?', [username]);
    
    if (existingUser.length > 0) {
      // Update existing user with new tokens
      runDb('UPDATE local_auth SET password = ?, jwt_token = ?, refresh_token = ?, last_sync = CURRENT_TIMESTAMP WHERE username = ?',
        [hashedPassword, result.token, result.refreshToken || '', username]);
    } else {
      // Insert new user with tokens
      runDb('INSERT INTO local_auth (username, password, email, server_user_id, jwt_token, refresh_token, last_sync) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [username, hashedPassword, result.user.email, result.user.id, result.token, result.refreshToken || '']);
    }
    
    isAuthenticated = true;
    return result;
    
  } catch (error) {
    return { success: false, message: `Erreur serveur: ${error.message}` };
  }
});

ipcMain.handle('get-jwt-token', () => {
  return jwtToken;
});

ipcMain.handle('get-server-url', () => {
  return serverUrl;
});

// Fetch rejected documents from server
ipcMain.handle('fetch-rejected-documents', async () => {
  try {
    if (!jwtToken) {
      return { success: false, message: 'Non authentifié' };
    }
    
    const response = await fetch(`${serverUrl}/api/documents?status=rejected_for_update`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      documents: result.documents || []
    };
    
  } catch (error) {
    console.error('Error fetching rejected documents:', error);
    return { success: false, message: error.message, documents: [] };
  }
});

// Download rejected document file from server
ipcMain.handle('download-rejected-document', async (event, documentId) => {
  try {
    if (!jwtToken) {
      return { success: false, message: 'Non authentifié' };
    }
    
    // Get document details first
    const response = await fetch(`${serverUrl}/api/documents/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    const result = await response.json();
    const doc = result.document;
    
    // Download the actual PDF file
    const fileResponse = await fetch(`${serverUrl}/files/pending/${doc.filename}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }
    
    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Save to temp location
    const tempDir = path.join(app.getPath('temp'), 'acteflow-rejections');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const localPath = path.join(tempDir, doc.original_filename);
    fs.writeFileSync(localPath, buffer);
    
    return {
      success: true,
      filepath: localPath,
      document: doc
    };
    
  } catch (error) {
    console.error('Error downloading rejected document:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('logout', () => {
  isAuthenticated = false;
  jwtToken = null;
  mainWindow.loadFile('login.html');
  return { success: true };
});

ipcMain.handle('load-main-app', () => {
  mainWindow.loadFile('index.html');
});

// Document handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0];
    startFolderWatch(folderPath);
    return folderPath;
  }
  return null;
});

ipcMain.handle('get-documents', () => {
  return queryDb('SELECT * FROM documents ORDER BY created_at DESC');
});

ipcMain.handle('update-document', (event, id, data) => {
  runDb('UPDATE documents SET bureau = ?, acte_number = ?, registre_number = ?, year = ?, registre_type = ?, processed = 1 WHERE id = ?', 
    [data.bureau, data.acteNumber, data.registreNumber, data.year, data.registreType, id]);
  return queryDb('SELECT * FROM documents WHERE id = ?', [id])[0];
});

ipcMain.handle('select-file-for-reupload', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-watched-folder', () => {
  return watchedFolder;
});

ipcMain.handle('delete-document', (event, id, filepath) => {
  try {
    // Delete from database
    runDb('DELETE FROM documents WHERE id = ?', [id]);
    
    // Delete physical file
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message };
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#0f1419',
    titleBarStyle: 'hiddenInset'
  });

  // Check if user is authenticated
  const localUser = queryDb('SELECT * FROM local_auth LIMIT 1');
  
  if (localUser.length > 0) {
    // User exists locally, load main app
    mainWindow.loadFile('index.html');
    isAuthenticated = true;
    jwtToken = localUser[0].jwt_token;
  } else {
    // No local user, load login page
    mainWindow.loadFile('login.html');
    isAuthenticated = false;
  }
}


ipcMain.handle('mark-document-reuploaded', (event, serverDocId, newFilePath) => {
  try {
    // Check if already exists
    const existing = queryDb('SELECT * FROM reuploaded_docs WHERE server_doc_id = ?', [serverDocId]);
    
    if (existing.length > 0) {
      // Update existing
      runDb('UPDATE reuploaded_docs SET new_filepath = ?, reuploaded_at = CURRENT_TIMESTAMP WHERE server_doc_id = ?',
        [newFilePath, serverDocId]);
    } else {
      // Insert new
      runDb('INSERT INTO reuploaded_docs (server_doc_id, new_filepath) VALUES (?, ?)',
        [serverDocId, newFilePath]);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error marking document as reuploaded:', error);
    return { success: false, message: error.message };
  }
});

// 3. Add new IPC handler to get reuploaded docs:

ipcMain.handle('get-reuploaded-docs', () => {
  try {
    const docs = queryDb('SELECT * FROM reuploaded_docs');
    return docs;
  } catch (error) {
    console.error('Error getting reuploaded docs:', error);
    return [];
  }
});

// 4. Add new IPC handler to clear reuploaded status (when supervisor approves):

ipcMain.handle('clear-reupload-status', (event, serverDocId) => {
  try {
    runDb('DELETE FROM reuploaded_docs WHERE server_doc_id = ?', [serverDocId]);
    return { success: true };
  } catch (error) {
    console.error('Error clearing reupload status:', error);
    return { success: false, message: error.message };
  }
});

// mainWindow.webContents.openDevTools();