const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

let documents = [];
let rejectedDocuments = []; // Changed from modifications
let currentDocument = null;
let currentRejectedDoc = null; // Changed from currentModification
let currentFilter = 'all';
let currentTab = 'documents';
let jwtToken = null;
let serverUrl = null;
let notificationsPollInterval = null;
let selectedNewFile = null;
let isModificationLocked = false;
let hasFileChanged = false;

// DOM Elements
const selectFolderBtn = document.getElementById('selectFolderBtn');
const logoutBtn = document.getElementById('logoutBtn');
const documentList = document.getElementById('documentList');
const modificationList = document.getElementById('modificationList');
const documentViewer = document.getElementById('documentViewer');
const noSelection = document.getElementById('noSelection');
const processingForm = document.getElementById('processingForm');
const modificationForm = document.getElementById('modificationForm');
const noDocumentSelected = document.getElementById('noDocumentSelected');
const pdfEmbed = document.getElementById('pdfEmbed');
const bureau = document.getElementById('bureau');
const bureauSearch = document.getElementById('bureauSearch');
const registreType = document.getElementById('registreType');
const documentYear = document.getElementById('documentYear');
const registreNumber = document.getElementById('registreNumber');
const acteNumber = document.getElementById('acteNumber');
const saveBtn = document.getElementById('saveBtn');
const statusBadge = document.getElementById('statusBadge');
const currentFileName = document.getElementById('currentFileName');
const watchedFolderDisplay = document.getElementById('watchedFolderDisplay');
const filterTabs = document.querySelectorAll('.filter-tab');
const sidebarTabs = document.querySelectorAll('.sidebar-tab');
const syncBtn = document.getElementById('syncBtn');
const syncStatus = document.getElementById('syncStatus');
const syncAllBtn = document.getElementById('syncAllBtn');
const syncAllStatus = document.getElementById('syncAllStatus');
const panelTitle = document.getElementById('panelTitle');
const reuploadBtn = document.getElementById('reuploadBtn');
const languageSwitcher = document.getElementById('languageSwitcher');

// Notifications elements
const notificationsBtn = document.getElementById('notificationsBtn');
const notificationBadge = document.getElementById('notificationBadge');
const notificationsDropdown = document.getElementById('notificationsDropdown');
const closeNotifications = document.getElementById('closeNotifications');
const notificationsList = document.getElementById('notificationsList');

// Modification form elements
const modBureau = document.getElementById('modBureau');
const modBureauSearch = document.getElementById('modBureauSearch');
const modRegistreType = document.getElementById('modRegistreType');
const modDocumentYear = document.getElementById('modDocumentYear');
const modRegistreNumber = document.getElementById('modRegistreNumber');
const modActeNumber = document.getElementById('modActeNumber');
const saveModificationBtn = document.getElementById('saveModificationBtn');

// Initialize
async function init() {
  i18n.init();
  updateLanguageSwitcher();
  
  // Get JWT token and server URL
  jwtToken = await ipcRenderer.invoke('get-jwt-token');
  serverUrl = await ipcRenderer.invoke('get-server-url');
  
  populateBureauDropdown();
  populateRegistreTypeDropdown();
  if (modBureau) {
    populateModBureauDropdown();
  }
  if (modRegistreType) {
    populateModRegistreTypeDropdown();
  }
  
  await loadDocuments();
  await loadRejectedDocuments(); // Load from backend
  
  const watchedFolder = await ipcRenderer.invoke('get-watched-folder');
  if (watchedFolder) {
    updateWatchedFolderDisplay(watchedFolder);
  }
  
  // Start polling for rejected documents every 30 seconds
  startNotificationsPolling();
}

// Start polling for notifications
function startNotificationsPolling() {
  // Poll immediately
  loadRejectedDocuments();
  
  // Then poll every 30 seconds
  notificationsPollInterval = setInterval(() => {
    loadRejectedDocuments();
  }, 30000);
}

// Stop polling
function stopNotificationsPolling() {
  if (notificationsPollInterval) {
    clearInterval(notificationsPollInterval);
    notificationsPollInterval = null;
  }
}

// ==============================================
// I18N FUNCTIONS
// ==============================================

