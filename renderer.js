const { ipcRenderer } = require('electron');
const path = require('path');

let documents = [];
let currentDocument = null;
let currentFilter = 'all';
let watchedFolder = null;
let currentTab = 'documents';
let rejectedDocuments = [];
let currentRejectedDoc = null;
let selectedNewFile = null;
let reuploadedDocs = []; // Track locally which docs have been re-uploaded
const fs = require('fs');
const logFile = path.join(__dirname, 'app.log');

function logToFile(msg) {
  const entry = `${new Date().toISOString()} - ${msg}\n`;
  fs.appendFileSync(logFile, entry);
  console.log(msg);
}
// Bureau list
const bureaux = [
  'Aïn Chock', 'Aïn Sebaâ', 'Al Fida', 'Anfa', 'Ben M\'sik',
  'Essoukhour Assawda', 'Hay Hassani', 'Hay Mohammadi', 'Maârif',
  'Mers Sultan', 'Moulay Rachid', 'Sbata', 'Sidi Belyout',
  'Sidi Bernoussi', 'Sidi Moumen', 'Sidi Othman'
];

// Registre types
const registreTypes = {
  naissances: i18n.t('registreTypes.naissances'),
  deces: i18n.t('registreTypes.deces'),
  jugements: i18n.t('registreTypes.jugements'),
  transcriptions: i18n.t('registreTypes.transcriptions'),
  etrangers: i18n.t('registreTypes.etrangers')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Application starting...');
  
  // Initialize i18n
  i18n.init();
  
  // Setup language switcher
  setupLanguageSwitcher();
  
  // Setup notifications
  setupNotifications();
  
  // Load watched folder
  watchedFolder = await ipcRenderer.invoke('get-watched-folder');
  if (watchedFolder) {
    displayWatchedFolder(watchedFolder);
  }
  
  // Load documents
  await loadDocuments();
  
  // Load rejected documents for modifications tab
  await loadRejectedDocuments();
  
  // Load reuploaded docs status
  await loadReuploadedDocs();
  
  // Setup event listeners
  setupEventListeners();
  
  // Initialize searchable selects
  initializeSearchableSelects();
  
  console.log('Application initialized');
});

// Setup Language Switcher
function setupLanguageSwitcher() {
  const languageSwitcher = document.getElementById('languageSwitcher');
  const langCode = languageSwitcher.querySelector('.lang-code');
  
  // Set initial language display
  langCode.textContent = i18n.getLanguage().toUpperCase();
  
  languageSwitcher.addEventListener('click', () => {
    const currentLang = i18n.getLanguage();
    const newLang = currentLang === 'fr' ? 'ar' : 'fr';
    i18n.setLanguage(newLang);
    langCode.textContent = newLang.toUpperCase();
    
    // Re-render everything with new language
    renderDocumentList();
    renderModificationList();
    if (currentDocument) {
      showProcessingForm(currentDocument);
    }
    if (currentRejectedDoc) {
      showModificationForm(currentRejectedDoc);
    }
  });
}

// Setup Notifications
function setupNotifications() {
  const notificationsBtn = document.getElementById('notificationsBtn');
  const notificationsDropdown = document.getElementById('notificationsDropdown');
  const closeNotifications = document.getElementById('closeNotifications');
  const notificationBadge = document.getElementById('notificationBadge');
  
  // Toggle dropdown
  notificationsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = notificationsDropdown.style.display === 'block';
    notificationsDropdown.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      updateNotificationsList();
    }
  });
  
  // Close dropdown
  closeNotifications.addEventListener('click', () => {
    notificationsDropdown.style.display = 'none';
  });
  
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!notificationsBtn.contains(e.target) && !notificationsDropdown.contains(e.target)) {
      notificationsDropdown.style.display = 'none';
    }
  });
  
  // Update badge count
  updateNotificationBadge();
}

async function updateNotificationsList() {
  const notificationsList = document.getElementById('notificationsList');
  
  // Get rejected documents count (excluding reuploaded ones)
  const activeRejectedDocs = rejectedDocuments.filter(doc => !isDocumentReuploaded(doc.id));
  const rejectedCount = activeRejectedDocs.length;
  
  if (rejectedCount === 0) {
    notificationsList.innerHTML = `
      <div class="empty-notifications">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <p data-i18n="notifications.empty">${i18n.t('notifications.empty')}</p>
      </div>
    `;
    return;
  }
  
  // Show notifications
  notificationsList.innerHTML = activeRejectedDocs.map(doc => `
    <div class="notification-item unread" data-doc-id="${doc.id}">
      <div class="notification-header">
        <div class="notification-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </div>
        <div class="notification-content">
          <div class="notification-title">${i18n.t('notifications.newModification')}</div>
          <div class="notification-message">${doc.original_filename}</div>
          <div class="notification-time">${formatDate(doc.reviewed_at)}</div>
        </div>
      </div>
    </div>
  `).join('');
  
  // Add click handlers
  notificationsList.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', () => {
      const docId = parseInt(item.dataset.docId);
      const doc = rejectedDocuments.find(d => d.id === docId);
      if (doc && !isDocumentReuploaded(doc.id)) {
        // Switch to modifications tab
        switchTab('modifications');
        // Show the document
        showModificationForm(doc);
        // Close dropdown
        document.getElementById('notificationsDropdown').style.display = 'none';
      }
    });
  });
}

function updateNotificationBadge() {
  const notificationBadge = document.getElementById('notificationBadge');
  // Only count documents that haven't been reuploaded yet
  const activeCount = rejectedDocuments.filter(doc => !isDocumentReuploaded(doc.id)).length;
  
  if (activeCount > 0) {
    notificationBadge.textContent = activeCount;
    notificationBadge.style.display = 'flex';
  } else {
    notificationBadge.style.display = 'none';
  }
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return i18n.getLanguage() === 'fr' ? 'À l\'instant' : 'الآن';
  if (diffMins < 60) return `${diffMins} ${i18n.getLanguage() === 'fr' ? 'min' : 'د'}`;
  if (diffHours < 24) return `${diffHours} ${i18n.getLanguage() === 'fr' ? 'h' : 'س'}`;
  if (diffDays < 7) return `${diffDays} ${i18n.getLanguage() === 'fr' ? 'j' : 'ي'}`;
  
  return date.toLocaleDateString(i18n.getLanguage() === 'fr' ? 'fr-FR' : 'ar-MA');
}

// Setup Event Listeners
function setupEventListeners() {
  // Select folder button
  document.getElementById('selectFolderBtn').addEventListener('click', async () => {
    const folder = await ipcRenderer.invoke('select-folder');
    if (folder) {
      watchedFolder = folder;
      displayWatchedFolder(folder);
      await loadDocuments();
    }
  });
  
  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await ipcRenderer.invoke('logout');
  });
  
  // Tab switching
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });
  
  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentFilter = tab.dataset.filter;
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderDocumentList();
    });
  });
  
  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveDocument);
  
  // Sync button
  document.getElementById('syncBtn').addEventListener('click', syncDocument);
  
  // Sync All button
  document.getElementById('syncAllBtn').addEventListener('click', syncAllProcessedDocuments);
  
  // Reupload button
  document.getElementById('reuploadBtn').addEventListener('click', selectNewFileForReupload);
  
  // Save modification button
  document.getElementById('saveModificationBtn').addEventListener('click', saveModification);
}

function switchTab(tabName) {
  currentTab = tabName;
  
  // Update tab buttons
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  if (tabName === 'documents') {
    document.getElementById('documentsTab').classList.add('active');
    renderDocumentList();
  } else if (tabName === 'modifications') {
    document.getElementById('modificationsTab').classList.add('active');
    renderModificationList();
  }
  
  // Hide both forms
  hideAllForms();
}

function displayWatchedFolder(folder) {
  const display = document.getElementById('watchedFolderDisplay');
  display.style.display = 'flex';
  display.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
    <span>${folder}</span>
  `;
}

// Load Documents
async function loadDocuments() {
  documents = await ipcRenderer.invoke('get-documents');
  renderDocumentList();
}

// Load Rejected Documents
async function loadRejectedDocuments() {
  const result = await ipcRenderer.invoke('fetch-rejected-documents');
  if (result.success) {
    rejectedDocuments = result.documents || [];
    renderModificationList();
    updateNotificationBadge();
    updateNotificationsList();
  }
}

// Load reuploaded docs status
async function loadReuploadedDocs() {
  reuploadedDocs = await ipcRenderer.invoke('get-reuploaded-docs') || [];
}

// Check if document has been reuploaded
function isDocumentReuploaded(serverDocId) {
  return reuploadedDocs.some(doc => doc.server_doc_id === serverDocId);
}

// Render Document List
function renderDocumentList() {
  const list = document.getElementById('documentList');
  
  let filtered = documents;
  if (currentFilter === 'processed') {
    filtered = documents.filter(d => d.processed === 1);
  } else if (currentFilter === 'unprocessed') {
    filtered = documents.filter(d => d.processed === 0);
  }
  
  // Update filter counts
  const allCount = documents.length;
  const processedCount = documents.filter(d => d.processed === 1).length;
  const unprocessedCount = documents.filter(d => d.processed === 0).length;
  
  document.querySelectorAll('.filter-tab').forEach(tab => {
    const filter = tab.dataset.filter;
    const badge = tab.querySelector('.count-badge');
    
    if (badge) {
      if (filter === 'all') badge.textContent = allCount;
      else if (filter === 'processed') badge.textContent = processedCount;
      else if (filter === 'unprocessed') badge.textContent = unprocessedCount;
    } else {
      const count = filter === 'all' ? allCount : 
                    filter === 'processed' ? processedCount : unprocessedCount;
      const countBadge = document.createElement('span');
      countBadge.className = 'count-badge';
      countBadge.textContent = count;
      tab.appendChild(countBadge);
    }
  });
  
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <p data-i18n="documentList.empty">${i18n.t('documentList.empty')}</p>
        <small data-i18n="documentList.emptyHint">${i18n.t('documentList.emptyHint')}</small>
      </div>
    `;
    return;
  }
  
  list.innerHTML = filtered.map(doc => {
    const isActive = currentDocument && currentDocument.id === doc.id;
    const statusClass = doc.processed ? 'processed' : 'unprocessed';
    const statusText = doc.processed ? 
      i18n.t('processing.status.processed') : 
      i18n.t('processing.status.unprocessed');
    
    return `
      <div class="document-item ${statusClass} ${isActive ? 'active' : ''}" data-id="${doc.id}">
        <div class="doc-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        <div class="doc-info">
          <div class="doc-name">${doc.filename}</div>
          <div class="doc-meta">
            ${doc.year ? `<span class="doc-year">${doc.year}</span>` : ''}
            ${doc.bureau ? `<span class="doc-bureau">${doc.bureau}</span>` : ''}
            <span class="status-${statusClass}">${statusText}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  list.querySelectorAll('.document-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id);
      const doc = documents.find(d => d.id === id);
      if (doc) {
        currentDocument = doc;
        showProcessingForm(doc);
        renderDocumentList(); // Re-render to update active state
      }
    });
  });
}

// Render Modification List
function renderModificationList() {
  const list = document.getElementById('modificationList');
  
  if (rejectedDocuments.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        <p data-i18n="documentList.noModifications">${i18n.t('documentList.noModifications')}</p>
        <small data-i18n="documentList.modificationsHint">${i18n.t('documentList.modificationsHint')}</small>
      </div>
    `;
    return;
  }
  
  list.innerHTML = rejectedDocuments.map(doc => {
    const isActive = currentRejectedDoc && currentRejectedDoc.id === doc.id;
    const isReuploaded = isDocumentReuploaded(doc.id);
    const disabledClass = isReuploaded ? 'disabled' : '';
    const statusBadge = isReuploaded ? 
      `<span class="badge badge-pending">${i18n.t('modification.awaitingReview')}</span>` : 
      `<span class="error-badge">${i18n.t('processing.errorType')}</span>`;
    
    return `
      <div class="document-item modification-item ${isActive && !isReuploaded ? 'active' : ''} ${disabledClass}" 
           data-id="${doc.id}" 
           ${isReuploaded ? 'data-disabled="true"' : ''}>
        <div class="doc-icon error-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${isReuploaded ? `
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            ` : `
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <circle cx="12" cy="17" r="0.5"></circle>
            `}
          </svg>
        </div>
        <div class="doc-info">
          <div class="doc-name">${doc.original_filename}</div>
          <div class="doc-meta">
            ${doc.year ? `<span class="doc-year">${doc.year}</span>` : ''}
            ${doc.bureau ? `<span class="doc-bureau">${doc.bureau}</span>` : ''}
            ${statusBadge}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  list.querySelectorAll('.document-item').forEach(item => {
    item.addEventListener('click', () => {
      // Check if disabled
      if (item.dataset.disabled === 'true') {
        return; // Don't allow clicking on disabled items
      }
      
      const id = parseInt(item.dataset.id);
      const doc = rejectedDocuments.find(d => d.id === id);
      if (doc) {
        currentRejectedDoc = doc;
        selectedNewFile = null; // Reset selected file
        showModificationForm(doc);
        renderModificationList(); // Re-render to update active state
      }
    });
  });
}

// Show Processing Form
function showProcessingForm(doc) {
  // Hide other forms
  document.getElementById('modificationForm').style.display = 'none';
  document.getElementById('noDocumentSelected').style.display = 'none';
  
  // Show processing form
  const form = document.getElementById('processingForm');
  form.style.display = 'flex';
  
  // Update current file name
  document.getElementById('currentFileName').textContent = doc.filename;
  
  // Populate form fields
  document.getElementById('bureau').value = doc.bureau || '';
  document.getElementById('registreType').value = doc.registre_type || '';
  document.getElementById('documentYear').value = doc.year || '';
  document.getElementById('registreNumber').value = doc.registre_number || '';
  document.getElementById('acteNumber').value = doc.acte_number || '';
  
  // Update status badge
  const statusBadge = document.getElementById('statusBadge');
  if (doc.processed) {
    statusBadge.className = 'badge badge-processed';
    statusBadge.setAttribute('data-i18n', 'processing.status.processed');
    statusBadge.textContent = i18n.t('processing.status.processed');
  } else {
    statusBadge.className = 'badge badge-unprocessed';
    statusBadge.setAttribute('data-i18n', 'processing.status.unprocessed');
    statusBadge.textContent = i18n.t('processing.status.unprocessed');
  }
  
  // Update sync button state
  const syncBtn = document.getElementById('syncBtn');
  syncBtn.disabled = !doc.processed;
  
  // Show document
  showDocument(doc.filepath);
}

// Show Modification Form
async function showModificationForm(doc) {
  // Hide other forms
  document.getElementById('processingForm').style.display = 'none';
  document.getElementById('noDocumentSelected').style.display = 'none';
  
  // Show modification form
  const form = document.getElementById('modificationForm');
  form.style.display = 'flex';
  
  // Reset selected file
  selectedNewFile = null;
  
  // Update current file name
  document.getElementById('modFileName').textContent = doc.original_filename;
  
  // Display error information
  document.getElementById('errorType').textContent = doc.rejection_error_type || i18n.t('processing.errorType');
  document.getElementById('agentMessage').textContent = doc.rejection_reason || '';
  // logToFile('doc :'+ JSON.stringify(doc));
  // Populate metadata fields
  document.getElementById('modBureau').value = doc.bureau || '';
  document.getElementById('modBureauSearch').value = doc.bureau || '';
  document.getElementById('modRegistreType').value = doc.registre_type || '';
  document.getElementById('modDocumentYear').value = doc.year || '';
  document.getElementById('modRegistreNumber').value = doc.registre_number || '';
  document.getElementById('modActeNumber').value = doc.acte_number || '';
  
  // Reset button states
  const reuploadBtn = document.getElementById('reuploadBtn');
  const saveBtn = document.getElementById('saveModificationBtn');
  
  reuploadBtn.disabled = false;
  reuploadBtn.classList.remove('btn-success');
  reuploadBtn.querySelector('span').setAttribute('data-i18n', 'processing.selectNewFile');
  reuploadBtn.querySelector('span').textContent = i18n.t('processing.selectNewFile');
  
  saveBtn.disabled = true;
  saveBtn.classList.add('opacity-50');
  
  // Download and display document
  const result = await ipcRenderer.invoke('download-rejected-document', doc.id);
  if (result.success) {
    showDocument(result.filepath);
  } else {
    console.error('Failed to download document:', result.message);
  }
}

// Select New File for Reupload
async function selectNewFileForReupload() {
  const filePath = await ipcRenderer.invoke('select-file-for-reupload');
  
  if (filePath) {
    selectedNewFile = filePath;
    
    // Update button to show success
    const reuploadBtn = document.getElementById('reuploadBtn');
    reuploadBtn.classList.add('btn-success');
    reuploadBtn.querySelector('span').textContent = i18n.t('processing.fileSelected');
    
    // Enable save button
    const saveBtn = document.getElementById('saveModificationBtn');
    saveBtn.disabled = false;
    saveBtn.classList.remove('opacity-50');
    
    // Show the new file in viewer
    showDocument(filePath);
    
    // Show info message
    showSyncStatus(i18n.t('processing.newFileSelected'), 'success');
  }
}

// Save Modification
async function saveModification() {
  if (!selectedNewFile) {
    alert(i18n.t('processing.mustSelectNewFile'));
    return;
  }
  
  if (!currentRejectedDoc) {
    return;
  }
  
  // Get form data
  const bureau = document.getElementById('modBureau').value;
  const registreType = document.getElementById('modRegistreType').value;
  const year = document.getElementById('modDocumentYear').value;
  const registreNumber = document.getElementById('modRegistreNumber').value;
  const acteNumber = document.getElementById('modActeNumber').value;
  
  // Validate
  if (!bureau || !registreType || !year || !registreNumber || !acteNumber) {
    alert(i18n.t('processing.fillAllFields'));
    return;
  }
  
  // Disable button and show loading
  const saveBtn = document.getElementById('saveModificationBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = `
    <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
    <span>${i18n.t('modification.uploading')}</span>
  `;
  
  showSyncStatus(i18n.t('modification.sendingToServer'), 'loading');
  
  try {
    // Get JWT token and server URL
    const token = await ipcRenderer.invoke('get-jwt-token');
    const serverUrl = await ipcRenderer.invoke('get-server-url');
    
    // Create FormData
    const formData = new FormData();
    
    // Read file as blob
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(selectedNewFile);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, path.basename(selectedNewFile));
    
    // Add metadata
    const metadata = {
      filename: path.basename(selectedNewFile),
      bureau: bureau,
      registreType: registreType,
      year: parseInt(year),
      registreNumber: registreNumber,
      acteNumber: acteNumber,
      desktopDocumentId: `reupload-${currentRejectedDoc.id}-${Date.now()}`,
      processedAt: new Date().toISOString()
    };
    
    formData.append('metadata', JSON.stringify(metadata));
    
    // Send to server
    const response = await fetch(`${serverUrl}/api/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Mark as reuploaded locally
      await ipcRenderer.invoke('mark-document-reuploaded', currentRejectedDoc.id, selectedNewFile);
      
      // Reload reuploaded docs
      await loadReuploadedDocs();
      
      // Show success
      showSyncStatus(i18n.t('modification.sentSuccess'), 'success');
      
      // Update button to show sent state
      saveBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${i18n.t('modification.sent')}</span>
      `;
      saveBtn.classList.add('btn-success');
      
      // Update notification badge
      updateNotificationBadge();
      
      // Refresh modification list to show disabled state
      renderModificationList();
      
      // Clear current rejected doc and hide form after a delay
      setTimeout(() => {
        currentRejectedDoc = null;
        selectedNewFile = null;
        hideAllForms();
      }, 2000);
      
    } else {
      throw new Error(result.message || 'Upload failed');
    }
    
  } catch (error) {
    console.error('Error saving modification:', error);
    showSyncStatus(`✗ ${error.message}`, 'error');
    
    // Re-enable button
    saveBtn.disabled = false;
    saveBtn.classList.remove('opacity-50');
    saveBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span data-i18n="processing.confirmAndSend">${i18n.t('processing.confirmAndSend')}</span>
    `;
  }
}

// Show Document
function showDocument(filepath) {
  const viewer = document.getElementById('documentViewer');
  const noSelection = document.getElementById('noSelection');
  const pdfEmbed = document.getElementById('pdfEmbed');
  
  noSelection.style.display = 'none';
  viewer.style.display = 'block';
  
  pdfEmbed.src = filepath;
}

// Hide All Forms
function hideAllForms() {
  document.getElementById('processingForm').style.display = 'none';
  document.getElementById('modificationForm').style.display = 'none';
  document.getElementById('noDocumentSelected').style.display = 'flex';
  document.getElementById('documentViewer').style.display = 'none';
  document.getElementById('noSelection').style.display = 'flex';
}

// Save Document
async function saveDocument() {
  if (!currentDocument) return;
  
  const bureau = document.getElementById('bureau').value;
  const registreType = document.getElementById('registreType').value;
  const year = document.getElementById('documentYear').value;
  const registreNumber = document.getElementById('registreNumber').value;
  const acteNumber = document.getElementById('acteNumber').value;
  
  if (!bureau || !registreType || !year || !registreNumber || !acteNumber) {
    alert(i18n.t('processing.fillAllFields'));
    return;
  }
  
  const data = {
    bureau,
    registreType,
    year: parseInt(year),
    registreNumber,
    acteNumber
  };
  
  const updated = await ipcRenderer.invoke('update-document', currentDocument.id, data);
  
  // Update local document
  const index = documents.findIndex(d => d.id === currentDocument.id);
  if (index !== -1) {
    documents[index] = updated;
    currentDocument = updated;
  }
  
  // Re-render
  renderDocumentList();
  showProcessingForm(updated);
}

// Sync Document
async function syncDocument() {
  if (!currentDocument || !currentDocument.processed) {
    return;
  }
  
  const syncBtn = document.getElementById('syncBtn');
  syncBtn.disabled = true;
  syncBtn.innerHTML = `
    <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
    <span>${i18n.t('sync.syncing')}</span>
  `;
  
  showSyncStatus(i18n.t('sync.syncing'), 'loading');
  
  try {
    const token = await ipcRenderer.invoke('get-jwt-token');
    const serverUrl = await ipcRenderer.invoke('get-server-url');
    
    // Create FormData
    const formData = new FormData();
    
    // Read file
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(currentDocument.filepath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, currentDocument.filename);
    
    // Add metadata
    const metadata = {
      filename: currentDocument.filename,
      bureau: currentDocument.bureau,
      registreType: currentDocument.registre_type,
      year: currentDocument.year,
      registreNumber: currentDocument.registre_number,
      acteNumber: currentDocument.acte_number,
      desktopDocumentId: currentDocument.id.toString(),
      processedAt: new Date().toISOString()
    };
    
    formData.append('metadata', JSON.stringify(metadata));
    
    // Send to server
    const response = await fetch(`${serverUrl}/api/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Delete local document
      await ipcRenderer.invoke('delete-document', currentDocument.id, currentDocument.filepath);
      
      // Remove from list
      documents = documents.filter(d => d.id !== currentDocument.id);
      currentDocument = null;
      
      // Show success
      showSyncStatus(i18n.t('sync.success').replace('{count}', '1'), 'success');
      
      // Re-render and hide form
      renderDocumentList();
      hideAllForms();
      
    } else {
      throw new Error(result.error || 'Sync failed');
    }
    
  } catch (error) {
    console.error('Sync error:', error);
    showSyncStatus(`✗ ${error.message}`, 'error');
    
    // Re-enable button
    syncBtn.disabled = false;
    syncBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
      </svg>
      <span data-i18n="processing.sync">${i18n.t('processing.sync')}</span>
    `;
  }
}

// Sync All Processed Documents
async function syncAllProcessedDocuments() {
  const processedDocs = documents.filter(d => d.processed === 1);
  
  if (processedDocs.length === 0) {
    showSyncAllStatus(i18n.t('sync.noProcessed'), 'warning');
    return;
  }
  
  const syncAllBtn = document.getElementById('syncAllBtn');
  syncAllBtn.disabled = true;
  
  let successCount = 0;
  let failedCount = 0;
  
  showSyncAllStatus(i18n.t('sync.progress').replace('{current}', '0').replace('{total}', processedDocs.length), 'loading');
  
  for (let i = 0; i < processedDocs.length; i++) {
    const doc = processedDocs[i];
    
    try {
      const token = await ipcRenderer.invoke('get-jwt-token');
      const serverUrl = await ipcRenderer.invoke('get-server-url');
      
      const formData = new FormData();
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(doc.filepath);
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      formData.append('file', blob, doc.filename);
      
      const metadata = {
        filename: doc.filename,
        bureau: doc.bureau,
        registreType: doc.registre_type,
        year: doc.year,
        registreNumber: doc.registre_number,
        acteNumber: doc.acte_number,
        desktopDocumentId: doc.id.toString(),
        processedAt: new Date().toISOString()
      };
      
      formData.append('metadata', JSON.stringify(metadata));
      
      const response = await fetch(`${serverUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        await ipcRenderer.invoke('delete-document', doc.id, doc.filepath);
        successCount++;
      } else {
        failedCount++;
      }
      
    } catch (error) {
      console.error(`Failed to sync ${doc.filename}:`, error);
      failedCount++;
    }
    
    // Update progress
    showSyncAllStatus(
      i18n.t('sync.progress').replace('{current}', (i + 1).toString()).replace('{total}', processedDocs.length),
      'loading'
    );
  }
  
  // Reload documents
  await loadDocuments();
  
  // Show final result
  if (failedCount === 0) {
    showSyncAllStatus(i18n.t('sync.success').replace('{count}', successCount.toString()), 'success');
  } else {
    showSyncAllStatus(
      i18n.t('sync.partial').replace('{success}', successCount.toString()).replace('{failed}', failedCount.toString()),
      'warning'
    );
  }
  
  // Re-enable button
  syncAllBtn.disabled = false;
  
  // Hide status after delay
  setTimeout(() => {
    document.getElementById('syncAllStatus').style.display = 'none';
  }, 5000);
}

function showSyncStatus(message, type) {
  const statusDiv = document.getElementById('syncStatus');
  statusDiv.textContent = message;
  statusDiv.className = `sync-status sync-status-${type}`;
  statusDiv.style.display = 'flex';
  
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

function showSyncAllStatus(message, type) {
  const statusDiv = document.getElementById('syncAllStatus');
  statusDiv.textContent = message;
  statusDiv.className = `sync-all-status sync-status-${type}`;
  statusDiv.style.display = 'flex';
}

// Initialize Searchable Selects
function initializeSearchableSelects() {
  // Initialize bureau selects
  initializeSearchableSelect('bureau', 'bureauSearch', bureaux);
  initializeSearchableSelect('modBureau', 'modBureauSearch', bureaux);
  
  // Initialize registre type selects
  const registreSelect = document.getElementById('registreType');
  const modRegistreSelect = document.getElementById('modRegistreType');
  
  Object.keys(registreTypes).forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = registreTypes[key];
    registreSelect.appendChild(option.cloneNode(true));
    modRegistreSelect.appendChild(option);
  });
}

function initializeSearchableSelect(selectId, searchId, options) {
  const select = document.getElementById(selectId);
  const search = document.getElementById(searchId);
  
  let allOptions = [...options];
  
  function populateSelect(filterText = '') {
    select.innerHTML = '';
    
    const filtered = allOptions.filter(opt => 
      opt.toLowerCase().includes(filterText.toLowerCase())
    );
    
    filtered.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      select.appendChild(option);
    });
    
    // Add "add new" option if searching and not exact match
    if (filterText && !allOptions.some(opt => opt.toLowerCase() === filterText.toLowerCase())) {
      const addOption = document.createElement('option');
      addOption.value = filterText;
      addOption.textContent = `➕ ${filterText}`;
      addOption.className = 'add-new-option';
      select.appendChild(addOption);
    }
  }
  
  search.addEventListener('input', (e) => {
    populateSelect(e.target.value);
  });
  
  select.addEventListener('change', () => {
    const selectedValue = select.value;
    if (selectedValue && !allOptions.includes(selectedValue)) {
      allOptions.push(selectedValue);
      allOptions.sort();
    }
    search.value = selectedValue;
  });
  
  // Initial population
  populateSelect();
}

// Listen for document changes from main process
ipcRenderer.on('document-added', (event, doc) => {
  loadDocuments();
});

ipcRenderer.on('document-removed', (event, filepath) => {
  loadDocuments();
});