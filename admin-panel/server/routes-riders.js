const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('./db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set!');
}

// ===== VALIDATION MIDDLEWARE =====
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ===== RIDER LOGIN =====
router.post('/riders/login', [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
  validate
], async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find rider by email
    const [rows] = await pool.query('SELECT * FROM riders WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const rider = rows[0];
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, rider.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: rider.id, email: rider.email, role: 'rider' }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({
      id: rider.id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      vehicle_type: rider.vehicle_type,
      status: rider.status,
      rating: rider.rating,
      total_deliveries: rider.total_deliveries,
      token: token
    });
  } catch (error) {
    next(error);
  }
});

// ===== GET AVAILABLE DELIVERIES (For Riders) =====
router.get('/riders/:riderId/deliveries', [
  param('riderId').isInt({ min: 1 }).withMessage('Rider ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const riderId = req.params.riderId;
    
    // Get orders assigned to this rider
    const [rows] = await pool.query(`
      SELECT o.*, 
             u.name as customer_name, 
             u.phone_number as customer_phone,
             r.name as restaurant_name,
             r.address as restaurant_address,
             r.phone as restaurant_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.rider_id = ?
      AND o.status IN ('confirmed', 'preparing', 'ready', 'out_for_delivery')
      ORDER BY o.created_at DESC
    `, [riderId]);
    
    // Parse food_items JSON
    const orders = rows.map(order => ({
      ...order,
      food_items: typeof order.food_items === 'string' ? JSON.parse(order.food_items) : order.food_items
    }));
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// ===== GET RIDER'S COMPLETED DELIVERIES =====
router.get('/riders/:riderId/history', [
  param('riderId').isInt({ min: 1 }).withMessage('Rider ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const riderId = req.params.riderId;
    
    const [rows] = await pool.query(`
      SELECT o.*, 
             u.name as customer_name,
             r.name as restaurant_name,
             o.delivery_fee
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.rider_id = ?
      AND o.status = 'delivered'
      ORDER BY o.updated_at DESC
    `, [riderId]);
    
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ===== UPDATE RIDER STATUS =====
router.put('/riders/:riderId/status', [
  param('riderId').isInt({ min: 1 }).withMessage('Rider ID must be a positive integer'),
  body('status').isIn(['available', 'busy', 'offline']).withMessage('Invalid status'),
  validate
], async (req, res, next) => {
  try {
    const { status } = req.body;
    const riderId = req.params.riderId;
    
    await pool.query('UPDATE riders SET status = ? WHERE id = ?', [status, riderId]);
    
    res.json({ id: riderId, status });
  } catch (error) {
    next(error);
  }
});

// ===== ACCEPT DELIVERY (Rider accepts an order) =====
router.put('/riders/:riderId/accept/:orderId', [
  param('riderId').isInt({ min: 1 }).withMessage('Rider ID must be a positive integer'),
  param('orderId').notEmpty().withMessage('Order ID is required'),
  validate
], async (req, res, next) => {
  try {
    const { riderId, orderId } = req.params;
    
    // Update order with rider and status
    await pool.query(
      'UPDATE orders SET rider_id = ?, status = ? WHERE id = ?',
      [riderId, 'out_for_delivery', orderId]
    );
    
    // Update rider status to busy
    await pool.query('UPDATE riders SET status = ? WHERE id = ?', ['busy', riderId]);
    
    res.json({ message: 'Delivery accepted', orderId, riderId });
  } catch (error) {
    next(error);
  }
});

// ===== MARK ORDER PICKED UP =====
router.put('/orders/:orderId/picked-up', [
  param('orderId').notEmpty().withMessage('Order ID is required'),
  validate
], async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['out_for_delivery', orderId]);
    
    res.json({ message: 'Order picked up', orderId, status: 'out_for_delivery' });
  } catch (error) {
    next(error);
  }
});

// ===== MARK ORDER DELIVERED =====
router.put('/orders/:orderId/delivered', [
  param('orderId').notEmpty().withMessage('Order ID is required'),
  validate
], async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    
    // Get the order to find the rider
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orders[0];
    
    // Update order status
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['delivered', orderId]);
    
    // If there's a rider, update their status and delivery count
    if (order.rider_id) {
      await pool.query('UPDATE riders SET status = ?, total_deliveries = total_deliveries + 1 WHERE id = ?', ['available', order.rider_id]);
    }
    
    res.json({ message: 'Order delivered', orderId, status: 'delivered' });
  } catch (error) {
    next(error);
  }
});

// ===== GET RIDER STATS =====
router.get('/riders/:riderId/stats', [
  param('riderId').isInt({ min: 1 }).withMessage('Rider ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const riderId = req.params.riderId;
    
    // Get rider info
    const [riders] = await pool.query('SELECT * FROM riders WHERE id = ?', [riderId]);
    
    if (riders.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    
    // Get delivery stats
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_deliveries,
        COALESCE(SUM(delivery_fee), 0) as total_earnings,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_deliveries,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN delivery_fee ELSE 0 END), 0) as today_earnings
      FROM orders 
      WHERE rider_id = ? AND status = 'delivered'
    `, [riderId]);
    
    res.json({
      rider: riders[0],
      stats: stats[0]
    });
  } catch (error) {
    next(error);
  }
});

// ===== GET ORDERS READY FOR PICKUP (For rider to browse) =====
router.get('/deliveries/available', async (req, res, next) => {
  try {
    // Get orders that are ready for pickup but don't have a rider yet
    // Or orders assigned to this rider
    const [rows] = await pool.query(`
      SELECT o.*, 
             u.name as customer_name, 
             u.phone_number as customer_phone,
             r.name as restaurant_name,
             r.address as restaurant_address,
             r.phone as restaurant_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.status IN ('ready', 'confirmed', 'preparing')
      AND (o.rider_id IS NULL OR o.rider_id = 0)
      ORDER BY o.created_at ASC
    `);
    
    const orders = rows.map(order => ({
      ...order,
      food_items: typeof order.food_items === 'string' ? JSON.parse(order.food_items) : order.food_items
    }));
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// ===== ASSIGN RIDER TO ORDER (From Admin or Auto-assign) =====
router.put('/orders/:orderId/assign-rider', [
  param('orderId').notEmpty().withMessage('Order ID is required'),
  body('rider_id').isInt({ min: 1 }).withMessage('Rider ID is required'),
  validate
], async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { rider_id } = req.body;
    
    // Check if rider exists and is available
    const [riders] = await pool.query('SELECT * FROM riders WHERE id = ?', [rider_id]);
    
    if (riders.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    
    // Update order with rider
    await pool.query('UPDATE orders SET rider_id = ? WHERE id = ?', [rider_id, orderId]);
    
    // Notify rider (in real app, use push notifications)
    
    res.json({ message: 'Rider assigned', orderId, rider_id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