// Language Switcher functionality
if (languageSwitcher) {
  languageSwitcher.addEventListener('click', () => {
    const currentLang = i18n.getLanguage();
    const newLang = currentLang === 'fr' ? 'ar' : 'fr';
    i18n.setLanguage(newLang);
    updateLanguageSwitcher();
    
    populateBureauDropdown();
    populateRegistreTypeDropdown();
    if (modBureau) {
      populateModBureauDropdown();
    }
    if (modRegistreType) {
      populateModRegistreTypeDropdown();
    }
    
    if (currentTab === 'documents') {
      renderDocuments();
    } else {
      renderRejectedDocuments();
    }
  });
}

// Notifications functionality
if (notificationsBtn) {
  notificationsBtn.addEventListener('click', () => {
    toggleNotificationsDropdown();
  });
}

if (closeNotifications) {
  closeNotifications.addEventListener('click', () => {
    hideNotificationsDropdown();
  });
}

// Close notifications when clicking outside
document.addEventListener('click', (e) => {
  if (notificationsDropdown && 
      notificationsDropdown.style.display === 'block' &&
      !notificationsDropdown.contains(e.target) &&
      !notificationsBtn.contains(e.target)) {
    hideNotificationsDropdown();
  }
});

function updateLanguageSwitcher() {
  if (!languageSwitcher) return;
  const lang = i18n.getLanguage();
  const langCode = languageSwitcher.querySelector('.lang-code');
  if (langCode) {
    langCode.textContent = lang.toUpperCase();
  }
}

// Get translated bureau list
function getAllBureauxTranslated() {
  return [
    { key: 'ainchock', name: i18n.t('bureaux.ainchock') },
    { key: 'ainsebaa', name: i18n.t('bureaux.ainsebaa') },
    { key: 'alfida', name: i18n.t('bureaux.alfida') },
    { key: 'anfa', name: i18n.t('bureaux.anfa') },
    { key: 'benmsik', name: i18n.t('bureaux.benmsik') },
    { key: 'essoukhour', name: i18n.t('bureaux.essoukhour') },
    { key: 'hayhassani', name: i18n.t('bureaux.hayhassani') },
    { key: 'haymohammadi', name: i18n.t('bureaux.haymohammadi') },
    { key: 'maarif', name: i18n.t('bureaux.maarif') },
    { key: 'merssultan', name: i18n.t('bureaux.merssultan') },
    { key: 'moulayrachid', name: i18n.t('bureaux.moulayrachid') },
    { key: 'sbata', name: i18n.t('bureaux.sbata') },
    { key: 'sidibelyout', name: i18n.t('bureaux.sidibelyout') },
    { key: 'sidibernoussi', name: i18n.t('bureaux.sidibernoussi') },
    { key: 'sidimoumen', name: i18n.t('bureaux.sidimoumen') },
    { key: 'sidiothman', name: i18n.t('bureaux.sidiothman') }
  ];
}

// Get translated registre types
function getAllRegistreTypesTranslated() {
  return [
    { key: 'naissances', name: i18n.t('registreTypes.naissances') },
    { key: 'deces', name: i18n.t('registreTypes.deces') },
    { key: 'jugements', name: i18n.t('registreTypes.jugements') },
    { key: 'transcriptions', name: i18n.t('registreTypes.transcriptions') },
    { key: 'etrangers', name: i18n.t('registreTypes.etrangers') }
  ];
}

// Populate bureau dropdown with translations
function populateBureauDropdown(searchTerm = '', selectedKey = '') {
  if (!bureau) return;
  
  const bureaux = getAllBureauxTranslated();
  const filtered = bureaux.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  bureau.innerHTML = '';
  
  filtered.forEach(b => {
    const option = document.createElement('option');
    option.value = b.key;
    option.textContent = b.name;
    if (b.key === selectedKey) {
      option.selected = true;
    }
    bureau.appendChild(option);
  });
  
  if (searchTerm && !bureaux.some(b => b.name.toLowerCase() === searchTerm.toLowerCase())) {
    const newOption = document.createElement('option');
    newOption.value = searchTerm;
    newOption.textContent = `➕ ${searchTerm}`;
    newOption.className = 'add-new-option';
    bureau.insertBefore(newOption, bureau.firstChild);
  }
}

// Populate registre type dropdown with translations
function populateRegistreTypeDropdown(selectedKey = '') {
  if (!registreType) return;
  
  const types = getAllRegistreTypesTranslated();
  registreType.innerHTML = `<option value="">${i18n.t('processing.selectType')}</option>`;
  
  types.forEach(type => {
    const option = document.createElement('option');
    option.value = type.key;
    option.textContent = type.name;
    if (type.key === selectedKey) {
      option.selected = true;
    }
    registreType.appendChild(option);
  });
}

