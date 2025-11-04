require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import database
const { initDatabase, closeDatabase } = require('./src/config/database');

// Import middleware
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth');
const documentRoutes = require('./src/routes/documents');
const treeRoutes = require('./src/routes/tree');
const fieldsRoutes = require('./src/routes/fields');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database first
let server;

initDatabase().then(() => {
  console.log('✅ Database initialized\n');
  
  // Middleware
  app.use(helmet()); // Security headers
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev')); // HTTP request logger
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      message: 'acteFlow backend is running',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });
  
  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api', documentRoutes); // Includes /api/sync for desktop app compatibility
  app.use('/api/tree', treeRoutes);
  // Serve static files (uploaded documents) - only for authenticated users
  // Note: In production, use nginx or similar for static file serving
  app.use('/files', express.static(path.join(__dirname, 'storage')));
  app.use('/api/documents', fieldsRoutes);

  // 404 handler
  app.use(notFound);
  
  // Global error handler
  app.use(errorHandler);
  
  // Start server
  server = app.listen(PORT, () => {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║           acteFlow Backend Server                 ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log(`\n🚀 Server running on: http://localhost:${PORT}`);
    console.log(`📂 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: ${process.env.DB_PATH || './database.db'}`);
    console.log(`📁 Upload directory: ${process.env.UPLOAD_DIR || './uploads'}`);
    console.log(`🗄️  Storage directory: ${process.env.STORAGE_DIR || './storage'}`);
    console.log('\n📡 API Endpoints:');
    console.log('  GET    /api/health                 - Health check');
    console.log('  POST   /api/auth/login             - User login');
    console.log('  POST   /api/auth/verify            - Verify user');
    console.log('  GET    /api/auth/me                - Get current user');
    console.log('  POST   /api/auth/logout            - Logout');
    console.log('  POST   /api/sync                   - Sync document (Desktop app)');
    console.log('  GET    /api/documents              - Get all documents');
    console.log('  GET    /api/documents/stats        - Get statistics');
    console.log('  GET    /api/documents/:id          - Get document by ID');
    console.log('  PUT    /api/documents/:id/review   - Start review');
    console.log('  POST   /api/documents/:id/approve  - Approve document');
    console.log('  POST   /api/documents/:id/reject   - Reject document');
    console.log('  GET    /api/documents/:id/history  - Get document history');
    console.log('\n✨ Server ready to accept connections!\n');
  });
  
}).catch(error => {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('\n🛑 Shutting down gracefully...');
  
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
      closeDatabase();
      console.log('✅ Database closed');
      process.exit(0);
    });
  } else {
    closeDatabase();
    process.exit(0);
  }
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown');
    process.exit(1);
  }, 10000);
}

module.exports = app;
