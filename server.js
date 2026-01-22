require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("=== DB Connected Successfully ===");
    // Check collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      console.log(
        "Available collections:",
        collections.map((c) => c.name),
      );
    });
  })
  .catch((err) => {
    console.error("=== MONGO CONNECTION ERROR ===");
    console.error(err);
  });

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const ImageSchema = new mongoose.Schema({
  event: String,
  filename: String,
  path: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  isCover: {
    type: Boolean,
    default: false,
  },
});

const NoticeSchema = new mongoose.Schema({
  title: String,
  description: String,
  file: String, // file path
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notice = mongoose.model("Notice", NoticeSchema);
const Image = mongoose.model("Image", ImageSchema);
const User = mongoose.model("User", UserSchema);

// ===== STATIC FILE SERVING =====
// THIS IS THE KEY FIX - Serve static files BEFORE routes
app.use("/uploads", express.static("uploads"));
app.use("/notice_files", express.static("notice_files")); // ← ADD THIS LINE

// REGISTER
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const exist = await User.findOne({ email });
  if (exist) return res.json({ msg: "User exists" });

  const hash = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hash });

  res.json({ msg: "Registered successfully" });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ msg: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ msg: "Wrong password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ token });
});

// PROTECTED
const verify = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.json({ msg: "No token" });

  jwt.verify(token, process.env.JWT_SECRET, (err) => {
    if (err) return res.json({ msg: "Invalid token" });
    next();
  });
};

app.get("/dashboard", verify, (req, res) => {
  res.json({ msg: "Welcome" });
});

// ===== MULTER CONFIG FOR GALLERY IMAGES =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `uploads/${req.body.event}`;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
// GET USER INFO
app.get("/user-info", verify, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    res.json({ 
      name: user.name,
      email: user.email 
    });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching user info" });
  }
});
const upload = multer({ storage });

// ===== MULTER CONFIG FOR NOTICES =====
const noticeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create notice_files folder if it doesn't exist
    const dir = "notice_files";
    if (!fs.existsSync(dir)) {
      console.log("Creating notice_files directory...");
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const uniqueName = Date.now() + "-" + file.originalname;
    console.log("Saving file as:", uniqueName);
    cb(null, uniqueName);
  },
});

const noticeUpload = multer({ 
  storage: noticeStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept common file types
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed!'));
    }
  }
});

// UPLOAD GALLERY IMAGES
app.post("/upload", verify, upload.array("images", 20), async (req, res) => {
  const { event } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.json({ msg: "No files uploaded" });
  }

  const docs = req.files.map((file) => ({
    event,
    filename: file.filename,
    path: file.path,
  }));

  await Image.insertMany(docs);

  res.json({ msg: "Images uploaded successfully" });
});

// GET ALL EVENTS
app.get("/events", async (req, res) => {
  const events = await Image.distinct("event");
  res.json(events);
});

// GET IMAGES BY EVENT
app.get("/images/:event", async (req, res) => {
  const data = await Image.find({ event: req.params.event });
  res.json(data);
});

// CREATE NEW EVENT
app.post("/create-event", verify, async (req, res) => {
  const { event } = req.body;

  if (!event) {
    return res.json({ msg: "Event name required" });
  }

  // Check if event already exists
  const exist = await Image.findOne({ event });

  if (exist) {
    return res.json({ msg: "Event already exists" });
  }

  // Create dummy record so event appears
  await Image.create({
    event,
    filename: "init",
    path: "init",
  });

  res.json({ msg: "Event created" });
});

// DELETE EVENT
app.delete("/delete-event/:event", verify, async (req, res) => {
  const { event } = req.params;

  // delete from DB
  await Image.deleteMany({ event });

  // delete folder
  const dir = `uploads/${event}`;
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  res.json({ msg: "Event deleted" });
});

// RENAME EVENT
app.put("/rename-event", verify, async (req, res) => {
  const { oldEvent, newEvent } = req.body;
  if (!oldEvent || !newEvent) return res.json({ msg: "Both names required" });
  // check duplicate
  const exist = await Image.findOne({ event: newEvent });
  if (exist) return res.json({ msg: "New event name already exists" });
  // update DB
  await Image.updateMany({ event: oldEvent }, { $set: { event: newEvent } });
  // rename folder
  const oldDir = `uploads/${oldEvent}`;
  const newDir = `uploads/${newEvent}`;
  if (fs.existsSync(oldDir)) {
    fs.renameSync(oldDir, newDir);
  }
  res.json({ msg: "Event renamed" });
});

