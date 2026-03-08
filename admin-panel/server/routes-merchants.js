const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('./db');
const router = express.Router();

// ===== VALIDATION MIDDLEWARE =====
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ===== MERCHANT LOGIN =====
router.post('/merchants/login', [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('restaurant_id').optional().isInt().withMessage('Restaurant ID must be a number'),
  validate
], async (req, res, next) => {
  try {
    const { email, restaurant_id } = req.body;
    
    // Get restaurant by email or ID
    let query = 'SELECT * FROM restaurants WHERE id = ?';
    let params = [restaurant_id || 1];
    
    if (email) {
      // If email provided, try to find by email in users or use default
      query = 'SELECT * FROM restaurants WHERE id = ?';
      params = [restaurant_id || 1];
    }
    
    const [rows] = await pool.query(query, params);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Restaurant not found' });
    }
    
    const restaurant = rows[0];
    res.json({
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      cuisine_type: restaurant.cuisine_type,
      address: restaurant.address,
      is_open: restaurant.is_open,
      rating: restaurant.rating
    });
  } catch (error) {
    next(error);
  }
});

// ===== GET RESTAURANT ORDERS =====
router.get('/merchants/:restaurantId/orders', [
  param('restaurantId').isInt({ min: 1 }).withMessage('Restaurant ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId;
    
    const [rows] = await pool.query(`
      SELECT o.*, u.name as user_name, u.email as user_email, u.phone_number as user_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.restaurant_id = ?
      ORDER BY o.created_at DESC
    `, [restaurantId]);
    
    const orders = rows.map(order => ({
      ...order,
      food_items: typeof order.food_items === 'string' ? JSON.parse(order.food_items) : order.food_items
    }));
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// ===== GET RESTAURANT MENU =====
router.get('/merchants/:restaurantId/menu', [
  param('restaurantId').isInt({ min: 1 }).withMessage('Restaurant ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId;
    
    const [rows] = await pool.query(
      'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name',
      [restaurantId]
    );
    
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ===== UPDATE RESTAURANT STATUS =====
router.put('/merchants/:restaurantId/status', [
  param('restaurantId').isInt({ min: 1 }).withMessage('Restaurant ID must be a positive integer'),
  body('is_open').isBoolean().withMessage('is_open must be a boolean'),
  validate
], async (req, res, next) => {
  try {
    const { is_open } = req.body;
    const restaurantId = req.params.restaurantId;
    
    await pool.query('UPDATE restaurants SET is_open = ? WHERE id = ?', [is_open, restaurantId]);
    
    res.json({ id: restaurantId, is_open });
  } catch (error) {
    next(error);
  }
});

// ===== GET RESTAURANT STATS =====
router.get('/merchants/:restaurantId/stats', [
  param('restaurantId').isInt({ min: 1 }).withMessage('Restaurant ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId;
    
    // Get total orders
    const [totalOrders] = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ?',
      [restaurantId]
    );
    
    // Get pending orders
    const [pendingOrders] = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ? AND status = 'pending'",
      [restaurantId]
    );
    
    // Get today's orders
    const [todayOrders] = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ? AND DATE(created_at) = CURDATE()",
      [restaurantId]
    );
    
    // Get total revenue
    const [revenue] = await pool.query(
      "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE restaurant_id = ? AND status = 'delivered'",
      [restaurantId]
    );
    
    // Get today's revenue
    const [todayRevenue] = await pool.query(
      "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE restaurant_id = ? AND DATE(created_at) = CURDATE() AND status = 'delivered'",
      [restaurantId]
    );
    
    res.json({
      totalOrders: totalOrders[0].count,
      pendingOrders: pendingOrders[0].count,
      todayOrders: todayOrders[0].count,
      totalRevenue: parseFloat(revenue[0].total),
      todayRevenue: parseFloat(todayRevenue[0].total)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
