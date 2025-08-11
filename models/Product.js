const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  targetAudience: {
    type: String,
    required: true,
  },
  budget: {
    type: Number,
    required: true,
  },
  duration: {
    type: String,
    required: true,
    enum: ["1 Week", "2 Weeks", "1 Month", "3 Months", "6 Months", "1 Year"],
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Fashion",
      "Electronics",
      "Health",
      "Food",
      "Travel",
      "Beauty",
      "Home",
      "Sports",
      "Education",
      "Finance",
      "Automotive",
      "Other",
    ],
  },
  keyFeatures: {
    type: [String],
    required: true,
  },
  productImage: {
    type: String,
    required: true,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
