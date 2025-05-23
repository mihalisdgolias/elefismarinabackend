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

// ... (your CORS configuration and other app.use middleware like express.json())
// For example:
// app.use(cors(corsOptions)); // Assuming corsOptions is defined
app.use(express.json());   // Ensure this is present

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ADD THIS NEW TEST ROUTE HERE:
app.get('/api/ping', (req, res) => {
  // This log should appear in your Azure App Service Log Stream
  console.log('PING! >>> /api/ping route was hit at ' + new Date().toISOString());
  
  // Send a JSON response back to the browser
  res.status(200).json({ 
    success: true, 
    message: 'Pong!', 
    timestamp: new Date().toISOString() 
  });
});
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// Your existing routes
app.use('/api/auth', authRoutes);
app.use('/api/booking', bookingRoutes);

// ... (your /api/test-db route, app.listen, etc.)
// For example:
// app.get('/api/test-db', async (req, res) => { ... });
// app.listen(PORT, () => { ... });