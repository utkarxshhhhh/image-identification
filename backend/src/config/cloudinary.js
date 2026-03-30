const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Multer-Cloudinary storage for 3D model files (.glb).
 * Files are stored under the "ar-food-menu/models" folder in Cloudinary.
 * raw resource_type is required for non-image binary files.
 */
const modelStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ar-food-menu/models",
    resource_type: "raw",
    allowed_formats: ["glb"],
  },
});

/**
 * Multer-Cloudinary storage for food item images.
 * Files are stored under the "ar-food-menu/images" folder in Cloudinary.
 */
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ar-food-menu/images",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const uploadModel = multer({ storage: modelStorage });
const uploadImage = multer({ storage: imageStorage });

module.exports = { cloudinary, uploadModel, uploadImage };
