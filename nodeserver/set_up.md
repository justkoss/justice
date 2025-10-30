# Justice PDF Manager - Setup Instructions

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn

## Installation Steps

1. **Create a new project directory:**
   ```bash
   mkdir justice-pdf-manager
   cd justice-pdf-manager
   ```

2. **Create all the files:**
   - Create `package.json` (from artifact 1)
   - Create `main.js` (from artifact 2)
   - Create `index.html` (from artifact 3)
   - Create `renderer.js` (from artifact 4)
   - Create `styles.css` (from artifact 5)

3. **Install dependencies:**
   ```bash
   npm install
   ```
   
   **Note:** This app now uses `sql.js` instead of `better-sqlite3`, which means it doesn't require C++ build tools or Visual Studio on Windows. It should install cleanly on any platform!

4. **Run the application:**
   ```bash
   npm start
   ```

## How to Use

1. **Select a Watch Folder:**
   - Click the "Select Watch Folder" button
   - Choose a folder containing PDF files
   - The app will automatically detect all PDFs in that folder

2. **View Documents:**
   - Documents appear in the left sidebar
   - Unprocessed documents have an orange indicator
   - Processed documents have a green indicator
   - Click on any document to view it

3. **Process Documents:**
   - Select a document from the list
   - Fill in the document name and year
   - Click "Save & Mark as Processed"
   - The document status updates automatically

4. **Filter Documents:**
   - Use the tabs (All/Unprocessed/Processed) to filter documents
   - This helps you focus on documents that need processing

## Features

✓ Real-time folder monitoring
✓ SQLite database for persistent storage
✓ PDF viewing directly in the app
✓ Document metadata management
✓ Process tracking (processed/unprocessed)
✓ Modern justice-themed UI
✓ Filter by processing status

## Design Theme

The app features a professional "justice" theme with:
- Deep blue and gold color scheme (traditional legal colors)
- Clean, modern typography
- Professional document icons
- Clear status indicators
- Smooth animations and transitions

## Database

The app creates a SQLite database (`documents.db`) in the app's user data folder to store:
- Document file paths
- Document names
- Years
- Processing status
- Creation timestamps

## Troubleshooting

**PDFs not displaying?**
- Ensure the PDF file exists and isn't corrupted
- Check that the file path is accessible

**Dependencies not installing?**
- Make sure Node.js is properly installed
- Try deleting `node_modules` and running `npm install` again

**App won't start?**
- Check that all files are in the same directory
- Verify package.json is correct
- Make sure all dependencies are installed