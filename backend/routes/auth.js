const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token banane ka function
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// REGISTER — POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { naam, phone, email, password, city } = req.body;

    // Check karo pehle se hai ya nahi
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: 'Ye email pehle se registered hai'
      });
    }

    // Password encrypt karo
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // User banao
    const user = await User.create({
      naam,
      phone,
      email,
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

// LOGIN — POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // User dhundho
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: 'Email ya password galat hai'
      });
    }

    // Password check karo
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Email ya password galat hai'
      });
    }

    // Last role save karo
    user.lastRole = role;
    await user.save();

    // Token bhejo
    res.json({
      message: 'Login ho gaya!',
      token: generateToken(user._id, role),
      user: {
        id: user._id,
        naam: user.naam,
        email: user.email,
        city: user.city,
        role: role,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;