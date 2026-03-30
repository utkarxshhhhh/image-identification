const mongoose = require("mongoose");

/**
 * Connect to MongoDB using the URI from environment variables.
 * Exits the process on connection failure so the server doesn't
 * silently run without a database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
