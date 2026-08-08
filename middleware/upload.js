const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const uploadBaseDir = path.join(__dirname, "..", "uploads");
const avatarDir = path.join(uploadBaseDir, "avatars");
const coverDir = path.join(uploadBaseDir, "covers");

[uploadBaseDir, avatarDir, coverDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "avatar") {
      cb(null, avatarDir);
    } else if (file.fieldname === "cover") {
      cb(null, coverDir);
    } else {
      cb(null, uploadBaseDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedName = file.originalname
      .replace(ext, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 20);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// File Type Filter (Images & PDFs allowed)
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf"
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error("INVALID_FILE_TYPE: Only JPG, PNG, WEBP, GIF, and PDF files are allowed.");
    err.code = "INVALID_FILE_TYPE";
    cb(err, false);
  }
};

// Multer Upload Instance (5MB Limit)
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Megabytes
  }
});

/**
 * Wrapper middleware to handle Multer upload errors cleanly
 */
const handleUpload = (fieldName) => {
  return (req, res, next) => {
    const uploadSingle = upload.single(fieldName);

    uploadSingle(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              success: false,
              message: "File size limit exceeded. Maximum allowed size is 5MB.",
              error: {
                code: "LIMIT_FILE_SIZE",
                details: "File exceeds 5MB limit."
              }
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
            error: { code: err.code }
          });
        }

        if (err.code === "INVALID_FILE_TYPE" || err.message.includes("INVALID_FILE_TYPE")) {
          return res.status(400).json({
            success: false,
            message: "Invalid file type. Only JPG, PNG, WEBP, GIF, and PDF files are allowed.",
            error: {
              code: "INVALID_FILE_TYPE",
              allowedTypes: ["JPG", "PNG", "WEBP", "GIF", "PDF"]
            }
          });
        }

        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed",
          error: { code: "UPLOAD_ERROR" }
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: `Please select a file to upload in the '${fieldName}' form field.`,
          error: { code: "NO_FILE_PROVIDED" }
        });
      }

      next();
    });
  };
};

module.exports = { handleUpload };
