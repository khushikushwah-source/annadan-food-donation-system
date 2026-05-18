const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

// Token banane ka function
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// ─────────────────────────────────────────
// SEND OTP — POST /api/auth/send-otp
// ─────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({
        message: 'Email aur purpose daalo!'
      });
    }

    // Register ke liye — check karo pehle se registered to nahi
    if (purpose === 'register') {
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({
          message: 'Ye email pehle se registered hai! Login karo.'
        });
      }
    }

    // Reset ke liye — check karo user exist karta hai
    if (purpose === 'reset') {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          message: 'Ye email registered nahi hai!'
        });
      }
    }

    // Purana OTP delete karo
    await OTP.deleteMany({ email, purpose });

    // Naya OTP banao
    const otp = generateOTP();

    // OTP database mein save karo
    await OTP.create({ email, otp, purpose });

    // Email bhejo
    await sendOTPEmail(email, otp, purpose);

    res.json({
      message: `OTP bheja gaya ${email} par!`
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'OTP bhejne mein error aaya!' });
  }
});

// ─────────────────────────────────────────
// VERIFY OTP — POST /api/auth/verify-otp
// ─────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    // OTP dhundho
    const otpRecord = await OTP.findOne({ email, purpose });

    if (!otpRecord) {
      return res.status(400).json({
        message: 'OTP expire ho gaya! Dobara bhejo.'
      });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        message: 'Galat OTP! Dobara try karo.'
      });
    }

    // OTP sahi hai — delete karo
    await OTP.deleteMany({ email, purpose });

    res.json({ message: 'OTP verify ho gaya!' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// REGISTER — POST /api/auth/register
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { naam, phone, email, password, city } = req.body;

    // Email check
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({
        message: 'Ye email pehle se registered hai! Login karo.'
      });
    }

    // Phone check — string trim karke compare karo
    const phoneExists = await User.findOne({ phone: phone.toString().trim() });
    if (phoneExists) {
      return res.status(400).json({
        message: 'Ye phone number pehle se registered hai! Login karo.'
      });
    }

    // Password encrypt karo
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // User banao
    const user = await User.create({
      naam,
      phone: phone.toString().trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      city,
    });

    res.status(201).json({
      message: 'Account ban gaya!',
      user: {
        id: user._id,
        naam: user.naam,
        email: user.email,
        city: user.city,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// LOGIN — POST /api/auth/login
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: 'Email ya password galat hai!'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Email ya password galat hai!'
      });
    }

    if (role && (role === 'donor' || role === 'ngo')) {
      user.lastRole = role;
      await user.save();
    }

    res.json({
      message: 'Login ho gaya!',
      token: generateToken(user._id, role || 'donor'),
      user: {
        id: user._id,
        naam: user.naam,
        email: user.email,
        city: user.city,
        role: role || 'donor',
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// RESET PASSWORD — POST /api/auth/reset-password
// ─────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: 'User nahi mila!'
      });
    }

    // Naya password encrypt karo
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password reset ho gaya! Ab login karo.' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;