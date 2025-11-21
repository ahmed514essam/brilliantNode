const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema({
 
  aboutfoam: String,
  imageUrlfoam: String,
  imagePublicIdfoam: String,

  aboutwax: String,
  imageUrlwax: String,
  imagePublicIdwax: String
});

module.exports = mongoose.model("About", aboutSchema);
