const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  naam: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  lastRole: {
    type: String,
    enum: ['donor', 'ngo'],
    default: 'donor',
  },
  // NGO details
  ngoDetails: {
    ngoNaam: { type: String, default: '' },
    registrationNo: { type: String, default: '' },
    address: { type: String, default: '' },
    capacity: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: '' },
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);