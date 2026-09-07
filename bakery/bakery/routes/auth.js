//routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { protect } = require('../middleware/auth');

// ============================
// UPDATE PROFILE
// ============================
router.put('/update-profile', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      phone,
      street,
      city,
      state,
      postal_code,
      country
    } = req.body;

    // ============================
    // UPDATE USER (ONLY IF PROVIDED)
    // ============================
    if (name || phone) {
      // Get current user data first
      const [currentUser] = await db.query(
        'SELECT name, phone FROM users WHERE id = ?',
        [userId]
      );

      const updatedName = name || currentUser[0].name;
      const updatedPhone = phone || currentUser[0].phone;

      await db.query(
        'UPDATE users SET name = ?, phone = ? WHERE id = ?',
        [updatedName, updatedPhone, userId]
      );
    }

    // ============================
    // HANDLE ADDRESS
    // ============================
    if (street || city || state || postal_code || country) {

      const [existingAddress] = await db.query(
        'SELECT id FROM addresses WHERE user_id = ?',
        [userId]
      );

      if (existingAddress.length > 0) {
        // Update existing address
        await db.query(
          `UPDATE addresses 
           SET street = ?, city = ?, state = ?, postal_code = ?, country = ?
           WHERE user_id = ?`,
          [
            street,
            city,
            state,
            postal_code,
            country || 'Nigeria',
            userId
          ]
        );
      } else {
        // Insert new address
        await db.query(
          `INSERT INTO addresses 
           (user_id, street, city, state, postal_code, country)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            street,
            city,
            state,
            postal_code,
            country || 'Nigeria'
          ]
        );
      }
    }

    // ============================
    // RETURN UPDATED PROFILE
    // ============================
    const [updatedUser] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role,
              a.street, a.city, a.state, a.postal_code, a.country
       FROM users u
       LEFT JOIN addresses a ON u.id = a.user_id
       WHERE u.id = ?`,
      [userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser[0]
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================
// REGISTER
// ============================
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Insert user plain password
    const [result] = await db.query(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, password]
    );

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ============================
// GET PROFILE
// ============================
router.get('/profile', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const [user] = await db.query(
      `SELECT u.name, u.phone, a.street, a.city, a.state, a.postal_code 
       FROM users u 
       LEFT JOIN addresses a ON u.id = a.user_id 
       WHERE u.id = ?`,
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user[0]); // Return the first object found
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// ============================
// LOGIN
// ============================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Compare plain password
    if (password !== user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const expiresIn = process.env.JWT_ACCESS_TOKEN_TTL ? parseInt(process.env.JWT_ACCESS_TOKEN_TTL) : undefined;
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      expiresIn ? { expiresIn } : undefined
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;