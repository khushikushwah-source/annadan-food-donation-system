const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const protect = require('../middleware/auth');

// LISTINGS GET KARO — GET /api/listings
router.get('/', protect, async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'available' })
      .populate('donor', 'naam city phone')
      .sort({ createdAt: -1 });

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LISTING POST KARO — POST /api/listings
router.post('/', protect, async (req, res) => {
  try {
    const {
      khana,
      quantity,
      banneKaTime,
      safeTime,
      location,
    } = req.body;

    const listing = await Listing.create({
      donor: req.user.id,
      khana,
      quantity,
      banneKaTime,
      safeTime,
      location,
    });

    res.status(201).json({
      message: 'Listing post ho gayi! NGOs ko notify kar diya.',
      listing,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LISTING ACCEPT KARO — PUT /api/listings/:id/accept
router.put('/:id/accept', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing nahi mili' });
    }

    if (listing.status !== 'available') {
      return res.status(400).json({
        message: 'Ye listing already accept ho chuki hai'
      });
    }

    listing.status = 'accepted';
    listing.acceptedBy = req.user.id;
    await listing.save();

    res.json({
      message: 'Listing accept ho gayi!',
      listing,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LISTING COMPLETE KARO — PUT /api/listings/:id/complete
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing nahi mili' });
    }

    listing.status = 'completed';
    await listing.save();

    res.json({
      message: 'Pickup complete ho gayi!',
      listing,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;