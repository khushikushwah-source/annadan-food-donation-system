const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  khana: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  photo: {
    type: String,
    default: '',
  },
  banneKaTime: {
    type: Date,
    required: true,
  },
  safeTime: {
    type: Date,
    required: true,
  },
  location: {
    address: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  status: {
    type: String,
    enum: ['available', 'accepted', 'completed', 'expired'],
    default: 'available',
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Listing', listingSchema);