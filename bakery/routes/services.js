const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, admin } = require('../middleware/auth');


// ======================================================
// GET ALL SERVICES (PUBLIC - FOR USERS)
// ======================================================
router.get('/', async (req, res) => {
  try {
    const [services] = await db.query(
      'SELECT * FROM services WHERE is_active = TRUE ORDER BY created_at DESC'
    );

    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ======================================================
// GET SINGLE SERVICE
// ======================================================
router.get('/:id', async (req, res) => {
  try {
    const [service] = await db.query(
      'SELECT * FROM services WHERE id = ?',
      [req.params.id]
    );

    if (service.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ======================================================
// CREATE SERVICE (ADMIN)
// ======================================================
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, price } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Service name is required' });
    }

    const [result] = await db.query(
      `INSERT INTO services (name, description, price) 
       VALUES (?, ?, ?)`,
      [name, description, price || 0]
    );

    res.status(201).json({
      message: 'Service created successfully',
      serviceId: result.insertId
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ======================================================
// UPDATE SERVICE (ADMIN)
// ======================================================
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, description, price, is_active } = req.body;

    const fields = [];
    const values = [];

    if (name) {
      fields.push('name = ?');
      values.push(name);
    }

    if (description) {
      fields.push('description = ?');
      values.push(description);
    }

    if (price !== undefined) {
      fields.push('price = ?');
      values.push(price);
    }

    if (is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(is_active);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(req.params.id);

    await db.query(
      `UPDATE services SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Service updated successfully' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ======================================================
// DELETE SERVICE (ADMIN - SOFT DELETE)
// ======================================================
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await db.query(
      'UPDATE services SET is_active = FALSE WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'Service disabled successfully' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ======================================================
// HARD DELETE (OPTIONAL - ADMIN ONLY)
// ======================================================
router.delete('/:id/permanent', protect, admin, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM services WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'Service permanently deleted' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;