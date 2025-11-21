const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: String,
  filename: String
});



const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: Number,
  priceAfterDiscount:Number,
  discountPrice:Number,
  discount: Number,
  description: String,
category: {
  type: String,
  required: true,
  enum: ["wax", "foam"], 
},
  image: [imageSchema],
  createdAt: { type: Date, default: Date.now }
},
{ timestamps: true }

);

module.exports = mongoose.model("Product", productSchema);
