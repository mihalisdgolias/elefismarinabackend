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
const FRONTEND = process.env.CORS_ORIGIN || 'https://mango-hill-02c811a0f.6.azurestaticapps.net'; // Ensure this is set in .env

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [FRONTEND]; // Ensure only the frontend domain is allowed
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // Ensure credentials are properly passed
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Enable CORS globally with correct options
app.use(cors(corsOptions));

// Explicitly handle preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', FRONTEND);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.sendStatus(200);
  }
  next();
});

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

// Debug endpoint to check live CORS settings
app.get('/api/test-cors', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': FRONTEND,
    'Access-Control-Allow-Credentials': 'true',
  });
  res.json({ message: 'CORS headers set correctly!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
