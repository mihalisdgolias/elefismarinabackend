// File: server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const db = require('./db');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const FRONTEND = process.env.CORS_ORIGIN; // eg. https://mango-hill-02c811a0f.6.azurestaticapps.net
const corsOptions = {
  origin: FRONTEND,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Preflight handler
app.options('*', cors(corsOptions));

// Enable CORS for all routes
app.use(cors(corsOptions));

// JSON body parsing
app.use(express.json());

// Auth and booking endpoints
app.use('/api/auth', authRoutes);
app.use('/api/booking', bookingRoutes);

// Health-check / DB-test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    console.error('DB test error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
