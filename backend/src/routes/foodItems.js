const express = require("express");
const multer = require("multer");
const QRCode = require("qrcode");

const FoodItem = require("../models/FoodItem");
const { protect } = require("../middleware/auth");
const { uploadModel, uploadImage } = require("../config/cloudinary");

const router = express.Router();

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
// Accepts multipart/form-data with optional "model" and "image" file fields.
router.post(
  "/",
  (req, res, next) => {
    // Use multer fields to accept both model and image in one request
    const upload = multer({
      storage: uploadModel.storage,
    }).fields([
      { name: "model", maxCount: 1 },
      { name: "image", maxCount: 1 },
    ]);
    upload(req, res, next);
  },
  async (req, res) => {
    try {
      const { name, price, ingredients, calories, description } = req.body;

      if (!name || price === undefined) {
        return res
          .status(400)
          .json({ message: "Name and price are required" });
      }

      const itemData = {
        owner: req.user.id,
        name,
        price: parseFloat(price),
        calories: calories ? parseFloat(calories) : undefined,
        description,
        ingredients: ingredients
          ? JSON.parse(ingredients)
          : [],
      };

      if (req.files?.model?.[0]) {
        itemData.modelUrl = req.files.model[0].path;
      }
      if (req.files?.image?.[0]) {
        itemData.imageUrl = req.files.image[0].path;
      }

      const item = await FoodItem.create(itemData);

      // Generate QR code linking to the public AR viewer page
      const viewUrl = `${process.env.FRONTEND_URL}/view/${item._id}`;
      const qrCodeUrl = await QRCode.toDataURL(viewUrl);

      item.qrCodeUrl = qrCodeUrl;
      await item.save();

      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ── PUT /api/items/:id  – update an existing item ────────────────────────────
router.put(
  "/:id",
  (req, res, next) => {
    const upload = multer({
      storage: uploadModel.storage,
    }).fields([
      { name: "model", maxCount: 1 },
      { name: "image", maxCount: 1 },
    ]);
    upload(req, res, next);
  },
  async (req, res) => {
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
      if (ingredients !== undefined)
        item.ingredients = JSON.parse(ingredients);

      if (req.files?.model?.[0]) {
        item.modelUrl = req.files.model[0].path;
      }
      if (req.files?.image?.[0]) {
        item.imageUrl = req.files.image[0].path;
      }

      await item.save();
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

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
    const qrCodeUrl = await QRCode.toDataURL(viewUrl);

    item.qrCodeUrl = qrCodeUrl;
    await item.save();

    res.json({ qrCodeUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
