# Authentication System Guide

## 🔐 Overview

The Justice PDF Manager now includes a **secure offline/online authentication system** with encrypted passwords. The system intelligently handles authentication whether you're connected to the server or working offline.

## 🎯 How It Works

### First-Time Login (Requires Server)
1. User opens desktop app → sees login screen
2. Enters credentials and server URL
3. App attempts to authenticate with the server
4. If successful:
   - User data is **copied locally** with encrypted password
   - User is logged into the app
   - Next time can login offline

### Subsequent Logins (Offline First)
1. User enters credentials
2. App **tries local authentication first**
3. If local auth succeeds → user is logged in (offline mode)
4. If local auth fails → tries server authentication
5. If server auth succeeds → updates local password

### Smart Authentication Flow

```
User Login Attempt
    ↓
Check: Local user exists?
    ↓
YES → Try Local Auth
    ↓
    SUCCESS → Login (Offline) ✓
    ↓
    FAIL → Try Server Auth
        ↓
        SUCCESS → Update local password, Login ✓
        ↓
        FAIL → Show error ✗
    
NO → Try Server Auth (First time)
    ↓
    SUCCESS → Save user locally, Login ✓
    ↓
    FAIL → Show error ✗
```

## 🔧 Setup Instructions

### 1. Server Setup

**Create `.env` file:**
```bash
PORT=3000
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=justice2024
```

**Files needed:**
- `server.js` (updated with auth)
- `auth-db.js` (new auth database module)
- `package.json` (with bcryptjs and better-sqlite3)

**Install and run:**
```bash
npm install
npm start
```

The server will automatically:
- Create `auth.db` SQLite database
- Seed default user if no users exist
- Display default credentials in console

### 2. Desktop App Setup

**Files needed:**
- `main.js` (updated with auth handlers)
- `login.html` (new login page)
- `login.js` (new login logic)
- `index.html` (updated with logout button)
- `renderer.js` (updated with logout)
- `styles.css` (updated with login styles)
- `package.json` (with bcryptjs)

**Install and run:**
```bash
npm install
npm start
```

First launch shows login screen.

## 📊 Database Structure

### Server Database (`auth.db`)

**users table:**
```sql
- id (PRIMARY KEY)
- username (UNIQUE)
- password (encrypted with bcrypt)
- email
- created_at
- updated_at
- last_login
```

**login_sessions table:**
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- login_time
- ip_address
- user_agent
```

### Desktop Database (`documents.db`)

**local_auth table:**
```sql
- id (PRIMARY KEY)
- username (UNIQUE)
- password (encrypted with bcrypt)
- email
- server_user_id
- last_sync
- created_at
```

**documents table:**
```sql
(existing table for PDFs)
```

## 🔒 Security Features

### Password Encryption
- **bcrypt** hashing with salt rounds = 10
- Passwords never stored in plain text
- Same encryption on both server and desktop

### Secure Storage
- Local user credentials encrypted in SQLite
- No passwords in memory longer than needed
- Secure comparison using bcrypt

### Authentication Strategy
- Local-first approach reduces server load
- Passwords updated on successful server auth
- Session tracking on server side

## 🎮 Usage

### First Login
1. Start desktop app
2. Enter server credentials:
   - Username: `admin` (default)
   - Password: `justice2024` (default)
   - Server: `http://localhost:3000`
3. Click "Sign In"
4. Credentials saved locally for offline use

### Offline Login
1. Start desktop app (server can be offline)
2. Enter your credentials
3. App authenticates locally
4. Full access to app features

### Logout
1. Click logout button in header
2. Returns to login screen
3. Local credentials remain for next login

## 🔌 API Endpoints

### POST `/api/auth/login`
Authenticate user with username and password.

**Request:**
```json
{
  "username": "admin",
  "password": "justice2024"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@justice.local",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST `/api/auth/verify`
Check if username exists.

**Request:**
```json
{
  "username": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "exists": true,
  "user": { ... }
}
```

## 🔄 Password Management

### Changing Password (Server)

You can add users or change passwords using the auth database module:

```javascript
const authDb = require('./auth-db');

// Update password
authDb.updateUserPassword(userId, 'newPassword123');
```

Or directly in SQLite:
```sql
-- Generate bcrypt hash first, then:
UPDATE users 
SET password = '$2a$10$...' 
WHERE username = 'admin';
```

### Password Sync

When user logs in with updated server password:
1. Local auth fails (old password)
2. Server auth succeeds (new password)
3. Local password automatically updates
4. Next login works offline with new password

## 🛡️ Best Practices

### For Production

1. **Change Default Credentials:**
   ```bash
   # In server .env file
   DEFAULT_PASSWORD=your_secure_password_here
   ```

2. **Use HTTPS:**
   - Deploy server with SSL certificate
   - Update desktop app server URL to `https://`

3. **Secure Database Files:**
   - Set proper file permissions on `auth.db`
   - Regular backups of auth database

4. **Add More Security:**
   - Implement password strength requirements
   - Add rate limiting to login endpoint
   - Add JWT tokens for session management
   - Implement 2FA (future enhancement)

### For Development

Current setup is perfect for:
- Local development
- Testing offline capabilities
- Small team deployment on local network

## 🧪 Testing Authentication

### Test 1: First-Time Login
```bash
# Start server
cd sync-server
npm start

# Start desktop app
cd justice-pdf-manager
npm start

# Login with: admin / justice2024
```

### Test 2: Offline Login
```bash
# Stop server (Ctrl+C)

# Start desktop app
npm start

# Login with same credentials
# Should work offline!
```

### Test 3: Password Update
```bash
# Change password in server database
# Try old password in desktop app (local) → works
# Change server password
# Try old password → fails local, tries server, updates
```

## 🎨 UI Features

### Login Screen
- Clean, modern design matching app theme
- Real-time status messages
- Loading indicators
- Error handling
- Server URL configuration

### Main App
- Logout button in header
- Session persists until logout
- All features available after auth

## 📝 Troubleshooting

**Can't login:**
- Verify server is running: `curl http://localhost:3000/api/health`
- Check default credentials in server console
- Clear local database if corrupted

**Offline mode not working:**
- Ensure you've logged in successfully at least once
- Check `documents.db` has `local_auth` table with user

**Password not updating:**
- Server must be reachable
- Check network connection
- Verify server credentials are correct

## 🔮 Future Enhancements

Possible additions:
- Multi-user support on desktop
- Password reset functionality
- Biometric authentication
- Session timeouts
- Remember me option
- User management UI

## 📚 File Checklist

### Server Files
- ✅ `server.js` (updated)
- ✅ `auth-db.js` (new)
- ✅ `package.json` (updated)
- ✅ `.env` (configure)

### Desktop Files
- ✅ `main.js` (updated)
- ✅ `login.html` (new)
- ✅ `login.js` (new)
- ✅ `index.html` (updated)
- ✅ `renderer.js` (updated)
- ✅ `styles.css` (updated)
- ✅ `package.json` (updated)

## 🎉 Summary

You now have a complete offline/online authentication system with:
- ✅ Encrypted password storage
- ✅ Offline authentication capability
- ✅ Automatic password sync
- ✅ Secure bcrypt hashing
- ✅ Session tracking
- ✅ Modern UI
- ✅ Smart authentication flow

Your users can work seamlessly whether online or offline!