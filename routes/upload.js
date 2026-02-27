const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const router = express.Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, crypto.randomBytes(16).toString("hex") + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype);
    cb(ok ? null : new Error("Images only (jpg, png, gif, webp)"), ok);
  },
});

// POST /api/upload
router.post("/", (req, res) => {
  const auth = req.app.get("authMiddleware");
  auth(req, res, () => {
    upload.single("file")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || "Upload failed" });
      if (!req.file) return res.status(400).json({ error: "No file" });
      res.json({ url: "/uploads/" + req.file.filename });
    });
  });
});

module.exports = router;
