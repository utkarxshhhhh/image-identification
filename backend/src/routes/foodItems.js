const express = require("express");
const QRCode = require("qrcode");

const FoodItem = require("../models/FoodItem");
const { protect } = require("../middleware/auth");
const { upload, uploadBuffer } = require("../config/cloudinary");

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Upload a file received by multer memoryStorage to Cloudinary.
 * Returns the secure_url string, or undefined when no file is provided.
 */
async function storeFile(file, folder, resourceType) {
  if (!file) return undefined;
  const result = await uploadBuffer(file.buffer, {
    folder,
    resource_type: resourceType,
  });
  return result.secure_url;
}

// ── GET /api/items/public/:id  (no auth – used by AR viewer) ────────────────
router.get("/public/:id", async (req, res) => {
  try {
    const item = await FoodItem.findById(req.params.id).select("-owner");
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Increment view count (fire-and-forget)
    FoodItem.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// All routes below require authentication ────────────────────────────────────
router.use(protect);

// ── GET /api/items  – list all items owned by the logged-in restaurant ───────
router.get("/", async (req, res) => {
  try {
    const items = await FoodItem.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST /api/items  – create a new food item ────────────────────────────────
// Accepts multipart/form-data with optional "model" (.glb) and "image" fields.
router.post("/", upload, async (req, res) => {
  try {
    const { name, price, ingredients, calories, description } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    const itemData = {
      owner: req.user.id,
      name,
      price: parseFloat(price),
      calories: calories ? parseFloat(calories) : undefined,
      description,
      ingredients: ingredients ? JSON.parse(ingredients) : [],
    };

    // Upload files to Cloudinary (if provided)
    itemData.modelUrl = await storeFile(
      req.files?.model?.[0],
      "ar-food-menu/models",
      "raw"
    );
    itemData.imageUrl = await storeFile(
      req.files?.image?.[0],
      "ar-food-menu/images",
      "image"
    );

    const item = await FoodItem.create(itemData);

    // Generate QR code linking to the public AR viewer page
    const viewUrl = `${process.env.FRONTEND_URL}/view/${item._id}`;
    item.qrCodeUrl = await QRCode.toDataURL(viewUrl);
    await item.save();

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── PUT /api/items/:id  – update an existing item ────────────────────────────
router.put("/:id", upload, async (req, res) => {
  try {
    const item = await FoodItem.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!item) return res.status(404).json({ message: "Item not found" });

    const { name, price, ingredients, calories, description } = req.body;

    if (name !== undefined) item.name = name;
    if (price !== undefined) item.price = parseFloat(price);
    if (calories !== undefined) item.calories = parseFloat(calories);
    if (description !== undefined) item.description = description;
    if (ingredients !== undefined) item.ingredients = JSON.parse(ingredients);

    // Only overwrite file URLs when new files are uploaded
    const newModelUrl = await storeFile(
      req.files?.model?.[0],
      "ar-food-menu/models",
      "raw"
    );
    const newImageUrl = await storeFile(
      req.files?.image?.[0],
      "ar-food-menu/images",
      "image"
    );
    if (newModelUrl) item.modelUrl = newModelUrl;
    if (newImageUrl) item.imageUrl = newImageUrl;

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── DELETE /api/items/:id ─────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const item = await FoodItem.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!item) return res.status(404).json({ message: "Item not found" });

    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/items/:id/qr  – (re)generate QR code ───────────────────────────
router.get("/:id/qr", async (req, res) => {
  try {
    const item = await FoodItem.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!item) return res.status(404).json({ message: "Item not found" });

    const viewUrl = `${process.env.FRONTEND_URL}/view/${item._id}`;
    item.qrCodeUrl = await QRCode.toDataURL(viewUrl);
    await item.save();

    res.json({ qrCodeUrl: item.qrCodeUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
