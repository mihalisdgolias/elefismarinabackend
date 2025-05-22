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

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
};
app.use(cors(corsOptions));

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
