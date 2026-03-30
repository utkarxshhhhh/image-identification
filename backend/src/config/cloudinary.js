const { v2: cloudinary } = require("cloudinary");
const multer = require("multer");

// Configure Cloudinary credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Wrap cloudinary's upload_stream in a Promise so it can be awaited.
 * @param {Buffer} buffer  - File data from multer memoryStorage
 * @param {object} options - Cloudinary upload options (folder, resource_type, …)
 * @returns {Promise<object>} Cloudinary upload result (contains secure_url, etc.)
 */
const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(buffer);
  });

/**
 * Single multer instance using in-memory storage.
 * Files are held as Buffers in req.files, then manually streamed to Cloudinary.
 * Accepts both "model" (.glb) and "image" (jpg/png/webp) fields.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB cap
}).fields([
  { name: "model", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

module.exports = { cloudinary, uploadBuffer, upload };
