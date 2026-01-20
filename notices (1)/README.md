# School Notice System

A beautiful school notice management system built with Express.js and persistent file storage.

## Files

- `server.js` - Express.js backend server
- `package.json` - Node.js dependencies
- `index.html` - Display notices page (public view)
- `add-notice.html` - Admin page to add new notices
- `styles.css` - Styling
- `script.js` - Client-side functionality
- `notices.json` - Data storage file (automatically created and managed)

## Setup Instructions

### Requirements
- Node.js (14.0+)
- npm (6.0+)

### Installation Steps

1. **Navigate to project directory:**
   ```bash
   cd c:\Users\Lenovo\OneDrive\Documents\notice
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - **Display Notices:** http://localhost:3000/
   - **Add Notice:** http://localhost:3000/add-notice.html

## Features

### Display Page (`index.html`)
- View all posted notices
- Search notices by title, content, or author
- Filter by category (Announcement, Holiday, Event, Exam, Urgent)
- Shows priority and date
- Delete notices (with confirmation)
- Responsive design for all devices

### Add Notice Page (`add-notice.html`)
- Form to create new notices
- Fields: Title, Category, Date, Priority, Author, Content, Attachment URL
- Character counters
- Form validation
- Automatic redirect to display page after posting

### Data Persistence
- All notices are saved in `notices.json`
- Data persists even after restarting the server
- No database required

## API Endpoints

The Express server handles all backend operations:

- **GET /api/notices** - Fetch all notices
- **POST /api/notices** - Add new notice (JSON body required)
- **DELETE /api/notices/:id** - Delete notice by ID

### Example API Calls:

```javascript
// Get all notices
fetch('http://localhost:3000/api/notices')
  .then(res => res.json())
  .then(data => console.log(data));

// Add new notice
fetch('http://localhost:3000/api/notices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Notice Title',
    category: 'Announcement',
    date: '2026-01-15',
    priority: 'High',
    author: 'Principal',
    content: 'Notice content here',
    attachmentUrl: ''
  })
});

// Delete notice
fetch('http://localhost:3000/api/notices/1642252800000', {
  method: 'DELETE'
});
```

## Security Notes

- HTML content is escaped to prevent XSS attacks
- Add authentication middleware to protect the admin page
- Consider adding password protection to the add-notice endpoint
- Regularly backup your `notices.json` file

## Troubleshooting

**Port already in use?**
- Change the port in `server.js` or use: `PORT=8000 npm start`

**Notices not saving?**
- Check if `notices.json` exists and has read/write permissions
- Verify the server is running and no errors in console

**CORS errors?**
- CORS is enabled in server.js, should work fine
- Check browser console for specific error messages

**Nodemon not found?**
- Install globally: `npm install -g nodemon`
- Or use just: `npm start`

---
Created: January 15, 2026
Updated: Express.js Version

