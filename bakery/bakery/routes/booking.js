const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, admin } = require('../middleware/auth');

// =====================================================
// CREATE BOOKING (WITH SERVICES + TRANSACTION)
// =====================================================
router.post('/', protect, async (req, res) => {
const connection = await db.getConnection();

try {
const userId = req.user.id;

const {
  service_ids, // ARRAY of services
  event_date,
  event_time,
  location,
  guest_count,
  special_requests,
  contact_phone
} = req.body;

if (!service_ids || service_ids.length === 0 || !event_date || !location) {
  return res.status(400).json({
    message: 'Services, date, and location are required'
  });
}

await connection.beginTransaction();

// 🚫 Prevent double booking (same date + time)
const [existing] = await connection.query(
  `SELECT id FROM bookings 
   WHERE event_date = ? 
   AND event_time = ?
   AND status != 'rejected'`,
  [event_date, event_time]
);

if (existing.length > 0) {
  throw new Error('This date & time is already booked');
}

// Create booking
const [bookingResult] = await connection.query(
  `INSERT INTO bookings 
  (user_id, event_date, event_time, location, guest_count, special_requests, contact_phone)
  VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [
    userId,
    event_date,
    event_time,
    location,
    guest_count,
    special_requests,
    contact_phone
  ]
);

const bookingId = bookingResult.insertId;

// Get services
const [services] = await connection.query(
  `SELECT id, price, is_active FROM services WHERE id IN (?)`,
  [service_ids]
);

let totalAmount = 0;

for (let serviceId of service_ids) {
  const service = services.find(s => s.id === serviceId);

  if (!service || !service.is_active) {
    throw new Error(`Invalid service: ${serviceId}`);
  }

  totalAmount += service.price || 0;

  await connection.query(
    `INSERT INTO booking_services (booking_id, service_id)
     VALUES (?, ?)`,
    [bookingId, serviceId]
  );
}

// Create payment record
await connection.query(
  `INSERT INTO payments (user_id, booking_id, amount, payment_method, payment_status)
   VALUES (?, ?, ?, 'transfer', 'pending')`,
  [userId, bookingId, totalAmount]
);

await connection.commit();

res.status(201).json({
  message: 'Booking created successfully',
  bookingId,
  totalAmount
});

} catch (error) {
await connection.rollback();
res.status(500).json({ message: error.message });
} finally {
connection.release();
}
});

// =====================================================
// GET MY BOOKINGS (CUSTOMER)
// =====================================================
router.get('/my', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const [bookings] = await db.query(
      `SELECT b.*, s.name as service_name 
       FROM bookings b
       LEFT JOIN booking_services bs ON b.id = bs.booking_id
       LEFT JOIN services s ON bs.service_id = s.id
       WHERE b.user_id = ? 
       ORDER BY b.created_at DESC`,
      [userId]
    );

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// =====================================================
// GET SINGLE BOOKING (SECURED + SERVICES + PAYMENT)
// =====================================================
router.get('/:id', protect, async (req, res) => {
try {
const bookingId = req.params.id;
const userId = req.user.id;

const [rows] = await db.query(
  'SELECT * FROM bookings WHERE id = ?',
  [bookingId]
);

if (rows.length === 0) {
  return res.status(404).json({ message: 'Booking not found' });
}

const booking = rows[0];

// 🔐 Security check
if (booking.user_id !== userId && req.user.role !== 'admin') {
  return res.status(403).json({ message: 'Not authorized' });
}

// Get services
const [services] = await db.query(
  `SELECT s.id, s.name, s.price
   FROM booking_services bs
   JOIN services s ON bs.service_id = s.id
   WHERE bs.booking_id = ?`,
  [bookingId]
);

// Get payment
const [payment] = await db.query(
  `SELECT payment_status, payment_method, amount
   FROM payments
   WHERE booking_id = ?`,
  [bookingId]
);

res.json({
  booking,
  services,
  payment: payment[0] || null
});

} catch (error) {
res.status(500).json({ message: error.message });
}
});

// =====================================================
// GET ALL BOOKINGS (ADMIN)
// =====================================================
router.get('/', protect, admin, async (req, res) => {
try {
const [bookings] = await db.query(
"SELECT b.*, u.name, u.email, u.phone FROM bookings b JOIN users u ON b.user_id = u.id ORDER BY b.created_at DESC"
);

res.json(bookings);

} catch (error) {
res.status(500).json({ message: error.message });
}
});

// =====================================================
// UPDATE BOOKING STATUS (ADMIN)
// =====================================================
router.put('/:id/status', protect, admin, async (req, res) => {
try {
const { status } = req.body;

const allowed = ['pending', 'approved', 'rejected'];

if (!allowed.includes(status)) {
  return res.status(400).json({
    message: 'Invalid status'
  });
}

await db.query(
  'UPDATE bookings SET status = ? WHERE id = ?',
  [status, req.params.id]
);

res.json({ message: 'Booking status updated' });

} catch (error) {
res.status(500).json({ message: error.message });
}
});

// =====================================================
// CONFIRM BOOKING PAYMENT
// =====================================================
router.put('/:id/pay', protect, async (req, res) => {
try {
const bookingId = req.params.id;

await db.query(
  `UPDATE payments 
   SET payment_status = 'successful', paid_at = NOW()
   WHERE booking_id = ?`,
  [bookingId]
);

res.json({ message: 'Payment confirmed' });

} catch (error) {
res.status(500).json({ message: error.message });
}
});

// =====================================================
// DELETE BOOKING (ADMIN)
// =====================================================
router.delete('/:id', protect, admin, async (req, res) => {
try {
await db.query(
'DELETE FROM bookings WHERE id = ?',
[req.params.id]
);

res.json({ message: 'Booking deleted successfully' });

} catch (error) {
res.status(500).json({ message: error.message });
}
});

module.exports = router;