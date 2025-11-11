const { ipcRenderer } = require('electron');

// DOM Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const serverUrlInput = document.getElementById('serverUrl');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const statusMessage = document.getElementById('statusMessage');
const languageSwitcher = document.getElementById('languageSwitcher');

// Initialize i18n
window.addEventListener('DOMContentLoaded', () => {
  i18n.init();
  usernameInput.focus();
  updateLanguageSwitcher();
});

// Language Switcher
languageSwitcher.addEventListener('click', () => {
  const currentLang = i18n.getLanguage();
  const newLang = currentLang === 'fr' ? 'ar' : 'fr';
  i18n.setLanguage(newLang);
  updateLanguageSwitcher();
});

function updateLanguageSwitcher() {
  const lang = i18n.getLanguage();
  const langCode = languageSwitcher.querySelector('.lang-code');
  langCode.textContent = lang.toUpperCase();
}

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await handleLogin();
});

// Main login handler
async function handleLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const serverUrl = serverUrlInput.value.trim();
  
  if (!username || !password) {
    showError(i18n.t('login.errors.emptyFields'));
    return;
  }
  
  // Disable form
  setLoading(true);
  hideMessages();
  
  try {
    setLoading(true);
    showStatus('Vérification de la connexion au serveur...');

    const isOnline = await ipcRenderer.invoke('check-server-health', serverUrl);
    const hasLocalAuth = await ipcRenderer.invoke('check-local-auth');

    if (isOnline) {
      // 🌐 ONLINE MODE
      showStatus(i18n.t('login.status.serverAttempt'));
      const serverResult = await ipcRenderer.invoke('server-login', username, password, serverUrl);

      if (serverResult.success) {
        showStatus(i18n.t('login.status.serverSuccess'));
        setTimeout(() => ipcRenderer.invoke('load-main-app'), 1000);
      } else if (hasLocalAuth) {
        // fallback if server login failed but we have local credentials
        showStatus(i18n.t('login.status.serverFailedFallback'));
        const localResult = await ipcRenderer.invoke('local-login', username, password);
        if (localResult.success) {
          showStatus(i18n.t('login.status.offlineSuccess') );
          setTimeout(() => ipcRenderer.invoke('load-main-app'), 1000);
        } else {
          showError(serverResult.message || i18n.t('login.errors.loginFailed'));
        }
      } else {
        showError(serverResult.message || i18n.t('login.errors.loginFailed'));
      }
    } else {
      // 📴 OFFLINE MODE
      showStatus(i18n.t('login.status.offlineMode') );
      if (!hasLocalAuth) {
        showError(i18n.t('login.errors.noLocalAccount'));
        return;
      }
      const localResult = await ipcRenderer.invoke('local-login', username, password);
      if (localResult.success) {
        showStatus(i18n.t('login.status.offlineSuccess') );
        setTimeout(() => ipcRenderer.invoke('load-main-app'), 1000);
      } else {
        showError(localResult.message || i18n.t('login.errors.loginFailed'));
      }
    }

  } catch (error) {
    console.error('Erreur de connexion:', error);
    showError(i18n.t('login.errors.connectionError') + `: ${error.message}`);
  } finally {
    setLoading(false);
  }

}

// UI Helper Functions
function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  usernameInput.disabled = isLoading;
  passwordInput.disabled = isLoading;
  serverUrlInput.disabled = isLoading;
  
  const buttonText = loginBtn.querySelector('span');
  
  if (isLoading) {
    loginBtn.innerHTML = `
      <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      </svg>
      <span>${i18n.t('login.authenticating')}</span>
    `;
  } else {
    loginBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
        <polyline points="10 17 15 12 10 7"></polyline>
        <line x1="15" y1="12" x2="3" y2="12"></line>
      </svg>
      <span data-i18n="login.signIn">${i18n.t('login.signIn')}</span>
    `;
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'flex';
  statusMessage.style.display = 'none';
}

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.style.display = 'flex';
  errorMessage.style.display = 'none';
}

function hideMessages() {
  errorMessage.style.display = 'none';
  statusMessage.style.display = 'none';
}