// Similar functions for modification form
function populateModBureauDropdown(searchTerm = '', selectedKey = '') {
  if (!modBureau) return;
  
  const bureaux = getAllBureauxTranslated();
  const filtered = bureaux.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  modBureau.innerHTML = '';
  
  filtered.forEach(b => {
    const option = document.createElement('option');
    option.value = b.key;
    option.textContent = b.name;
    if (b.key === selectedKey) {
      option.selected = true;
    }
    modBureau.appendChild(option);
  });
  
  if (searchTerm && !bureaux.some(b => b.name.toLowerCase() === searchTerm.toLowerCase())) {
    const newOption = document.createElement('option');
    newOption.value = searchTerm;
    newOption.textContent = `➕ ${searchTerm}`;
    newOption.className = 'add-new-option';
    modBureau.insertBefore(newOption, modBureau.firstChild);
  }
}

function populateModRegistreTypeDropdown(selectedKey = '') {
  if (!modRegistreType) return;
  
  const types = getAllRegistreTypesTranslated();
  modRegistreType.innerHTML = `<option value="">${i18n.t('processing.selectType')}</option>`;
  
  types.forEach(type => {
    const option = document.createElement('option');
    option.value = type.key;
    option.textContent = type.name;
    if (type.key === selectedKey) {
      option.selected = true;
    }
    modRegistreType.appendChild(option);
  });
}

// Bureau search functionality
if (bureauSearch) {
  bureauSearch.addEventListener('input', (e) => {
    populateBureauDropdown(e.target.value);
  });
  
  bureauSearch.addEventListener('focus', () => {
    bureau.size = 8;
    bureau.style.display = 'block';
  });
  
  bureauSearch.addEventListener('blur', () => {
    setTimeout(() => {
      bureau.size = 1;
    }, 200);
  });
  
  bureau.addEventListener('change', () => {
    const selected = bureau.options[bureau.selectedIndex];
    bureauSearch.value = selected.textContent;
  });
}

if (modBureauSearch) {
  modBureauSearch.addEventListener('input', (e) => {
    populateModBureauDropdown(e.target.value);
  });
  
  modBureauSearch.addEventListener('focus', () => {
    modBureau.size = 8;
    modBureau.style.display = 'block';
  });
  
  modBureauSearch.addEventListener('blur', () => {
    setTimeout(() => {
      modBureau.size = 1;
    }, 200);
  });
  
  modBureau.addEventListener('change', () => {
    const selected = modBureau.options[modBureau.selectedIndex];
    modBureauSearch.value = selected.textContent;
  });
}

// Tab switching
sidebarTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    switchTab(tabName);
  });
});

function switchTab(tabName) {
  currentTab = tabName;
  
  // Update tab buttons
  sidebarTabs.forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  document.getElementById(`${tabName}Tab`).classList.add('active');
  
  // Clear selection and update panel
  clearSelection();
  
  if (tabName === 'documents') {
    panelTitle.textContent = i18n.t('processing.title');
  } else {
    panelTitle.textContent = 'Demande de Modification';
  }
}

// Sync functionality with JWT token
async function syncDocument(doc) {
  try {
    showSyncStatus('Préparation de la synchronisation...', 'loading');
    syncBtn.disabled = true;
    
    const fileBuffer = fs.readFileSync(doc.filepath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('file', blob, doc.filename);
    formData.append('metadata', JSON.stringify({
      filename: doc.filename,
      bureau: doc.bureau,
      acteNumber: doc.acte_number,
      registreNumber: doc.registre_number,
      year: doc.year,
      registreType: doc.registre_type,
      processedAt: new Date().toISOString(),
      desktopDocumentId: doc.id
    }));
    
    showSyncStatus('Téléchargement vers le serveur...', 'loading');
    
    // Include JWT token in request
    const response = await fetch(`${serverUrl}/api/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Le serveur a répondu avec ${response.status}`);
    }
    
    const result = await response.json();
    
    showSyncStatus('Synchronisation réussie ! Suppression du fichier local...', 'loading');
    
    await ipcRenderer.invoke('delete-document', doc.id, doc.filepath);
    
    await loadDocuments();
    clearSelection();
    
    showSyncStatus('✓ Document synchronisé et supprimé', 'success');
    
    setTimeout(() => {
      showSyncStatus('', 'hidden');
    }, 3000);
    
  } catch (error) {
    console.error('Erreur de synchronisation:', error);
    showSyncStatus(`✗ Échec de la synchronisation : ${error.message}`, 'error');
  } finally {
    syncBtn.disabled = false;
  }
}

