const mongoose = require("mongoose");

const sellSchema = new mongoose.Schema({
  selltitle: String,
  imageUrlsell: String,
  imagePublicIdsell: String
});

module.exports = mongoose.model("Sell", sellSchema);
