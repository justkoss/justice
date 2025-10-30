const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const SERVER_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: Check if server is running
async function testServerHealth() {
  log('\n[Test 1] Checking server health...', 'blue');
  try {
    const response = await axios.get(`${SERVER_URL}/api/health`);
    log('✓ Server is running', 'green');
    log(`  Response: ${response.data.message}`);
    return true;
  } catch (error) {
    log('✗ Server is not responding', 'red');
    log(`  Error: ${error.message}`, 'red');
    return false;
  }
}

// Test 2: Create a dummy PDF for testing
function createDummyPDF() {
  log('\n[Test 2] Creating dummy PDF...', 'blue');
  const testFilePath = path.join(__dirname, 'test-document.pdf');
  
  // Create a minimal PDF file
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
409
%%EOF`;
  
  fs.writeFileSync(testFilePath, pdfContent);
  log('✓ Dummy PDF created', 'green');
  log(`  Location: ${testFilePath}`);
  return testFilePath;
}

// Test 3: Sync document to server
async function testSyncDocument(filePath) {
  log('\n[Test 3] Syncing document to server...', 'blue');
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('metadata', JSON.stringify({
      filename: 'test-document.pdf',
      name: 'Test Case Document',
      year: 2024,
      processedAt: new Date().toISOString(),
      desktopDocumentId: 'test-123'
    }));
    
    const response = await axios.post(`${SERVER_URL}/api/sync`, formData, {
      headers: formData.getHeaders()
    });
    
    log('✓ Document synced successfully', 'green');
    log(`  Server ID: ${response.data.document.id}`);
    log(`  Status: ${response.data.document.status}`);
    return response.data.document.id;
  } catch (error) {
    log('✗ Sync failed', 'red');
    log(`  Error: ${error.message}`, 'red');
    return null;
  }
}

// Test 4: Get all documents
async function testGetDocuments() {
  log('\n[Test 4] Retrieving all documents...', 'blue');
  try {
    const response = await axios.get(`${SERVER_URL}/api/documents`);
    log('✓ Retrieved documents', 'green');
    log(`  Total documents: ${response.data.count}`);
    
    response.data.documents.forEach((doc, index) => {
      log(`  [${index + 1}] ${doc.originalFilename} (${doc.status})`);
    });
    
    return response.data.documents;
  } catch (error) {
    log('✗ Failed to retrieve documents', 'red');
    log(`  Error: ${error.message}`, 'red');
    return [];
  }
}

// Test 5: Mark document as completed
async function testCompleteDocument(docId) {
  log('\n[Test 5] Marking document as completed...', 'blue');
  try {
    const response = await axios.post(`${SERVER_URL}/api/documents/${docId}/complete`);
    log('✓ Document marked as completed', 'green');
    log(`  Status: ${response.data.document.status}`);
    return true;
  } catch (error) {
    log('✗ Failed to complete document', 'red');
    log(`  Error: ${error.message}`, 'red');
    return false;
  }
}

// Test 6: Delete document
async function testDeleteDocument(docId) {
  log('\n[Test 6] Deleting document...', 'blue');
  try {
    const response = await axios.delete(`${SERVER_URL}/api/documents/${docId}`);
    log('✓ Document deleted', 'green');
    return true;
  } catch (error) {
    log('✗ Failed to delete document', 'red');
    log(`  Error: ${error.message}`, 'red');
    return false;
  }
}

// Cleanup
function cleanup() {
  log('\n[Cleanup] Removing test files...', 'blue');
  const testFilePath = path.join(__dirname, 'test-document.pdf');
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
    log('✓ Test files removed', 'green');
  }
}

// Main test runner
async function runTests() {
  log('\n╔════════════════════════════════════════╗', 'yellow');
  log('║  Justice PDF Sync Server - Tests      ║', 'yellow');
  log('╚════════════════════════════════════════╝', 'yellow');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Test 1: Server health
    const serverRunning = await testServerHealth();
    if (!serverRunning) {
      log('\n⚠ Server is not running. Please start the server first:', 'yellow');
      log('  npm start', 'yellow');
      process.exit(1);
    }
    testsPassed++;
    
    // Test 2: Create dummy PDF
    const testFilePath = createDummyPDF();
    testsPassed++;
    
    // Test 3: Sync document
    const docId = await testSyncDocument(testFilePath);
    if (docId) {
      testsPassed++;
      
      // Test 4: Get documents
      const docs = await testGetDocuments();
      if (docs.length > 0) testsPassed++;
      else testsFailed++;
      
      // Test 5: Complete document
      const completed = await testCompleteDocument(docId);
      if (completed) testsPassed++;
      else testsFailed++;
      
      // Test 6: Delete document
      const deleted = await testDeleteDocument(docId);
      if (deleted) testsPassed++;
      else testsFailed++;
    } else {
      testsFailed += 4;
    }
    
  } catch (error) {
    log(`\n✗ Test suite failed: ${error.message}`, 'red');
    testsFailed++;
  } finally {
    cleanup();
  }
  
  // Summary
  log('\n╔════════════════════════════════════════╗', 'yellow');
  log('║  Test Summary                          ║', 'yellow');
  log('╚════════════════════════════════════════╝', 'yellow');
  log(`\n✓ Passed: ${testsPassed}`, 'green');
  log(`✗ Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  
  if (testsFailed === 0) {
    log('\n🎉 All tests passed! Your sync server is working correctly.', 'green');
  } else {
    log('\n⚠ Some tests failed. Please check the errors above.', 'yellow');
  }
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests();