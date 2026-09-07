const express = require('express');
const router = express.Router();
const db = require('../db');
const upload = require('../middleware/upload');
const { protect, admin } = require('../middleware/auth');

// ============================
// GET ALL PRODUCTS (PUBLIC + PAGINATION + SEARCH)
// ============================
router.get('/', async (req, res) => {
try {
const { page = 1, limit = 10, search = '', category } = req.query;

const offset = (page - 1) * limit;

let query = `SELECT * FROM products WHERE is_available = TRUE`;
let countQuery = `SELECT COUNT(*) as total FROM products WHERE is_available = TRUE`;
const values = [];

if (search) {
  query += ` AND name LIKE ?`;
  countQuery += ` AND name LIKE ?`;
  values.push(`%${search}%`);
}

if (category) {
  query += ` AND category = ?`;
  countQuery += ` AND category = ?`;
  values.push(category);
}

query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
values.push(parseInt(limit), parseInt(offset));

const [products] = await db.query(query, values);
const [countResult] = await db.query(countQuery, values.slice(0, values.length - 2));

res.json({
  data: products,
  pagination: {
    page: Number(page),
    limit: Number(limit),
    total: countResult[0].total
  }
});

} catch (error) {
res.status(500).json({ message: error.message });
}
});

// ============================
// GET SINGLE PRODUCT
// ============================
router.get('/:id', async (req, res) => {
try {
const [product] = await db.query(
'SELECT * FROM products WHERE id = ?',
[req.params.id]
);

if (product.length === 0) {
  return res.status(404).json({ message: 'Product not found' });
}

res.json(product[0]);

} catch (error) {
res.status(500).json({ message: error.message });
}
});

// ============================
// CREATE PRODUCT (ADMIN)
// ============================
router.post(
'/',
protect,
admin,
upload.single('image'),
async (req, res) => {
try {
const { name, description, price, category } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  if (isNaN(price)) {
    return res.status(400).json({ message: 'Invalid price' });
  }

  const image_url = req.file ? req.file.path : null;

  const [result] = await db.query(
    `INSERT INTO products 
    (name, description, price, image_url, category) 
    VALUES (?, ?, ?, ?, ?)`,
    [name, description, price, image_url, category]
  );

  res.status(201).json({
    message: 'Product created successfully',
    productId: result.insertId
  });

} catch (error) {
  res.status(500).json({ message: error.message });
}

}
);

// ============================
// UPDATE PRODUCT (ADMIN)
// ============================
router.put(
'/:id',
protect,
admin,
upload.single('image'),
async (req, res) => {
try {
const { name, description, price, category, is_available } = req.body;

  const [existing] = await db.query(
    'SELECT * FROM products WHERE id = ?',
    [req.params.id]
  );

  if (existing.length === 0) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const image_url = req.file ? req.file.path : null;

  const updateFields = [];
  const values = [];

  if (name) {
    updateFields.push('name = ?');
    values.push(name);
  }

  if (description) {
    updateFields.push('description = ?');
    values.push(description);
  }

  if (price !== undefined) {
    if (isNaN(price)) {
      return res.status(400).json({ message: 'Invalid price' });
    }
    updateFields.push('price = ?');
    values.push(price);
  }

  if (category) {
    updateFields.push('category = ?');
    values.push(category);
  }

  if (is_available !== undefined) {
    updateFields.push('is_available = ?');
    values.push(is_available);
  }

  if (image_url) {
    updateFields.push('image_url = ?');
    values.push(image_url);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  values.push(req.params.id);

  await db.query(
    `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
    values
  );

  res.json({ message: 'Product updated successfully' });

} catch (error) {
  res.status(500).json({ message: error.message });
}

}
);

// ============================
// SOFT DELETE PRODUCT (ADMIN)
// ============================
router.delete(
'/:id',
protect,
admin,
async (req, res) => {
try {
const [existing] = await db.query(
'SELECT * FROM products WHERE id = ?',
[req.params.id]
);

  if (existing.length === 0) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Soft delete instead of permanent delete
  await db.query(
    'UPDATE products SET is_available = FALSE WHERE id = ?',
    [req.params.id]
  );

  res.json({ message: 'Product disabled successfully' });

} catch (error) {
  res.status(500).json({ message: error.message });
}

}
);

module.exports = router;