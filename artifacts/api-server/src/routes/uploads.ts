import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../lib/auth";

const router = Router();

// Resolve relative to dist/index.js (__dirname) so the upload directory is
// always correct regardless of the process launch directory.
const UPLOAD_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Two-layer allow-list: trusted MIME type AND safe extension.
// Both must match — prevents MIME spoofing AND extension-only attacks.
// application/octet-stream is intentionally excluded (too broad).
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
]);

// Canonical extension → accepted MIME types mapping.
// If extension does not appear here, upload is rejected regardless of MIME.
const ALLOWED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp",
  ".pdf", ".txt", ".doc", ".docx", ".zip",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Prefix with userId so ownership can be verified without a DB lookup.
    const userId = (req as typeof req & { user?: { userId: number } }).user?.userId ?? 0;
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `u${userId}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Supported: images (JPG/PNG/GIF/WebP), PDF, Word docs, plain text, ZIP."));
    }
  },
});

// DELETE /api/uploads/:filename
// Ownership check: filename must start with u{userId}- so users can only
// delete files they uploaded themselves. Admins may delete any file.
router.delete("/:filename", requireAuth, (req, res) => {
  const filename = req.params.filename as string;

  // Prevent path traversal — no slashes, no dots leading the name
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.startsWith("..")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  const userId = req.user!.userId;
  const isAdmin = req.user!.role === "admin";
  const ownerPrefix = `u${userId}-`;

  if (!isAdmin && !filename.startsWith(ownerPrefix)) {
    res.status(403).json({ error: "You can only delete your own uploads" });
    return;
  }

  const filePath = path.join(UPLOAD_DIR, filename);
  // Resolve and confirm the file is inside UPLOAD_DIR (belt-and-suspenders)
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }

  if (!fs.existsSync(filePath)) {
    // Idempotent — already gone is fine
    res.json({ message: "File deleted" });
    return;
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ message: "File deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete file" });
  }
});

router.post("/", requireAuth, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File too large. Maximum size is 10MB." });
      } else {
        res.status(400).json({ error: (err as Error).message ?? "Upload failed" });
      }
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({
      url,
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
    });
  });
});

export default router;
