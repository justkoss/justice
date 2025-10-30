const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const METADATA_FILE = path.join(__dirname, 'documents_metadata.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Replace this with your actual project upload endpoint
const PROJECT_UPLOAD_URL = process.env.PROJECT_UPLOAD_URL || 'https://your-project.com/api/upload';

// Helper functions
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

// Upload a single document to your project
async function uploadToProject(document) {
  try {
    console.log(`Téléchargement: ${document.originalFilename}...`);
    
    // Read the file
    const fileBuffer = fs.readFileSync(document.storedPath);
    
    // Create form data for upload
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('file', fileBuffer, document.originalFilename);
    formData.append('acteNumber', document.acteNumber || '');
    formData.append('registreNumber', document.registreNumber || '');
    formData.append('year', document.year || '');
    formData.append('registreType', document.registreType || '');
    formData.append('processedAt', document.processedAt);
    
    // Upload to your project
    // Replace this with your actual upload logic
    const response = await axios.post(PROJECT_UPLOAD_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        // Add any authentication headers here
        // 'Authorization': `Bearer ${YOUR_API_KEY}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log(`✓ Téléchargé: ${document.originalFilename}`);
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error(`✗ Échec du téléchargement pour ${document.originalFilename}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Delete document after successful upload
function deleteDocument(document) {
  try {
    // Delete physical file
    if (fs.existsSync(document.storedPath)) {
      fs.unlinkSync(document.storedPath);
      console.log(`✓ Fichier supprimé: ${document.originalFilename}`);
    }
    
    // Remove from metadata
    const documents = readMetadata();
    const filteredDocs = documents.filter(d => d.id !== document.id);
    writeMetadata(filteredDocs);
    console.log(`✓ Supprimé des métadonnées: ${document.originalFilename}`);
    
    return true;
  } catch (error) {
    console.error(`✗ Échec de la suppression pour ${document.originalFilename}:`, error.message);
    return false;
  }
}

// Process all pending documents
async function processAllDocuments() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  Traitement des documents synchronisés ║');
  console.log('╚═══════════════════════════════════════╝\n');
  
  const documents = readMetadata();
  const pendingDocs = documents.filter(d => d.status === 'pending');
  
  if (pendingDocs.length === 0) {
    console.log('Aucun document en attente à traiter.\n');
    return;
  }
  
  console.log(`${pendingDocs.length} document(s) en attente trouvé(s)\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const doc of pendingDocs) {
    console.log(`\n[${successCount + failCount + 1}/${pendingDocs.length}] Traitement: ${doc.originalFilename}`);
    console.log(`  Numéro d'acte: ${doc.acteNumber || 'N/A'}`);
    console.log(`  Numéro de registre: ${doc.registreNumber || 'N/A'}`);
    console.log(`  Année: ${doc.year || 'N/A'}`);
    console.log(`  Type: ${doc.registreType || 'N/A'}`);
    console.log(`  Taille: ${(doc.fileSize / 1024).toFixed(2)} KB`);
    
    // Upload to your project
    const uploadResult = await uploadToProject(doc);
    
    if (uploadResult.success) {
      // Mark as completed
      const allDocs = readMetadata();
      const docIndex = allDocs.findIndex(d => d.id === doc.id);
      if (docIndex !== -1) {
        allDocs[docIndex].status = 'completed';
        allDocs[docIndex].completedAt = new Date().toISOString();
        writeMetadata(allDocs);
      }
      
      // Delete the file
      deleteDocument(doc);
      
      successCount++;
    } else {
      failCount++;
    }
    
    // Add a small delay between uploads
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  Traitement terminé                    ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log(`\n✓ Succès: ${successCount}`);
  console.log(`✗ Échecs: ${failCount}`);
  console.log('');
}

// Main execution
if (require.main === module) {
  processAllDocuments()
    .then(() => {
      console.log('Terminé!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = {
  uploadToProject,
  deleteDocument,
  processAllDocuments
};