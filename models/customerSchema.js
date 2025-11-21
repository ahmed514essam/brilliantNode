const mongoose = require("mongoose");
const customerSchema = new mongoose.Schema({
  
    fullname: String,
    phone: String,
    governorate: String,
    address: String
  

 
});

module.exports = mongoose.model("Customer", customerSchema);