async function syncAllDocuments() {
  try {
    const processedDocs = documents.filter(doc => doc.processed === 1);
    
    if (processedDocs.length === 0) {
      showSyncAllStatus(i18n.t('sync.noProcessed'), 'warning');
      setTimeout(() => {
        showSyncAllStatus('', 'hidden');
      }, 3000);
      return;
    }
    
    syncAllBtn.disabled = true;
    let successCount = 0;
    let failCount = 0;
    const total = processedDocs.length;
    
    showSyncAllStatus(i18n.t('sync.syncing'), 'loading');
    
    for (let i = 0; i < processedDocs.length; i++) {
      const doc = processedDocs[i];
      const current = i + 1;
      
      const progressMsg = i18n.t('sync.progress')
        .replace('{current}', current)
        .replace('{total}', total);
      showSyncAllStatus(progressMsg, 'loading');
      
      try {
        const fileBuffer = fs.readFileSync(doc.filepath);
        const blob = new Blob([fileBuffer], { type: 'application/pdf' });
        
        const formData = new FormData();
        formData.append('file', blob, doc.filename);
        formData.append('metadata', JSON.stringify({
          filename: doc.filename,
          bureau: doc.bureau,
          acteNumber: doc.acte_number,
          registreNumber: doc.registre_number,
          year: doc.year,
          registreType: doc.registre_type,
          processedAt: new Date().toISOString(),
          desktopDocumentId: doc.id
        }));
        
        // Include JWT token
        const response = await fetch(`${serverUrl}/api/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        await response.json();
        await ipcRenderer.invoke('delete-document', doc.id, doc.filepath);
        
        successCount++;
        
      } catch (error) {
        console.error(`Failed to sync ${doc.filename}:`, error);
        failCount++;
      }
    }
    
    await loadDocuments();
    clearSelection();
    
    if (failCount === 0) {
      const successMsg = i18n.t('sync.success').replace('{count}', successCount);
      showSyncAllStatus(successMsg, 'success');
    } else {
      const partialMsg = i18n.t('sync.partial')
        .replace('{success}', successCount)
        .replace('{failed}', failCount);
      showSyncAllStatus(partialMsg, 'warning');
    }
    
    setTimeout(() => {
      showSyncAllStatus('', 'hidden');
    }, 5000);
    
  } catch (error) {
    console.error('Sync all error:', error);
    showSyncAllStatus(i18n.t('sync.error'), 'error');
    setTimeout(() => {
      showSyncAllStatus('', 'hidden');
    }, 3000);
  } finally {
    syncAllBtn.disabled = false;
  }
}

function showSyncAllStatus(message, type) {
  syncAllStatus.textContent = message;
  syncAllStatus.className = `sync-all-status sync-status-${type}`;
  syncAllStatus.style.display = message ? 'block' : 'none';
}

function showSyncStatus(message, type) {
  syncStatus.textContent = message;
  syncStatus.className = `sync-status sync-status-${type}`;
  syncStatus.style.display = message ? 'flex' : 'none';
}

// Event Listeners
selectFolderBtn.addEventListener('click', async () => {
  const folderPath = await ipcRenderer.invoke('select-folder');
  if (folderPath) {
    updateWatchedFolderDisplay(folderPath);
    await loadDocuments();
  }
});

logoutBtn.addEventListener('click', async () => {
  const confirmed = confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
  if (confirmed) {
    stopNotificationsPolling();
    await ipcRenderer.invoke('logout');
  }
});

saveBtn.addEventListener('click', async () => {
  if (!currentDocument) return;
  
  const bureauVal = bureau.value;
  const acteNum = acteNumber.value.trim();
  const registreNum = registreNumber.value.trim();
  const year = parseInt(documentYear.value);
  const regType = registreType.value;
  
  if (!bureauVal || !acteNum || !registreNum || !year || !regType) {
    alert('Veuillez remplir tous les champs');
    return;
  }
  
  const updated = await ipcRenderer.invoke('update-document', currentDocument.id, {
    bureau: bureauVal,
    acteNumber: acteNum,
    registreNumber: registreNum,
    year: year,
    registreType: regType
  });
  
  const index = documents.findIndex(d => d.id === currentDocument.id);
  if (index !== -1) {
    documents[index] = updated;
  }
  
  currentDocument = updated;
  updateStatusBadge(true);
  renderDocuments();
  
  const saveBtnSpan = saveBtn.querySelector('span');
  if (saveBtnSpan) {
    saveBtnSpan.textContent = 'Enregistré !';
  }
  saveBtn.style.background = '#10b981';
  setTimeout(() => {
    saveBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span data-i18n="processing.save">${i18n.t('processing.save')}</span>
    `;
    saveBtn.style.background = '';
  }, 2000);
});

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    renderDocuments();
  });
});

