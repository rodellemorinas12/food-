const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const db = new Database('teresa_eats.db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Get orders for a restaurant
router.get('/', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.* FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE r.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.userId);

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.* FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = ? AND r.user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const orderItems = db.prepare(`
      SELECT oi.*, mi.name, mi.description
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `).all(req.params.id);

    res.json({ ...order, items: orderItems });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
router.put('/:id/status', authenticateToken, (req, res) => {
  try {
    const { status, estimated_prep_time, reject_reason } = req.body;

    // Check ownership
    const order = db.prepare(`
      SELECT o.* FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = ? AND r.user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.prepare(`
      UPDATE orders 
      SET status = ?, estimated_prep_time = ?, reject_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      status,
      estimated_prep_time || null,
      reject_reason || null,
      req.params.id
    );

    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Create new order (for customers)
router.post('/', (req, res) => {
  try {
    const { restaurant_id, customer_name, customer_phone, customer_address, items } = req.body;

    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      const menuItem = db.prepare('SELECT price FROM menu_items WHERE id = ?').get(item.menu_item_id);
      if (menuItem) {
        totalAmount += menuItem.price * item.quantity;
      }
    }

    // Insert order
    const result = db.prepare(`
      INSERT INTO orders (restaurant_id, customer_name, customer_phone, customer_address, total_amount, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(restaurant_id, customer_name, customer_phone, customer_address, totalAmount);

    const orderId = result.lastInsertRowid;

    // Insert order items
    for (const item of items) {
      const menuItem = db.prepare('SELECT price FROM menu_items WHERE id = ?').get(item.menu_item_id);
      if (menuItem) {
        db.prepare(`
          INSERT INTO order_items (order_id, menu_item_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `).run(orderId, item.menu_item_id, item.quantity, menuItem.price);
      }
    }

    res.status(201).json({
      message: 'Order placed successfully',
      orderId
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;
