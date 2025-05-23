// File: routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Assuming your db.js is one level up

// Register a new user (Your existing code - keep as is unless you want to enhance it too)
router.post('/register', async (req, res) => {
  const {
    first_name,
    last_name,
    phone,
    email,
    company,
    vessel_name,
    password
  } = req.body;

  console.log('Register attempt with body:', req.body); // Good to keep for debugging

  try {
    // Check for existing user
    const { rows } = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password and insert
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertRes = await db.query(
      `INSERT INTO users 
          (first_name, last_name, phone, email, company, vessel_name, password)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING id`,
      [
        first_name,
        last_name,
        phone,
        email,
        company,
        vessel_name,
        hashedPassword
      ]
    );

    // Sign JWT
    const token = jwt.sign(
      { userId: insertRes.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token });
  } catch (err) {
    console.error('Registration error details:', err); // Enhanced logging
    // Add more specific error checks here if needed for registration
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined for registration!');
        return res.status(500).json({ message: 'Server configuration error - JWT secret missing' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login existing user (with suggested enhancements)
router.post('/login', async (req, res) => {
  console.log('Login attempt with body:', req.body); // Keep for debugging
  const { email, password } = req.body;

  // 1. Explicitly check for missing email or password
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Optional: Basic email format check
  if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'Invalid email format' });
  }

  // Optional: Check password type
  if (typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid password format' });
  }

  try {
    const userRes = await db.query(
      'SELECT id, password FROM users WHERE email = $1',
      [email]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials - user not found' });
    }

    const user = userRes.rows[0];

    if (!user.password) {
        console.error(`User ${email} found but has no password in DB during login.`);
        return res.status(500).json({ message: 'Server error - account configuration issue' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials - password mismatch' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });

  } catch (err) {
    console.error('Login error details:', err); // Log the full error

    if (err.message && err.message.includes('data and salt arguments required')) {
        return res.status(400).json({ message: 'Password cannot be empty or is invalid for comparison' });
    }
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined for login!');
        return res.status(500).json({ message: 'Server configuration error - JWT secret missing' });
    }
    res.status(500).json({ message: 'Server error during login processing' });
  }
});

module.exports = router;