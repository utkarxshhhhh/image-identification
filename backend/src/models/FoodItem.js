const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    ingredients: {
      type: [String],
      default: [],
    },
    calories: {
      type: Number,
      min: [0, "Calories cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
    },
    // URL of the .glb 3D model stored in Cloudinary
    modelUrl: {
      type: String,
    },
    // URL of the food item preview image
    imageUrl: {
      type: String,
    },
    // Data-URL of the generated QR code (base64 PNG)
    qrCodeUrl: {
      type: String,
    },
    // Analytics: number of times the AR view page was opened
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodItem", foodItemSchema);
