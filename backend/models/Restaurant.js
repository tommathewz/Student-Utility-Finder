const mongoose = require('mongoose');
const placeBaseSchema = require('./placeBaseSchema');

module.exports = mongoose.model('Restaurant', placeBaseSchema, 'restaurants');
