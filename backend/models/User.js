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
  // Role login ke time decide hoga
  lastRole: {
    type: String,
    enum: ['donor', 'ngo'],
    default: 'donor',
  },
  // NGO details — agar kabhi NGO role liya
  ngoDetails: {
    ngoNaam: String,
    registrationNo: String,
    address: String,
    capacity: Number,
    verified: {
      type: Boolean,
      default: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);