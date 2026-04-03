const mongoose = require('mongoose');
const placeBaseSchema = require('./placeBaseSchema');

const placeSchema = new mongoose.Schema({
  ...placeBaseSchema.obj,
  category: { 
    type: String, 
    required: true   
  }
}, { timestamps: true });

module.exports = mongoose.model('Place', placeSchema);
