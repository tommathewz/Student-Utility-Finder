const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const PgAccommodation = require('../models/PgAccommodation');
const Hostel = require('../models/Hostel');
const Apartment = require('../models/Apartment');
const Mess = require('../models/Mess');
const Restaurant = require('../models/Restaurant');
const Place = require('../models/Place');

const categoryModels = {
  pg: PgAccommodation,
  pg_accommodations: PgAccommodation,
  hostel: Hostel,
  hostels: Hostel,
  apartment: Apartment,
  apartments: Apartment,
  mess: Mess,
  messes: Mess,
  restaurant: Restaurant,
  restaurants: Restaurant
};

const collectionOrder = [
  { key: 'pg', label: 'pg', model: PgAccommodation },
  { key: 'hostels', label: 'hostels', model: Hostel },
  { key: 'apartments', label: 'apartments', model: Apartment },
  { key: 'messes', label: 'messes', model: Mess },
  { key: 'restaurants', label: 'restaurants', model: Restaurant }
];

function requireAdmin(req, res) {
  const isAdmin = req.headers['admin'];

  if (isAdmin !== 'true') {
    res.status(403).json({ error: 'Unauthorized' });
    return false;
  }

  return true;
}

function normalizeCategory(category) {
  return (category || '').toLowerCase().trim();
}

function getModelByCategory(category) {
  return categoryModels[normalizeCategory(category)] || Place;
}

function getCategoryLabel(category) {
  const normalizedCategory = normalizeCategory(category);

  if (normalizedCategory === 'pg' || normalizedCategory === 'pg_accommodations') {
    return 'pg';
  }

  if (normalizedCategory === 'hostel' || normalizedCategory === 'hostels') {
    return 'hostels';
  }

  if (normalizedCategory === 'apartment' || normalizedCategory === 'apartments') {
    return 'apartments';
  }

  if (normalizedCategory === 'mess' || normalizedCategory === 'messes') {
    return 'messes';
  }

  if (normalizedCategory === 'restaurant' || normalizedCategory === 'restaurants') {
    return 'restaurants';
  }

  return normalizedCategory;
}

function formatPlace(place, category) {
  return {
    ...place.toObject(),
    category: getCategoryLabel(category)
  };
}

async function getAllPlaces() {
  const groupedPlaces = await Promise.all(
    collectionOrder.map(async (entry) => {
      const places = await entry.model.find();
      return places.map((place) => formatPlace(place, entry.label));
    })
  );

  const genericPlaces = await Place.find();
  const formattedGenerics = genericPlaces.map((place) => formatPlace(place, place.category));

  return [...groupedPlaces.flat(), ...formattedGenerics];
}

async function findPlaceById(id) {
  for (const entry of collectionOrder) {
    const place = await entry.model.findById(id);

    if (place) {
      return {
        place,
        category: entry.label,
        model: entry.model
      };
    }
  }

  const genericPlace = await Place.findById(id);
  if (genericPlace) {
    return {
      place: genericPlace,
      category: genericPlace.category,
      model: Place
    };
  }

  return null;
}

// ==========================================
// @route   GET /places
// @desc    Get all places from every collection
// ==========================================
router.get('/', async (req, res) => {
  try {
    const places = await getAllPlaces();
    res.status(200).json(places);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching places', error: error.message });
  }
});

// ==========================================
// @route   GET /places/:category
// @desc    Get places by category or fetch one place by its id
// ==========================================
router.get('/:value', async (req, res) => {
  try {
    const { value } = req.params;
    
    if (mongoose.Types.ObjectId.isValid(value)) {
      const result = await findPlaceById(value);
      if (result) {
        return res.status(200).json(formatPlace(result.place, result.category));
      }
    }

    const SelectedModel = getModelByCategory(value);
    
    if (SelectedModel.modelName === 'Place') {
      const places = await SelectedModel.find({ category: { $regex: new RegExp(`^${value}$`, 'i') } });
      const formattedPlaces = places.map((place) => formatPlace(place, place.category));
      return res.status(200).json(formattedPlaces);
    } else {
      const places = await SelectedModel.find();
      const formattedPlaces = places.map((place) => formatPlace(place, value));
      return res.status(200).json(formattedPlaces);
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// ==========================================
// @route   POST /places
// @desc    Create a new place in the selected collection
// ==========================================
router.post('/', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) {
      return;
    }

    const {
      name,
      category,
      location,
      price,
      contact,
      imageUrl,
      gmapLink,
      description,
      rating
    } = req.body;

    const SelectedModel = getModelByCategory(category);

    if (!SelectedModel) {
      return res.status(400).json({ message: 'Invalid category selected' });
    }

    const newPlace = new SelectedModel({
      name,
      category,
      location,
      price,
      contact,
      imageUrl,
      gmapLink,
      description,
      rating
    });

    const savedPlace = await newPlace.save();

    res.status(201).json(formatPlace(savedPlace, category));
  } catch (error) {
    res.status(500).json({ message: 'Error creating the place', error: error.message });
  }
});

// ==========================================
// @route   PUT /places/:id
// @desc    Update an existing place
// ==========================================
router.put('/:id', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) {
      return;
    }

    const {
      name,
      category,
      location,
      price,
      contact,
      imageUrl,
      gmapLink,
      description,
      rating
    } = req.body;

    const SelectedModel = getModelByCategory(category);

    if (!SelectedModel) {
      return res.status(400).json({ message: 'Invalid category selected' });
    }

    const updatedPlace = await SelectedModel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        location,
        price,
        contact,
        imageUrl,
        gmapLink,
        description,
        rating
      },
      { new: true, runValidators: true }
    );

    if (!updatedPlace) {
      return res.status(404).json({ message: 'Place not found!' });
    }

    res.status(200).json({
      message: 'Place updated successfully!',
      updatedPlace: formatPlace(updatedPlace, category)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating the place', error: error.message });
  }
});

// ==========================================
// @route   DELETE /places/:id
// @desc    Delete an existing place
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) {
      return;
    }

    const result = await findPlaceById(req.params.id);

    if (!result) {
      return res.status(404).json({ message: 'Place not found!' });
    }

    await result.model.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Place deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting the place', error: error.message });
  }
});

module.exports = router;
