const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// POST /api/booking/available - return slots available for a time range
router.post('/available', authenticateToken, async (req, res) => {
  const { start_date, start_time, end_date, end_time } = req.body;

  try {
    const start = `${start_date} ${start_time}`;
    const end = `${end_date} ${end_time}`;

    const result = await db.query(`
      SELECT * FROM slots
      WHERE id NOT IN (
        SELECT slot_id FROM reservations
        WHERE (start_date + start_time, end_date + end_time)
        OVERLAPS ($1::timestamp, $2::timestamp)
      )
    `, [start, end]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching available slots:', err);
    res.status(500).json({ message: 'Failed to fetch available slots' });
  }
});

// POST /api/booking - create a reservation and send confirmation email
router.post('/', authenticateToken, async (req, res) => {
  const { slot_id, start_date, end_date, start_time, end_time, email } = req.body;

  try {
    // 1. Check for overlapping reservation
    const overlap = await db.query(
      `SELECT * FROM reservations
       WHERE slot_id = $1
       AND (start_date + start_time, end_date + end_time)
       OVERLAPS ($2::timestamp, $3::timestamp)`,
      [slot_id, `${start_date} ${start_time}`, `${end_date} ${end_time}`]
    );

    if (overlap.rows.length > 0) {
      return res.status(409).json({ message: 'Slot is already booked for this time.' });
    }

    // 2. Fetch slot and user
    const slot = await db.query('SELECT * FROM slots WHERE id = $1', [slot_id]);
    const user = await db.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);

    if (slot.rows.length === 0 || user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid slot or user.' });
    }

    const s = slot.rows[0];
    const u = user.rows[0];

    // 3. Calculate duration in hours
    const durationQuery = await db.query(
      `SELECT EXTRACT(EPOCH FROM ($2::time - $1::time))/3600 AS hours`,
      [start_time, end_time]
    );
    const hours = parseFloat(durationQuery.rows[0].hours);

    // 4. Apply pricing rules
    let multiplier = 1.0;
    const hour = parseInt(start_time.split(':')[0], 10);
    const dayOfWeekQuery = await db.query(`SELECT EXTRACT(DOW FROM $1::date) AS dow`, [start_date]);
    const dayOfWeek = parseInt(dayOfWeekQuery.rows[0].dow);

    const pricingRule = await db.query(
      `SELECT multiplier FROM slot_pricing_rules
       WHERE slot_id = $1 AND hour = $2 AND day_of_week = $3
       LIMIT 1`,
      [slot_id, hour, dayOfWeek]
    );

    if (pricingRule.rows.length > 0) {
      multiplier = parseFloat(pricingRule.rows[0].multiplier);
    }

    const baseRate = parseFloat(s.price);
    const totalPrice = parseFloat((baseRate * hours * multiplier).toFixed(2));

    // 5. Insert reservation
    await db.query(
      `INSERT INTO reservations (user_id, slot_id, start_date, end_date, start_time, end_time, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.userId, slot_id, start_date, end_date, start_time, end_time, totalPrice]
    );

    // 6. Send confirmation email
    const emailTo = email || u.email;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: emailTo,
      subject: 'Marina Reservation Confirmation',
      html: `
        <h2>Reservation Confirmed</h2>
        <p><strong>Slot:</strong> ${s.name || 'Slot ' + s.id}</p>
        <p><strong>Date:</strong> ${start_date} to ${end_date}</p>
        <p><strong>Time:</strong> ${start_time} to ${end_time}</p>
        <p><strong>Total:</strong> $${totalPrice}</p>
        <p>Thank you for booking with us.</p>
      `,
    });

    res.status(201).json({ message: 'Reservation successful', total_price: totalPrice });
  } catch (err) {
    console.error('Error creating reservation:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
