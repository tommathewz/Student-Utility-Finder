const mongoose = require('mongoose');

// Shared schema for all category collections
const placeBaseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      default: null
    },
    contact: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    gmapLink: {
      type: String,
      default: ''
    },
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    },
    description: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = placeBaseSchema;
