const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// ============================
// MIDDLEWARES
// ============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================
// STATIC FILES
// ============================
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve user-provided images folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// ============================
// ROUTES
// ============================
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const bookingRoutes = require('./routes/booking');
const statsRoutes = require('./routes/stats'); 
const serviceRoutes = require('./routes/services');

app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/stats', statsRoutes); // ✅ added

// ============================
// DEFAULT ROUTE
// ============================
app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ============================
// 404 HANDLER
// ============================
app.use((req, res, next) => {
res.status(404).json({ message: 'Route not found' });
});

// ============================
// GLOBAL ERROR HANDLER
// ============================
app.use((err, req, res, next) => {
console.error(err.stack);

res.status(500).json({
message: err.message || 'Something went wrong'
});
});

// ============================
// START SERVER
// ============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});