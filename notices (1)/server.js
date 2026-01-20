const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, name + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadsDir));

// Path to notices.json
const noticesFilePath = path.join(__dirname, 'notices.json');

// Initialize notices.json if it doesn't exist
if (!fs.existsSync(noticesFilePath)) {
    fs.writeFileSync(noticesFilePath, JSON.stringify({ notices: [] }, null, 2));
}

// Read notices from file
function readNotices() {
    try {
        const data = fs.readFileSync(noticesFilePath, 'utf8');
        return JSON.parse(data).notices || [];
    } catch (error) {
        console.error('Error reading notices:', error);
        return [];
    }
}

// Write notices to file
function writeNotices(notices) {
    try {
        fs.writeFileSync(noticesFilePath, JSON.stringify({ notices }, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing notices:', error);
        return false;
    }
}

// GET all notices
app.get('/api/notices', (req, res) => {
    try {
        const notices = readNotices();
        res.json(notices);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notices' });
    }
});

// POST new notice
app.post('/api/notices', upload.single('attachment'), (req, res) => {
    try {
        const { title, category, date, priority, author, content } = req.body;

        // Validation
        if (!title || !category || !date || !author || !content) {
            // Delete uploaded file if validation fails
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        const notices = readNotices();

        // Create new notice
        const newNotice = {
            id: Date.now(),
            title: title.trim(),
            category: category.trim(),
            date: date.trim(),
            priority: priority || 'Normal',
            author: author.trim(),
            content: content.trim(),
            attachmentName: req.file ? req.file.originalname : '',
            attachmentPath: req.file ? `/uploads/${req.file.filename}` : '',
            attachmentSize: req.file ? req.file.size : 0,
            createdAt: new Date().toISOString()
        };

        notices.push(newNotice);

        if (writeNotices(notices)) {
            res.json({ 
                success: true, 
                message: 'Notice added successfully',
                notice: newNotice 
            });
        } else {
            // Delete uploaded file if save fails
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save notice' 
            });
        }
    } catch (error) {
        console.error('Error adding notice:', error);
        // Delete uploaded file if error occurs
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            success: false, 
            message: 'Error adding notice' 
        });
    }
});

// PUT update notice
app.put('/api/notices/:id', upload.single('attachment'), (req, res) => {
    try {
        const noticeId = parseInt(req.params.id);
        const { title, category, date, priority, author, content, removeAttachment } = req.body;

        // Validation
        if (!title || !category || !date || !author || !content) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        let notices = readNotices();
        const noticeIndex = notices.findIndex(n => n.id === noticeId);

        if (noticeIndex === -1) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ 
                success: false, 
                message: 'Notice not found' 
            });
        }

        const oldNotice = notices[noticeIndex];

        // Delete old attachment if removing or replacing
        if ((removeAttachment === 'true' || req.file) && oldNotice.attachmentPath) {
            const oldFilePath = path.join(__dirname, oldNotice.attachmentPath);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // Update notice
        notices[noticeIndex] = {
            ...oldNotice,
            title: title.trim(),
            category: category.trim(),
            date: date.trim(),
            priority: priority || 'Normal',
            author: author.trim(),
            content: content.trim(),
            attachmentName: req.file ? req.file.originalname : (removeAttachment === 'true' ? '' : oldNotice.attachmentName),
            attachmentPath: req.file ? `/uploads/${req.file.filename}` : (removeAttachment === 'true' ? '' : oldNotice.attachmentPath),
            attachmentSize: req.file ? req.file.size : (removeAttachment === 'true' ? 0 : oldNotice.attachmentSize),
            updatedAt: new Date().toISOString()
        };

        if (writeNotices(notices)) {
            res.json({ 
                success: true, 
                message: 'Notice updated successfully',
                notice: notices[noticeIndex]
            });
        } else {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update notice' 
            });
        }
    } catch (error) {
        console.error('Error updating notice:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            success: false, 
            message: 'Error updating notice' 
        });
    }
});

// DELETE notice
app.delete('/api/notices/:id', (req, res) => {
    try {
        const noticeId = parseInt(req.params.id);

        if (!noticeId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Notice ID required' 
            });
        }

        let notices = readNotices();
        const notice = notices.find(n => n.id === noticeId);
        const initialLength = notices.length;
        notices = notices.filter(notice => notice.id !== noticeId);

        if (notices.length === initialLength) {
            return res.status(404).json({ 
                success: false, 
                message: 'Notice not found' 
            });
        }

        // Delete attached file if exists
        if (notice && notice.attachmentPath) {
            const filePath = path.join(__dirname, notice.attachmentPath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        if (writeNotices(notices)) {
            res.json({ 
                success: true, 
                message: 'Notice deleted successfully' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to delete notice' 
            });
        }
    } catch (error) {
        console.error('Error deleting notice:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting notice' 
        });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 School Notice Server running at http://localhost:${PORT}`);
    console.log(`📄 View notices: http://localhost:${PORT}/`);
    console.log(`➕ Add notice: http://localhost:${PORT}/add-notice.html`);
});
