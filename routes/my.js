router.get('/my', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, s.name AS slot_name
      FROM reservations r
      JOIN slots s ON s.id = r.slot_id
      WHERE r.user_id = $1
      ORDER BY start_date DESC, start_time DESC
    `, [req.user.userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reservations:', err);
    res.status(500).json({ message: 'Failed to load your bookings' });
  }
});
