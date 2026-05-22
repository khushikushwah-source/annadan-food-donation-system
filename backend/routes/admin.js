const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Listing = require('../models/Listing');
const protect = require('../middleware/auth');
const { sendOTPEmail } = require('../utils/emailService');

// Admin check middleware
const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({
        message: 'Admin access required!'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET all users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all listings
router.get('/listings', protect, adminOnly, async (req, res) => {
  try {
    const listings = await Listing.find({})
      .populate('donor', 'naam email city')
      .populate('acceptedBy', 'naam email')
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET pending NGOs
router.get('/pending-ngos', protect, adminOnly, async (req, res) => {
  try {
    const ngos = await User.find({
      'ngoDetails.verificationStatus': 'pending',
      'ngoDetails.ngoNaam': { $ne: '' },
    }).select('-password');
    res.json(ngos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// APPROVE NGO
router.put('/approve-ngo/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User nahi mila!' });
    }

    user.ngoDetails.verified = true;
    user.ngoDetails.verificationStatus = 'approved';
    await user.save();

    // Email bhejo NGO ko
    await sendApprovalEmail(user.email, user.naam, 'approved');

    res.json({ message: 'NGO approved ho gayi!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// REJECT NGO
router.put('/reject-ngo/:id', protect, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User nahi mila!' });
    }

    user.ngoDetails.verified = false;
    user.ngoDetails.verificationStatus = 'rejected';
    user.ngoDetails.rejectionReason = reason || 'Documents incomplete';
    await user.save();

    // Email bhejo NGO ko
    await sendApprovalEmail(user.email, user.naam, 'rejected', reason);

    res.json({ message: 'NGO reject ho gayi!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE USER
router.delete('/user/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User delete ho gaya!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalListings = await Listing.countDocuments();
    const availableListings = await Listing.countDocuments({ status: 'available' });
    const acceptedListings = await Listing.countDocuments({ status: 'accepted' });
    const completedListings = await Listing.countDocuments({ status: 'completed' });
    const expiredListings = await Listing.countDocuments({ status: 'expired' });
    const pendingNGOs = await User.countDocuments({
      'ngoDetails.verificationStatus': 'pending',
      'ngoDetails.ngoNaam': { $ne: '' },
    });

    res.json({
      totalUsers,
      totalListings,
      availableListings,
      acceptedListings,
      completedListings,
      expiredListings,
      pendingNGOs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Email helper function
const sendApprovalEmail = async (email, naam, status, reason = '') => {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const subject = status === 'approved'
    ? 'Annadan — NGO Verified! ✓'
    : 'Annadan — NGO Verification Update';

  const html = status === 'approved'
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #7B2FFF;">🌾 Annadan</h2>
        <h3 style="color: #00D68F;">✓ Aapki NGO verify ho gayi!</h3>
        <p>Namaste ${naam} Ji,</p>
        <p>Badhaai ho! Aapki NGO Annadan par verified ho gayi hai.</p>
        <p>Ab aap food listings accept kar sakte hain aur zaroortmand logon tak khana pahuncha sakte hain.</p>
        <div style="background: #EAF5EF; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <strong style="color: #00D68F;">Ab aap kar sakte hain:</strong><br/>
          ✓ Food listings dekh sakte hain<br/>
          ✓ Listings accept kar sakte hain<br/>
          ✓ Donors se chat kar sakte hain
        </div>
        <p>Annadan ki team ki taraf se shukriya! 🙏</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #7B2FFF;">🌾 Annadan</h2>
        <h3>NGO Verification Update</h3>
        <p>Namaste ${naam} Ji,</p>
        <p>Humne aapki NGO verification request review ki hai.</p>
        <div style="background: #FEF2F2; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <strong style="color: #FF5C7A;">Status: Rejected</strong><br/>
          <strong>Reason:</strong> ${reason || 'Documents incomplete'}
        </div>
        <p>Sahi documents ke saath dobara apply kar sakte hain.</p>
        <p>Koi sawaal ho to humse contact karo.</p>
      </div>
    `;

  await transporter.sendMail({
    from: `"Annadan 🌾" <${process.env.EMAIL}>`,
    to: email,
    subject,
    html,
  });
};

module.exports = router;