syncBtn.addEventListener('click', async () => {
  if (!currentDocument) return;
  
  if (currentDocument.processed !== 1) {
    showSyncStatus('Veuillez traiter le document avant de synchroniser', 'error');
    return;
  }
  
  await syncDocument(currentDocument);
});

// Sync All Button
if (syncAllBtn) {
  syncAllBtn.addEventListener('click', async () => {
    await syncAllDocuments();
  });
}

// Reupload button - resync rejected document with new file
if (reuploadBtn) {
  reuploadBtn.addEventListener('click', async () => {
    if (!currentRejectedDoc || isModificationLocked) return;
    
    const newFilePath = await ipcRenderer.invoke('select-file-for-reupload');
    if (!newFilePath) return;
    
    // Store the new file path
    selectedNewFile = newFilePath;
    hasFileChanged = true;
    
    // Update viewer to show new file immediately
    pdfEmbed.src = `file://${newFilePath}#toolbar=0`;
    
    // Update button to show file was selected
    reuploadBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${i18n.t('processing.fileSelected') || 'Fichier sélectionné ✓'}</span>
    `;
    reuploadBtn.classList.add('btn-success');
    reuploadBtn.disabled = true; // Disable to prevent multiple selections
    
    // Enable the save button
    if (saveModificationBtn) {
      saveModificationBtn.disabled = false;
      saveModificationBtn.classList.remove('opacity-50');
    }
    
    showSyncStatus('✓ ' + (i18n.t('processing.newFileSelected') || 'Nouveau fichier sélectionné. Vérifiez les métadonnées et envoyez.'), 'success');
  });
}

// IPC Listeners
ipcRenderer.on('document-added', async (event, doc) => {
  console.log('📄 Document ajouté:', doc.filename);
  await loadDocuments();
});

ipcRenderer.on('document-removed', async (event, filepath) => {
  console.log('🗑️  Document supprimé:', filepath);
  await loadDocuments();
  if (currentDocument && currentDocument.filepath === filepath) {
    clearSelection();
  }
});

// Functions
async function loadDocuments() {
  documents = await ipcRenderer.invoke('get-documents');
  renderDocuments();
}

// Load rejected documents from backend
async function loadRejectedDocuments() {
  const result = await ipcRenderer.invoke('fetch-rejected-documents');
  if (result.success) {
    rejectedDocuments = result.documents;
    renderRejectedDocuments();
    updateNotificationBadge();
  } else {
    console.error('Failed to load rejected documents:', result.message);
  }
}

function updateWatchedFolderDisplay(folderPath) {
  watchedFolderDisplay.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
    <span>Surveillance : ${folderPath}</span>
  `;
  watchedFolderDisplay.style.display = 'flex';
}

function updateFilterCounts() {
  const allCount = documents.length;
  const processedCount = documents.filter(doc => doc.processed === 1).length;
  const unprocessedCount = documents.filter(doc => doc.processed === 0).length;
  
  filterTabs.forEach(tab => {
    const filter = tab.dataset.filter;
    let count = 0;
    
    if (filter === 'all') count = allCount;
    else if (filter === 'processed') count = processedCount;
    else if (filter === 'unprocessed') count = unprocessedCount;
    
    let badge = tab.querySelector('.count-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'count-badge';
      tab.appendChild(badge);
    }
    badge.textContent = count;
  });
}

function renderDocuments() {
  updateFilterCounts();
  
  const filtered = documents.filter(doc => {
    if (currentFilter === 'processed') return doc.processed === 1;
    if (currentFilter === 'unprocessed') return doc.processed === 0;
    return true;
  });
  
  if (filtered.length === 0) {
    let emptyMessage = i18n.t('documentList.empty');
    
    documentList.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <p>${emptyMessage}</p>
      </div>
    `;
    return;
  }
  
  documentList.innerHTML = filtered.map(doc => {
    let displayName = doc.filename;
    if (doc.acte_number && doc.registre_number) {
      displayName = `Acte ${doc.acte_number} - Reg. ${doc.registre_number}`;
    }
    
    let bureauDisplay = doc.bureau || '';
    if (doc.bureau) {
      const bureauObj = getAllBureauxTranslated().find(b => b.key === doc.bureau);
      bureauDisplay = bureauObj ? bureauObj.name : doc.bureau;
    }
    
    const processedText = doc.processed ? i18n.t('processing.status.processed') : i18n.t('processing.status.unprocessed');
    const processedIcon = doc.processed ? '✓' : '○';
    
    return `
    <div class="document-item ${doc.processed ? 'processed' : 'unprocessed'} ${currentDocument?.id === doc.id ? 'active' : ''}" 
         data-id="${doc.id}">
      <div class="doc-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      </div>
      <div class="doc-info">
        <div class="doc-name">${displayName}</div>
        <div class="doc-meta">
          ${bureauDisplay ? `<span class="doc-bureau">${bureauDisplay}</span>` : ''}
          ${doc.year ? `<span class="doc-year">${doc.year}</span>` : ''}
          <span class="doc-status ${doc.processed ? 'status-processed' : 'status-unprocessed'}">
            ${processedIcon} ${processedText}
          </span>
        </div>
      </div>
    </div>
  `;
  }).join('');
  
  document.querySelectorAll('.document-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id);
      const doc = documents.find(d => d.id === id);
      selectDocument(doc);
    });
  });
}

function renderRejectedDocuments() {
  if (rejectedDocuments.length === 0) {
    modificationList.innerHTML = `
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
  
  modificationList.innerHTML = rejectedDocuments.map(doc => `
    <div class="document-item modification-item ${currentRejectedDoc?.id === doc.id ? 'active' : ''}" 
         data-id="${doc.id}">
      <div class="doc-icon error-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="doc-info">
        <div class="doc-name">${doc.original_filename}</div>
        <div class="doc-meta">
          <span class="error-badge">${doc.rejection_error_type || 'Erreur'}</span>
        </div>
      </div>
    </div>
  `).join('');
  
  document.querySelectorAll('.modification-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id);
      const doc = rejectedDocuments.find(d => d.id === id);
      selectRejectedDocument(doc);
    });
  });
}

