const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: String,
  filename: String
});

const orderSchema =new mongoose.Schema({
orderNumber: { type: Number, unique: true },


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
  totalPrice: Number,

  status: {
    type: String,
    enum: ["انتظار", "تم الشحن", "مكتمل"],
    default: "انتظار",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }
});




orderSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const lastOrder = await mongoose
    .model("Order")
    .findOne()
    .sort({ orderNumber: -1 });

  this.orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;

  next();
});


orderSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const lastOrder = await mongoose
      .model("Order")
      .findOne()
      .sort({ orderNumber: -1 });

    this.orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;

    next();
  } catch (err) {
    next(err);
  }
});



module.exports = mongoose.model("Order", orderSchema);
