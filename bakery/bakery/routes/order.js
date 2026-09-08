const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, admin } = require('../middleware/auth');

// =====================================================
// CREATE ORDER (POSTGRESQL TRANSACTION + PAYMENT RECORD)
// =====================================================
router.post('/', protect, async (req, res) => {
    const client = await db.pool.connect();

    try {
        const userId = req.user.id;
        const { items, notes, delivery_date, delivery_time } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'No items in order'
            });
        }

        await client.query('BEGIN');

        const userRole = req.user.role;

        // Get customer's address
        const addressResult = await client.query(
            `SELECT id
             FROM addresses
             WHERE user_id = $1
             LIMIT 1`,
            [userId]
        );

        let addressId = null;

        if (addressResult.rows.length > 0) {
            addressId = addressResult.rows[0].id;
        }

        // Customers must have an address.
        // Staff/admin can place orders without one.
        if (!addressId && userRole === 'customer') {
            await client.query('ROLLBACK');

            return res.status(400).json({
                message: 'Please update your profile with an address before ordering.'
            });
        }

        // Create order
        const orderResult = await client.query(
            `INSERT INTO orders
             (user_id, address_id, notes, delivery_date, delivery_time)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [
                userId,
                addressId,
                notes || null,
                delivery_date || null,
                delivery_time || null
            ]
        );

        const orderId = orderResult.rows[0].id;

        // Get product IDs
        const productIds = items.map(item => Number(item.product_id));

        // Fetch products
        const productResult = await client.query(
            `SELECT id, price, is_available
             FROM products
             WHERE id = ANY($1::integer[])`,
            [productIds]
        );

        const products = productResult.rows;

        let totalPrice = 0;

        // Add order items
        for (const item of items) {
            const productId = Number(item.product_id);
            const quantity = Number(item.quantity) || 1;

            const product = products.find(
                p => Number(p.id) === productId
            );

            if (!product) {
                throw new Error(`Product not found: ${productId}`);
            }

            if (product.is_available === false) {
                throw new Error(`Product unavailable: ${productId}`);
            }

            const price = Number(product.price);

            totalPrice += price * quantity;

            await client.query(
                `INSERT INTO order_items
                 (order_id, product_id, quantity, price)
                 VALUES ($1, $2, $3, $4)`,
                [
                    orderId,
                    productId,
                    quantity,
                    price
                ]
            );
        }

        // Update order total
        await client.query(
            `UPDATE orders
             SET total_price = $1
             WHERE id = $2`,
            [totalPrice, orderId]
        );

        // Create payment record
        await client.query(
            `INSERT INTO payments
             (user_id, order_id, amount, payment_method, payment_status)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                userId,
                orderId,
                totalPrice,
                'transfer',
                'pending'
            ]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Order placed',
            orderId,
            totalPrice
        });

    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        }

        console.error('Order creation error:', error);

        res.status(500).json({
            message: error.message
        });

    } finally {
        client.release();
    }
});

// =====================================================
// GET MY ORDERS (CUSTOMER)
// =====================================================
router.get('/my', protect, async (req, res) => {
    try {
        const userId = req.user.id;

        const [orders] = await db.query(
            `SELECT o.*, 
             (SELECT p.name FROM order_items oi 
              JOIN products p ON oi.product_id = p.id 
              WHERE oi.order_id = o.id LIMIT 1) as product_name,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
             FROM orders o 
             WHERE o.user_id = ? 
             ORDER BY o.created_at DESC`,
            [userId]
        );

        res.json(orders || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// =====================================================
// GET ORDER DETAILS (SECURED)
// =====================================================
router.get('/:id', protect, async (req, res) => {
try {
const orderId = req.params.id;
const userId = req.user.id;

const [orderRows] = await db.query(
  'SELECT * FROM orders WHERE id = ?',
  [orderId]
);

if (orderRows.length === 0) {
  return res.status(404).json({ message: 'Order not found' });
}

const order = orderRows[0];

// SECURITY: only owner or admin
if (order.user_id !== userId && req.user.role !== 'admin') {
  return res.status(403).json({ message: 'Not authorized' });
}

const [items] = await db.query(
  `SELECT oi.*, p.name, p.image_url
   FROM order_items oi
   JOIN products p ON oi.product_id = p.id
   WHERE oi.order_id = ?`,
  [orderId]
);

const [payment] = await db.query(
  `SELECT payment_status, payment_method, amount
   FROM payments
   WHERE order_id = ?`,
  [orderId]
);

res.json({
  order,
  items,
  payment: payment[0] || null
});

} catch (error) {
res.status(500).json({ message: error.message });
}
});

// =====================================================
// GET ALL ORDERS (ADMIN)
// =====================================================
router.get('/', protect, admin, async (req, res) => {
try {
const [orders] = await db.query(
"SELECT o.*, u.name, u.email, u.phone FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC"
);

res.json(orders);

} catch (error) {
res.status(500).json({ message: error.message });
}
});

// =====================================================
// UPDATE ORDER STATUS (ADMIN)
// =====================================================
router.put('/:id/status', protect, admin, async (req, res) => {
try {
const { status } = req.body;

const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];

if (!allowed.includes(status)) {
  return res.status(400).json({ message: 'Invalid status' });
}

await db.query(
  'UPDATE orders SET status = ? WHERE id = ?',
  [status, req.params.id]
);

res.json({ message: 'Order status updated' });

} catch (error) {
res.status(500).json({ message: error.message });
}
});

// =====================================================
// VERIFY PAYMENT (HOOK FOR PAYSTACK / MANUAL)
// =====================================================
router.put('/:id/pay', protect, async (req, res) => {
try {
const orderId = req.params.id;

// Update payment
await db.query(
  `UPDATE payments 
   SET payment_status = 'successful', paid_at = NOW()
   WHERE order_id = ?`,
  [orderId]
);

// Update order
await db.query(
  `UPDATE orders 
   SET payment_status = 'paid'
   WHERE id = ?`,
  [orderId]
);

res.json({ message: 'Payment confirmed' });

} catch (error) {
res.status(500).json({ message: error.message });
}
});

// =====================================================
// GET FULL ORDER DETAILS FOR DELIVERY (ADMIN ONLY)
// =====================================================
router.get('/admin/delivery-manifest/:id', protect, admin, async (req, res) => {
    try {
        const [orderRows] = await db.query(
            `SELECT o.id AS order_id, o.total_price, o.created_at,
                u.name AS customer_name, u.phone AS customer_phone,
                a.street, a.city, a.state
             FROM orders o
             JOIN users u ON o.user_id = u.id
             LEFT JOIN addresses a ON o.address_id = a.id
             WHERE o.id = ?`, [req.params.id]
        );

        if (orderRows.length === 0) return res.status(404).json({ message: 'Order not found' });

        const [items] = await db.query(
            `SELECT oi.quantity, oi.price AS price_at_purchase, p.name AS product_name
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`, [req.params.id]
        );

        res.json({ delivery_details: orderRows[0], items });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// =====================================================
// DELETE ORDER (ADMIN)
// =====================================================
router.delete('/:id', protect, admin, async (req, res) => {
try {
await db.query(
'DELETE FROM orders WHERE id = ?',
[req.params.id]
);

res.json({ message: 'Order deleted successfully' });

} catch (error) {
res.status(500).json({ message: error.message });
}
});

module.exports = router;
