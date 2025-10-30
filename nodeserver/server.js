const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const authDb = require('./auth-db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize auth database - now async
let dbInitialized = false;

authDb.initAuthDatabase().then(() => {
  dbInitialized = true;
  console.log('✓ Système d\'authentification prêt');
}).catch(err => {
  console.error('Échec de l\'initialisation de la base d\'authentification:', err);
  process.exit(1);
});

// Directories
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const METADATA_FILE = path.join(__dirname, 'documents_metadata.json');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Helper functions for metadata management
function readMetadata() {
  if (!fs.existsSync(METADATA_FILE)) {
    return [];
  }
  const data = fs.readFileSync(METADATA_FILE, 'utf8');
  return JSON.parse(data);
}

function writeMetadata(data) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2));
}

function addDocument(metadata) {
  const documents = readMetadata();
  const newDoc = {
    id: Date.now().toString(),
    ...metadata,
    syncedAt: new Date().toISOString(),
    status: 'pending' // pending, uploaded, completed
  };
  documents.push(newDoc);
  writeMetadata(documents);
  return newDoc;
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur de synchronisation en cours d\'exécution' });
});

// Authentication endpoints

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le nom d\'utilisateur et le mot de passe sont requis' 
      });
    }
    
    const result = authDb.authenticateUser(username, password);
    
    if (!result.success) {
      return res.status(401).json(result);
    }
    
    // Log the session
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    authDb.logLoginSession(result.user.id, ipAddress, userAgent);
    
    console.log(`✓ Utilisateur connecté: ${username}`);
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      user: result.user
    });
    
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur' 
    });
  }
});

// Verify user endpoint (for checking if user exists)
app.post('/api/auth/verify', (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le nom d\'utilisateur est requis' 
      });
    }
    
    const user = authDb.getUserByUsername(username);
    
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
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur' 
    });
  }
});

// Sync endpoint - receives file + metadata with new fields
app.post('/api/sync', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier téléchargé' });
    }

    const metadata = JSON.parse(req.body.metadata);
    
    const documentData = {
      originalFilename: metadata.filename,
      storedFilename: req.file.filename,
      storedPath: req.file.path,
      bureau: metadata.bureau,
      acteNumber: metadata.acteNumber,
      registreNumber: metadata.registreNumber,
      year: metadata.year,
      registreType: metadata.registreType,
      processedAt: metadata.processedAt,
      fileSize: req.file.size,
      desktopDocumentId: metadata.desktopDocumentId
    };

    const savedDoc = addDocument(documentData);

    console.log(`✓ Document synchronisé: ${savedDoc.originalFilename}`);
    
    res.json({
      success: true,
      message: 'Document synchronisé avec succès',
      document: savedDoc
    });

  } catch (error) {
    console.error('Erreur de synchronisation:', error);
    res.status(500).json({ 
      error: 'Échec de la synchronisation du document',
      details: error.message 
    });
  }
});

// Get all synced documents
app.get('/api/documents', (req, res) => {
  try {
    const documents = readMetadata();
    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la récupération des documents' });
  }
});

// Get single document by ID
app.get('/api/documents/:id', (req, res) => {
  try {
    const documents = readMetadata();
    const document = documents.find(d => d.id === req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document introuvable' });
    }
    
    res.json({
      success: true,
      document
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la récupération du document' });
  }
});

// Mark document as uploaded (for your project upload process)
app.post('/api/documents/:id/complete', (req, res) => {
  try {
    const documents = readMetadata();
    const docIndex = documents.findIndex(d => d.id === req.params.id);
    
    if (docIndex === -1) {
      return res.status(404).json({ error: 'Document introuvable' });
    }
    
    documents[docIndex].status = 'completed';
    documents[docIndex].completedAt = new Date().toISOString();
    writeMetadata(documents);
    
    res.json({
      success: true,
      message: 'Document marqué comme terminé',
      document: documents[docIndex]
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la mise à jour du document' });
  }
});

// Delete document (after successful upload to your project)
app.delete('/api/documents/:id', (req, res) => {
  try {
    const documents = readMetadata();
    const docIndex = documents.findIndex(d => d.id === req.params.id);
    
    if (docIndex === -1) {
      return res.status(404).json({ error: 'Document introuvable' });
    }
    
    const document = documents[docIndex];
    
    // Delete physical file
    if (fs.existsSync(document.storedPath)) {
      fs.unlinkSync(document.storedPath);
    }
    
    // Remove from metadata
    documents.splice(docIndex, 1);
    writeMetadata(documents);
    
    console.log(`✓ Document supprimé: ${document.originalFilename}`);
    
    res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la suppression du document' });
  }
});

// Batch process: Mark multiple documents as uploaded
app.post('/api/documents/batch-complete', (req, res) => {
  try {
    const { documentIds } = req.body;
    
    if (!Array.isArray(documentIds)) {
      return res.status(400).json({ error: 'documentIds doit être un tableau' });
    }
    
    const documents = readMetadata();
    let updatedCount = 0;
    
    documentIds.forEach(id => {
      const docIndex = documents.findIndex(d => d.id === id);
      if (docIndex !== -1) {
        documents[docIndex].status = 'completed';
        documents[docIndex].completedAt = new Date().toISOString();
        updatedCount++;
      }
    });
    
    writeMetadata(documents);
    
    res.json({
      success: true,
      message: `${updatedCount} documents marqués comme terminés`,
      updatedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Échec de la mise à jour en lot des documents' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║  Serveur de Sync Justice PDF          ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log(`\n🚀 Serveur: http://localhost:${PORT}`);
  console.log(`📁 Téléchargements: ${UPLOAD_DIR}`);
  console.log(`📊 Métadonnées: ${METADATA_FILE}`);
  console.log(`🔐 Auth DB: ${path.join(__dirname, 'auth.db')}\n`);
  console.log('Points de terminaison:');
  console.log('  POST   /api/auth/login        - Authentification utilisateur');
  console.log('  POST   /api/auth/verify       - Vérifier le nom d\'utilisateur');
  console.log('  POST   /api/sync              - Synchroniser un document');
  console.log('  GET    /api/documents         - Lister tous les documents');
  console.log('  GET    /api/documents/:id     - Obtenir un document par ID');
  console.log('  POST   /api/documents/:id/complete - Marquer comme terminé');
  console.log('  DELETE /api/documents/:id     - Supprimer un document');
  console.log('  POST   /api/documents/batch-complete - Terminer en lot\n');
});