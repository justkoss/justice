# acteFlow Backend Server

Backend API server for acteFlow document management system with full compatibility for the desktop Electron app.

## 🚀 Features

- ✅ **Desktop App Compatible** - Maintains same API endpoints as original sync server
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Role-Based Access Control** - Three roles: Agent, Supervisor, Admin
- ✅ **Document Management** - Upload, review, approve/reject workflow
- ✅ **Virtual Tree Storage** - Organized document hierarchy
- ✅ **SQLite Database** - Lightweight and portable
- ✅ **RESTful API** - Clean and consistent API design

## 📋 Prerequisites

- Node.js >= 16.0.0
- npm or yarn

## 🛠️ Installation

1. **Clone or navigate to backend directory:**
```bash
cd acteflow-backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and update values as needed:
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=justice2024
```

⚠️ **IMPORTANT**: Change the default admin password in production!

4. **Start the server:**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 📁 Project Structure

```
acteflow-backend/
├── src/
│   ├── config/
│   │   ├── database.js       # SQLite database configuration
│   │   └── multer.js         # File upload configuration
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   └── documentController.js  # Document management logic
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication middleware
│   │   └── errorHandler.js   # Error handling middleware
│   ├── models/
│   │   ├── User.js           # User model
│   │   └── Document.js       # Document model
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   └── documents.js      # Document routes
│   └── utils/                # Utility functions
├── storage/
│   ├── pending/              # Pending documents
│   └── stored/               # Approved documents (organized by virtual tree)
├── uploads/                   # Temporary upload directory
├── .env                      # Environment variables
├── .env.example              # Example environment variables
├── server.js                 # Main server file
├── package.json
└── README.md
```

## 🔑 Default Credentials

On first run, a default admin user is created:

- **Username:** `admin`
- **Password:** `justice2024`

⚠️ **Change this password immediately in production!**

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/verify` | Verify user exists | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout | Yes |
| POST | `/api/auth/refresh` | Refresh token | No |

### Documents

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/sync` | Sync document from desktop app | Yes | Agent |
| GET | `/api/documents` | Get all documents | Yes | All |
| GET | `/api/documents/stats` | Get statistics | Yes | All |
| GET | `/api/documents/:id` | Get document by ID | Yes | All |
| PUT | `/api/documents/:id/review` | Start reviewing | Yes | Supervisor/Admin |
| POST | `/api/documents/:id/approve` | Approve document | Yes | Supervisor/Admin |
| POST | `/api/documents/:id/reject` | Reject document | Yes | Supervisor/Admin |
| GET | `/api/documents/:id/history` | Get document history | Yes | All |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Login Request

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "justice2024"
}
```

### Login Response

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "email": "admin@acteflow.local"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Using the Token

Include the token in the Authorization header for authenticated requests:

```bash
GET /api/documents
Authorization: Bearer <your-token-here>
```

## 📤 Desktop App Integration

### Sync Document Endpoint

The `/api/sync` endpoint is fully compatible with the existing desktop app.

**Request:**
```bash
POST /api/sync
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <PDF file>
metadata: {
  "filename": "document.pdf",
  "bureau": "Anfa",
  "registreType": "naissances",
  "year": 2024,
  "registreNumber": "R001",
  "acteNumber": "A0001",
  "desktopDocumentId": "doc-123",
  "processedAt": "2024-10-28T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document synchronized successfully",
  "document": {
    "id": 1,
    "originalFilename": "document.pdf",
    "bureau": "Anfa",
    "registreType": "naissances",
    "year": 2024,
    "registreNumber": "R001",
    "acteNumber": "A0001",
    "status": "pending",
    "uploadedAt": "2024-10-28T10:00:00.000Z"
  }
}
```

## 👥 User Roles

### Agent
- Upload documents from desktop app
- View own uploaded documents
- Receive rejection notifications
- Re-upload rejected documents

### Supervisor
- Review pending documents
- Approve or reject documents
- View assigned bureaus only
- Cannot access admin dashboard

### Admin
- Full system access
- User management
- View all documents and bureaus
- Access to dashboard analytics

## 🗄️ Database Schema

### Users Table
```sql
- id (PRIMARY KEY)
- username (UNIQUE)
- password (hashed)
- email
- full_name
- phone
- role (agent, supervisor, admin)
- status (active, inactive)
- created_at
- updated_at
- last_login
```

### Documents Table
```sql
- id (PRIMARY KEY)
- filename
- original_filename
- file_path
- file_size
- bureau
- registre_type
- year
- registre_number
- acte_number
- status (pending, reviewing, rejected_for_update, stored)
- uploaded_by (FK to users)
- reviewed_by (FK to users)
- uploaded_at
- reviewed_at
- stored_at
- rejection_reason
- rejection_error_type
- virtual_path
- desktop_document_id
- processed_at
```

## 🌲 Virtual Tree Structure

Documents are organized in a hierarchical structure:

```
storage/stored/
├── Anfa/
│   ├── naissances/
│   │   ├── 2024/
│   │   │   ├── R001/
│   │   │   │   ├── A0001.pdf
│   │   │   │   ├── A0002.pdf
│   │   │   └── R002/
│   │   └── 2023/
│   └── deces/
└── Maarif/
    └── naissances/
```

## 🔧 Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

### Testing API Endpoints

Use tools like:
- **curl**
- **Postman**
- **Insomnia**
- **VS Code REST Client extension**

Example curl request:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"justice2024"}'

# Get documents
curl -X GET http://localhost:3000/api/documents \
  -H "Authorization: Bearer <your-token>"
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | JWT secret key | (required) |
| `JWT_EXPIRES_IN` | Token expiry | 7d |
| `DB_PATH` | Database file path | ./database.db |
| `UPLOAD_DIR` | Upload directory | ./uploads |
| `STORAGE_DIR` | Storage directory | ./storage |
| `MAX_FILE_SIZE` | Max file size (bytes) | 52428800 (50MB) |
| `CORS_ORIGIN` | CORS allowed origins | * |
| `DEFAULT_ADMIN_USERNAME` | Default admin username | admin |
| `DEFAULT_ADMIN_PASSWORD` | Default admin password | justice2024 |

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error message here",
  "error": {
    "statusCode": 400,
    "stack": "..." // Only in development mode
  }
}
```

## 📊 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for authentication
- Helmet.js for security headers
- CORS configuration
- Input validation
- Role-based access control

## 🐛 Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify Node.js version (>= 16.0.0)
- Check environment variables

### Database errors
- Delete `database.db` to recreate
- Check file permissions

### File upload fails
- Check `UPLOAD_DIR` and `STORAGE_DIR` exist
- Verify file size limits
- Ensure PDF mime type

## 📦 Dependencies

- **express** - Web framework
- **cors** - CORS middleware
- **helmet** - Security headers
- **morgan** - HTTP request logger
- **multer** - File upload handling
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT tokens
- **sql.js** - SQLite database
- **socket.io** - WebSocket support (future use)
- **dotenv** - Environment variables
- **express-validator** - Request validation

## 🚀 Deployment

### Production Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET
- [ ] Configure CORS for specific origins
- [ ] Set NODE_ENV=production
- [ ] Use process manager (PM2)
- [ ] Set up reverse proxy (nginx)
- [ ] Configure SSL/TLS
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Set up monitoring

### Using PM2

```bash
npm install -g pm2
pm2 start server.js --name acteflow-backend
pm2 save
pm2 startup
```

## 📄 License

MIT

## 👨‍💻 Support

For issues or questions, please refer to the project documentation.

---

**Built with ❤️ for acteFlow Document Management System**