// GET EVENTS STATS
app.get("/events-stats", async (req, res) => {
  const data = await Image.aggregate([
    { $group: { _id: "$event", count: { $sum: 1 } } },
  ]);
  res.json(data);
});

// DELETE SINGLE IMAGE
app.post("/delete-image", verify, async (req, res) => {
  const { id, path } = req.body;

  await Image.findByIdAndDelete(id);

  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }

  res.json({ msg: "deleted" });
});

// SET COVER IMAGE
app.post("/set-cover", verify, async (req, res) => {
  const { event, id } = req.body;

  await Image.updateMany({ event }, { $set: { isCover: false } });
  await Image.findByIdAndUpdate(id, { isCover: true });
  res.json({ msg: "Cover image updated" });
});

// PUBLIC EVENTS (with cover image)
app.get("/public-events", async (req, res) => {
  console.log("=== PUBLIC-EVENTS ENDPOINT CALLED ===");
  console.log("Time:", new Date().toISOString());

  try {
    // First, let's check if we have any images at all
    const totalImages = await Image.countDocuments();
    console.log("Total images in database:", totalImages);

    if (totalImages === 0) {
      console.log("No images found in database");
      return res.json([]);
    }

    // Get a sample image to see the structure
    const sampleImage = await Image.findOne();
    console.log(
      "Sample image structure:",
      JSON.stringify(sampleImage, null, 2)
    );

    console.log("Starting aggregation...");

    const data = await Image.aggregate([
      {
        $sort: { isCover: -1 }, // Cover images first
      },
      {
        $group: {
          _id: "$event",
          coverImage: { $first: "$path" },
          isCover: { $first: "$isCover" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          event: "$_id",
          cover: "$coverImage",
          count: 1,
        },
      },
    ]);

    console.log("Aggregation successful!");
    console.log("Number of events found:", data.length);
    console.log("Events data:", JSON.stringify(data, null, 2));

    res.json(data);
  } catch (err) {
    console.error("=== ERROR OCCURRED ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);

    res.status(500).json({
      msg: "Server error",
      error: err.message,
      errorName: err.name,
    });
  }
});

// ===== NOTICE ENDPOINTS =====

// GET ALL NOTICES
app.get("/notices", async (req, res) => {
  console.log("=== NOTICES ENDPOINT CALLED ===");
  try {
    console.log("Fetching notices from database...");
    const data = await Notice.find().sort({ createdAt: -1 });
    console.log("Notices found:", data.length);
    console.log("Notices data:", JSON.stringify(data, null, 2));
    res.json(data);
  } catch (err) {
    console.error("=== NOTICES ERROR ===");
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({
      msg: "Error fetching notices",
      error: err.message,
    });
  }
});

// ADD NEW NOTICE
app.post("/add-notice", verify, noticeUpload.single("file"), async (req, res) => {
  console.log("=== ADD NOTICE ENDPOINT CALLED ===");
  console.log("Request body:", req.body);
  console.log("Request file:", req.file);

  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ 
        msg: "Title and description are required",
        success: false 
      });
    }

    // Prepare file path (will be served via /notice_files/)
    let filePath = null;
    if (req.file) {
      // Store relative path that matches the static serving route
      filePath = `notice_files/${req.file.filename}`;
      console.log("File saved to:", req.file.path);
      console.log("File will be accessible at:", filePath);
    }

    const newNotice = await Notice.create({
      title,
      description,
      file: filePath,
    });

    console.log("Notice created successfully:", newNotice);

    res.json({ 
      msg: "Notice added successfully",
      success: true,
      notice: newNotice
    });
  } catch (err) {
    console.error("=== ADD NOTICE ERROR ===");
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
    
    res.status(500).json({
      msg: "Error adding notice",
      error: err.message,
      success: false
    });
  }
});

// DELETE NOTICE
app.delete("/notice/:id", verify, async (req, res) => {
  console.log("=== DELETE NOTICE ===");
  console.log("Notice ID:", req.params.id);

  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ msg: "Notice not found" });
    }

    // Delete the file if it exists
    if (notice.file) {
      const filePath = notice.file;
      console.log("Attempting to delete file:", filePath);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("File deleted successfully");
      } else {
        console.log("File not found on disk:", filePath);
      }
    }

    // Delete from database
    await Notice.findByIdAndDelete(req.params.id);

    console.log("Notice deleted successfully");
    res.json({ msg: "Notice deleted", success: true });
  } catch (err) {
    console.error("Delete notice error:", err);
    res.status(500).json({
      msg: "Error deleting notice",
      error: err.message,
      success: false
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("=== Static file routes ===");
  console.log("Gallery images: /uploads");
  console.log("Notice files: /notice_files");
});