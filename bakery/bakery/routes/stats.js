const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, admin } = require('../middleware/auth');

// =====================================================
// GET SYSTEM STATS (ADMIN ONLY)
// =====================================================
router.get('/', protect, admin, async (req, res) => {
try {

// Run queries in parallel (FASTER)
const [
  [users],
  [orders],
  [revenue],
  [bookings],
  [payments],
  [recentOrders],
  [recentBookings]
] = await Promise.all([

  // Total users
  db.query(`SELECT COUNT(*) AS total FROM users`),

  // Total orders
  db.query(`SELECT COUNT(*) AS total FROM orders`),

  // Total revenue (ONLY successful payments)
  db.query(`
    SELECT IFNULL(SUM(amount), 0) AS total 
    FROM payments 
    WHERE payment_status = 'successful'
  `),

  // Total bookings
  db.query(`SELECT COUNT(*) AS total FROM bookings`),

  // Payment breakdown
  db.query(`
    SELECT 
      payment_status,
      COUNT(*) as count
    FROM payments
    GROUP BY payment_status
  `),

  // Recent orders (last 5)
  db.query(`
    SELECT id, total_price, status, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 5
  `),

  // Recent bookings (last 5)
  db.query(`
    SELECT id, event_date, status, created_at
    FROM bookings
    ORDER BY created_at DESC
    LIMIT 5
  `)

]);

res.json({
  summary: {
    totalUsers: users[0].total,
    totalOrders: orders[0].total,
    totalBookings: bookings[0].total,
    totalRevenue: revenue[0].total
  },
  payments,
  recent: {
    orders: recentOrders,
    bookings: recentBookings
  }
});

} catch (error) {
res.status(500).json({ message: error.message });
}
});

// =====================================================
// MONTHLY REVENUE (FOR CHARTS)
// =====================================================
router.get('/revenue/monthly', protect, admin, async (req, res) => {
try {
const [data] = await db.query("SELECT  DATE_FORMAT(created_at, '%Y-%m') as month, SUM(amount) as total FROM payments WHERE payment_status = 'successful' GROUP BY month ORDER BY month ASC");

res.json(data);

} catch (error) {
res.status(500).json({ message: error.message });
}
});

// =====================================================
// TOP SELLING PRODUCTS
// =====================================================
router.get('/top-products', protect, admin, async (req, res) => {
try {
const [products] = await db.query("SELECT  p.id, p.name, SUM(oi.quantity) as total_sold FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.id ORDER BY total_sold DESC LIMIT 5");

res.json(products);

} catch (error) {
res.status(500).json({ message: error.message });
}
});

// =====================================================
// BOOKINGS PER DAY (FOR CALENDAR VIEW)
// =====================================================
router.get('/bookings/daily', protect, admin, async (req, res) => {
try {
const [data] = await db.query("SELECT  event_date, COUNT(*) as total FROM bookings WHERE status != 'rejected' GROUP BY event_date ORDER BY event_date ASC");

res.json(data);

} catch (error) {
res.status(500).json({ message: error.message });
}
});

module.exports = router;