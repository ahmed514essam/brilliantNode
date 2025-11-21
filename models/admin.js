// models/admin.js
const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({

  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },

    imageUrl: { type: String, default: null },       
  imagePublicId: { type: String, default: null }   ,

  passwordHash: { type: String, required: true },  
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);