// ====================================
// NOTIFICATIONS FUNCTIONS
// ====================================

function updateNotificationBadge() {
  const count = rejectedDocuments.length;
  if (count > 0) {
    notificationBadge.textContent = count;
    notificationBadge.style.display = 'flex';
  } else {
    notificationBadge.style.display = 'none';
  }
}

function toggleNotificationsDropdown() {
  if (notificationsDropdown.style.display === 'block') {
    hideNotificationsDropdown();
  } else {
    showNotificationsDropdown();
  }
}

function showNotificationsDropdown() {
  renderNotifications();
  notificationsDropdown.style.display = 'block';
}

function hideNotificationsDropdown() {
  notificationsDropdown.style.display = 'none';
}

function renderNotifications() {
  if (rejectedDocuments.length === 0) {
    notificationsList.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #718096;">
        <p>${i18n.t('notifications.empty')}</p>
      </div>
    `;
    return;
  }
  
  notificationsList.innerHTML = rejectedDocuments.map(doc => `
    <div class="notification-item" data-doc-id="${doc.id}">
      <div class="notification-icon error-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="notification-content">
        <div class="notification-title">${i18n.t('notifications.newModification')}</div>
        <div class="notification-message">${doc.original_filename} - ${doc.rejection_error_type || 'Erreur'}</div>
        <div class="notification-time">${doc.rejection_reason || ''}</div>
      </div>
    </div>
  `).join('');
  
  // Add click handlers to notifications
  document.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', () => {
      const docId = parseInt(item.dataset.docId);
      const doc = rejectedDocuments.find(d => d.id === docId);
      if (doc) {
        switchTab('modifications');
        selectRejectedDocument(doc);
        hideNotificationsDropdown();
      }
    });
  });
}

function selectDocument(doc) {
  currentDocument = doc;
  currentRejectedDoc = null;
  
  noSelection.style.display = 'none';
  documentViewer.style.display = 'flex';
  pdfEmbed.src = `file://${doc.filepath}#toolbar=0`;
  
  noDocumentSelected.style.display = 'none';
  processingForm.style.display = 'flex';
  if (modificationForm) modificationForm.style.display = 'none';
  
  currentFileName.textContent = doc.filename;
  
  if (bureauSearch) {
    const bureauObj = getAllBureauxTranslated().find(b => b.key === doc.bureau);
    bureauSearch.value = bureauObj ? bureauObj.name : (doc.bureau || '');
  }
  populateBureauDropdown('', doc.bureau);
  
  acteNumber.value = doc.acte_number || '';
  registreNumber.value = doc.registre_number || '';
  documentYear.value = doc.year || '';
  
  populateRegistreTypeDropdown(doc.registre_type);
  
  updateStatusBadge(doc.processed === 1);
  
  renderDocuments();
}

async function selectRejectedDocument(doc) {
  currentRejectedDoc = doc;
  currentDocument = null;
  
  // Reset state for new document
  selectedNewFile = null;
  isModificationLocked = false;
  hasFileChanged = false;
  
  // Download the file if not already downloaded
  const downloadResult = await ipcRenderer.invoke('download-rejected-document', doc.id);
  
  if (!downloadResult.success) {
    alert('Erreur lors du téléchargement du document: ' + downloadResult.message);
    return;
  }
  
  noSelection.style.display = 'none';
  documentViewer.style.display = 'flex';
  pdfEmbed.src = `file://${downloadResult.filepath}#toolbar=0`;
  
  noDocumentSelected.style.display = 'none';
  processingForm.style.display = 'none';
  if (modificationForm) modificationForm.style.display = 'flex';
  
  // Reset buttons
  reuploadBtn.disabled = false;
  reuploadBtn.classList.remove('btn-success');
  reuploadBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
    <span data-i18n="processing.selectNewFile">${i18n.t('processing.selectNewFile') || 'Sélectionner un nouveau fichier'}</span>
  `;
  
  saveModificationBtn.disabled = true;
  saveModificationBtn.classList.remove('btn-success');
  saveModificationBtn.classList.add('opacity-50');
  saveModificationBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span data-i18n="processing.confirmAndSend">${i18n.t('processing.confirmAndSend') || 'Confirmer et envoyer'}</span>
  `;
  
  // Enable all inputs
  modBureau.disabled = false;
  modBureauSearch.disabled = false;
  modRegistreType.disabled = false;
  modDocumentYear.disabled = false;
  modRegistreNumber.disabled = false;
  modActeNumber.disabled = false;
  
  // Set error info
  const modFileNameEl = document.getElementById('modFileName');
  const errorTypeEl = document.getElementById('errorType');
  const agentMessageEl = document.getElementById('agentMessage');
  
  if (modFileNameEl) modFileNameEl.textContent = doc.original_filename;
  if (errorTypeEl) errorTypeEl.textContent = doc.rejection_error_type || 'Type d\'erreur non spécifié';
  if (agentMessageEl) agentMessageEl.textContent = doc.rejection_reason || 'Aucun message';
  
  // Set metadata fields
  if (modBureauSearch) {
    const bureauObj = getAllBureauxTranslated().find(b => b.key === doc.bureau);
    modBureauSearch.value = bureauObj ? bureauObj.name : (doc.bureau || '');
  }
  populateModBureauDropdown('', doc.bureau);
  
  populateModRegistreTypeDropdown(doc.registre_type);
  if (modDocumentYear) modDocumentYear.value = doc.year || '';
  if (modRegistreNumber) modRegistreNumber.value = doc.registre_number || '';
  if (modActeNumber) modActeNumber.value = doc.acte_number || '';
  
  // Remove any existing status info
  const existingStatus = modificationForm.querySelector('.status-info');
  if (existingStatus) existingStatus.remove();
  
  renderRejectedDocuments();
}

// Save Modification Button Handler - updates metadata only
if (saveModificationBtn) {
  saveModificationBtn.addEventListener('click', async () => {
    if (!currentRejectedDoc || isModificationLocked) return;
    
    // Get updated metadata
    const updatedData = {
      bureau: modBureau.value,
      registreType: modRegistreType.value,
      year: parseInt(modDocumentYear.value),
      registreNumber: modRegistreNumber.value.trim(),
      acteNumber: modActeNumber.value.trim()
    };
    
    // Validate all fields
    if (!updatedData.bureau || !updatedData.registreType || !updatedData.year || 
        !updatedData.registreNumber || !updatedData.acteNumber) {
      showSyncStatus('⚠ ' + (i18n.t('processing.fillAllFields') || 'Veuillez remplir tous les champs'), 'error');
      return;
    }
    
    // Check if file was changed
    if (!hasFileChanged) {
      showSyncStatus('⚠ ' + (i18n.t('processing.mustSelectNewFile') || 'Veuillez sélectionner un nouveau fichier'), 'error');
      return;
    }
    
    // Disable button and show loading
    saveModificationBtn.disabled = true;
    saveModificationBtn.innerHTML = `
      <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      </svg>
      <span>${i18n.t('sync.syncing') || 'Envoi en cours...'}</span>
    `;
    
    try {
      showSyncStatus((i18n.t('modification.uploading') || 'Préparation de l\'envoi...'), 'loading');
      
      // Read the new file
      const fileBuffer = fs.readFileSync(selectedNewFile);
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      const filename = currentRejectedDoc.original_filename;
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', blob, filename);
      formData.append('metadata', JSON.stringify({
        filename: filename,
        bureau: updatedData.bureau,
        acteNumber: updatedData.acteNumber,
        registreNumber: updatedData.registreNumber,
        year: updatedData.year,
        registreType: updatedData.registreType,
        processedAt: new Date().toISOString(),
        desktopDocumentId: currentRejectedDoc.desktop_document_id || `reupload-${Date.now()}`,
        originalDocumentId: currentRejectedDoc.id // Include original doc ID
      }));
      
      showSyncStatus((i18n.t('modification.sendingToServer') || 'Envoi au serveur...'), 'loading');
      
      // Send to server
      const response = await fetch(`${serverUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Le serveur a répondu avec ${response.status}`);
      }
      
      await response.json();
      
      // Lock the form
      isModificationLocked = true;
      
      // Disable all inputs
      modBureau.disabled = true;
      modBureauSearch.disabled = true;
      modRegistreType.disabled = true;
      modDocumentYear.disabled = true;
      modRegistreNumber.disabled = true;
      modActeNumber.disabled = true;
      reuploadBtn.disabled = true;
      saveModificationBtn.disabled = true;
      
      // Update button to show sent
      saveModificationBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${i18n.t('modification.sent') || 'Envoyé ✓'}</span>
      `;
      saveModificationBtn.classList.add('btn-success');
      
      showSyncStatus('✓ ' + (i18n.t('modification.sentSuccess') || 'Document envoyé avec succès et en attente de révision'), 'success');
      
      // Add status badge
      const statusInfo = document.createElement('div');
      statusInfo.className = 'status-info';
      statusInfo.innerHTML = `
        <div class="badge badge-warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          ${i18n.t('modification.awaitingReview') || 'En attente de révision'}
        </div>
      `;
      modificationForm.insertBefore(statusInfo, modificationForm.firstChild);
      
      // Remove from list after delay
      setTimeout(async () => {
        await loadRejectedDocuments();
        
        // If this was the only document, clear selection
        if (rejectedDocuments.length === 0) {
          clearSelection();
        } else {
          // Select first document in list
          selectRejectedDocument(rejectedDocuments[0]);
        }
        
        showSyncStatus('', 'hidden');
      }, 3000);
      
    } catch (error) {
      console.error('Erreur d\'envoi:', error);
      showSyncStatus(`✗ ${i18n.t('sync.error') || 'Échec de l\'envoi'}: ${error.message}`, 'error');
      
      // Re-enable button
      saveModificationBtn.disabled = false;
      saveModificationBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span data-i18n="processing.saveModification">${i18n.t('processing.saveModification') || 'Envoyer les modifications'}</span>
      `;
    }
  });
}


function clearSelection() {
  currentDocument = null;
  currentRejectedDoc = null;
  noSelection.style.display = 'flex';
  documentViewer.style.display = 'none';
  noDocumentSelected.style.display = 'flex';
  processingForm.style.display = 'none';
  if (modificationForm) modificationForm.style.display = 'none';
  renderDocuments();
  renderRejectedDocuments();
}

function updateStatusBadge(processed) {
  if (processed) {
    statusBadge.textContent = i18n.t('processing.status.processed');
    statusBadge.className = 'badge badge-processed';
  } else {
    statusBadge.textContent = i18n.t('processing.status.unprocessed');
    statusBadge.className = 'badge badge-unprocessed';
  }
}

// Initialize app
init();