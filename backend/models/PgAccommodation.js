const mongoose = require('mongoose');
const placeBaseSchema = require('./placeBaseSchema');

module.exports = mongoose.model('PgAccommodation', placeBaseSchema, 'pg_accommodations');
