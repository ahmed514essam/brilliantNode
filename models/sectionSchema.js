const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  smallTitle: String,
  bigTitle: String,
  name: String,
  description: String,
  imageUrl: String,
  imagePublicId: String
});

module.exports = mongoose.model("Section", sectionSchema);
