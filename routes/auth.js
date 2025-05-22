// File: routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Register a new user
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
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login existing user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRes = await db.query(
      'SELECT id, password FROM users WHERE email = $1',
      [email]
    );
    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userRes.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
