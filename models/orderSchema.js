const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: String,
  filename: String
});

const orderSchema =new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },

  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      priceAfterDiscount: Number,
      qty: Number,
      image: [imageSchema] // <=== هنا بنحفظ كل صور المنتج اللي اتشترا
    }
  ],
  status: {
  type: String,
  enum: ["pending", "shipped", "completed", "canceled"],
  default: "pending"
},


  totalPrice: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
