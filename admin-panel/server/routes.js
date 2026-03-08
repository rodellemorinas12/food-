const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const pool = require('./db');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const sendEmail = require('./utils/mailer');

// ===== VALIDATION MIDDLEWARE =====
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ===== ADMIN MIDDLEWARE =====
// This middleware checks if the request has admin privileges
// In production, you would verify JWT token and role
const requireAdmin = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'] || req.query.admin_token;
  
  if (!adminToken) {
    return res.status(401).json({ error: 'Admin token required' });
  }
  
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Invalid admin token' });
  }
  
  next();
};

// ===== COMMON VALIDATORS =====
const idValidator = param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer');

// ===== DASHBOARD STATS ENDPOINTS =====
router.get('/dashboard-stats', async (req, res, next) => {
  try {
    // Get counts from the food_delivery database
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [restaurantCount] = await pool.query('SELECT COUNT(*) as count FROM restaurants');
    const [orderCount] = await pool.query('SELECT COUNT(*) as count FROM orders');
    const [totalRevenue] = await pool.query('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status = "delivered"');
    
    const [todayOrders] = await pool.query("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()");
    const [pendingOrders] = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    
    res.json({
      totalUsers: userCount[0].count,
      totalRestaurants: restaurantCount[0].count,
      totalOrders: orderCount[0].count,
      totalRevenue: parseFloat(totalRevenue[0].total),
      todayOrders: todayOrders[0].count,
      pendingOrders: pendingOrders[0].count
    });
  } catch (error) {
    next(error);
  }
});

// ===== USERS ENDPOINTS =====
router.get('/users', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone_number as phone, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id', [idValidator, validate], async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone_number as phone, created_at FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ===== RESTAURANTS ENDPOINTS =====
router.get('/restaurants', async (req, res, next) => {
  try {
    const { status } = req.query;
    
    let query = 'SELECT * FROM restaurants';
    let params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/restaurants/:id', [idValidator, validate], async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/restaurants', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('cuisine_type').trim().notEmpty().withMessage('Cuisine type is required'),
  validate
], async (req, res, next) => {
  try {
    const { name, description, image_url, banner_url, cuisine_type, rating, delivery_time, delivery_fee, address, is_open, status, phone, email, city } = req.body;
    const [result] = await pool.query(
      `INSERT INTO restaurants (name, description, image_url, banner_url, cuisine_type, rating, delivery_time, delivery_fee, address, is_open, status, phone, email, city) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description || null, image_url || null, banner_url || null, cuisine_type, rating || 0, delivery_time || '30-45 min', delivery_fee || 0, address || null, is_open !== false, status || 'pending', phone || null, email || null, city || null]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    next(error);
  }
});

router.put('/restaurants/:id', [
  idValidator,
  validate
], async (req, res, next) => {
  try {
    const { name, description, image_url, banner_url, cuisine_type, rating, delivery_time, delivery_fee, address, is_open, status, phone, email, city } = req.body;
    
    // Build dynamic query based on provided fields
    const updates = [];
    const values = [];
    
    if (name !== undefined) { updates.push('name=?'); values.push(name); }
    if (description !== undefined) { updates.push('description=?'); values.push(description); }
    if (image_url !== undefined) { updates.push('image_url=?'); values.push(image_url); }
    if (banner_url !== undefined) { updates.push('banner_url=?'); values.push(banner_url); }
    if (cuisine_type !== undefined) { updates.push('cuisine_type=?'); values.push(cuisine_type); }
    if (rating !== undefined) { updates.push('rating=?'); values.push(rating); }
    if (delivery_time !== undefined) { updates.push('delivery_time=?'); values.push(delivery_time); }
    if (delivery_fee !== undefined) { updates.push('delivery_fee=?'); values.push(delivery_fee); }
    if (address !== undefined) { updates.push('address=?'); values.push(address); }
    if (is_open !== undefined) { updates.push('is_open=?'); values.push(is_open); }
    if (status !== undefined) { updates.push('status=?'); values.push(status); }
    if (phone !== undefined) { updates.push('phone=?'); values.push(phone); }
    if (email !== undefined) { updates.push('email=?'); values.push(email); }
    if (city !== undefined) { updates.push('city=?'); values.push(city); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    
    await pool.query(
      `UPDATE restaurants SET ${updates.join(', ')} WHERE id=?`,
      values
    );
    
    // Get updated restaurant
    const [rows] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/restaurants/:id', [idValidator, validate], async (req, res, next) => {
  try {
    await pool.query('DELETE FROM restaurants WHERE id = ?', [req.params.id]);
    res.json({ message: 'Restaurant deleted' });
  } catch (error) {
    next(error);
  }
});

// ===== MERCHANT STATUS MANAGEMENT ENDPOINTS =====

// GET restaurant status with countdown timer
router.get('/restaurants/:id/status', [idValidator, validate], async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, status, decline_reason, declined_at FROM restaurants WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    const restaurant = rows[0];
    
    // Calculate countdown for declined merchants
    let canReapply = true;
    let remainingMs = 0;
    
    if (restaurant.status === 'declined' && restaurant.declined_at) {
      const declinedTime = new Date(restaurant.declined_at).getTime();
      const cooldownEnd = declinedTime + (3 * 24 * 60 * 60 * 1000); // 3 days
      remainingMs = cooldownEnd - Date.now();
      canReapply = remainingMs <= 0;
      remainingMs = remainingMs > 0 ? remainingMs : 0;
    }
    
    res.json({
      id: restaurant.id,
      name: restaurant.name,
      email: restaurant.email,
      status: restaurant.status,
      decline_reason: restaurant.decline_reason,
      declined_at: restaurant.declined_at,
      can_reapply: canReapply,
      remaining_ms: remainingMs
    });
  } catch (error) {
    next(error);
  }
});

// PATCH approve restaurant (admin only)
router.patch('/restaurants/:id/approve', requireAdmin, [idValidator, validate], async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, status FROM restaurants WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    const restaurant = rows[0];
    
    // Update status to active
    await pool.query(
      `UPDATE restaurants SET status = 'active', is_open = true WHERE id = ?`,
      [req.params.id]
    );
    
    // Send approval email
    if (restaurant.email) {
      await sendEmail(
        restaurant.email,
        'Your Merchant Application Has Been Approved! 🎉',
        `
          <h2>Congratulations! Your Application Has Been Approved</h2>
          <p>Dear ${restaurant.name},</p>
          <p>We are pleased to inform you that your merchant application has been approved!</p>
          <p>You can now start managing your restaurant and receiving orders.</p>
          <p>Log in to your dashboard to get started.</p>
          <br/>
          <p>Best regards,<br/>TeresaEats Team</p>
        `
      );
    }
    
    res.json({ message: 'Restaurant approved successfully', status: 'active' });
  } catch (error) {
    next(error);
  }
});

// PATCH decline restaurant (admin only)
router.patch('/restaurants/:id/decline', requireAdmin, [idValidator, validate], async (req, res, next) => {
  try {
    const { decline_reason } = req.body;
    
    if (!decline_reason) {
      return res.status(400).json({ error: 'Decline reason is required' });
    }
    
    const [rows] = await pool.query(
      'SELECT id, name, email, status FROM restaurants WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    const restaurant = rows[0];
    
    // Update status to declined
    await pool.query(
      `UPDATE restaurants 
       SET status = 'declined', 
           decline_reason = ?, 
           declined_at = NOW() 
       WHERE id = ?`,
      [decline_reason, req.params.id]
    );
    
    // Send decline email
    if (restaurant.email) {
      await sendEmail(
        restaurant.email,
        'Your Merchant Application Was Declined',
        `
          <h2>Application Declined</h2>
          <p>Dear ${restaurant.name},</p>
          <p>We regret to inform you that your merchant application has been declined.</p>
          <p><strong>Reason:</strong> ${decline_reason}</p>
          <p>You may reapply after 3 days. A reapply button will be available in your dashboard after the cooldown period.</p>
          <br/>
          <p>Best regards,<br/>TeresaEats Team</p>
        `
      );
    }
    
    res.json({ message: 'Restaurant declined + Email sent', status: 'declined', decline_reason });
  } catch (error) {
    next(error);
  }
});

// PATCH reapply (reset status to pending - for merchants to reapply after cooldown)
router.patch('/restaurants/:id/reapply', [idValidator, validate], async (req, res, next) => {
  try {
    // First check the current status and cooldown
    const [rows] = await pool.query(
      'SELECT id, name, email, status, declined_at FROM restaurants WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    const restaurant = rows[0];
    
    // Only allow reapply if currently declined and cooldown has passed
    if (restaurant.status !== 'declined') {
      return res.status(400).json({ error: 'Can only reapply when declined' });
    }
    
    // Check cooldown (3 days)
    if (restaurant.declined_at) {
      const declinedTime = new Date(restaurant.declined_at).getTime();
      const cooldownEnd = declinedTime + (3 * 24 * 60 * 60 * 1000);
      const remainingMs = cooldownEnd - Date.now();
      
      if (remainingMs > 0) {
        return res.status(400).json({ 
          error: 'Cooldown period not yet over',
          remaining_ms: remainingMs
        });
      }
    }
    
    // Reset status to pending
    await pool.query(
      `UPDATE restaurants 
       SET status = 'pending', 
           declined_at = NULL, 
           decline_reason = NULL 
       WHERE id = ?`,
      [req.params.id]
    );
    
    res.json({ message: 'Reapplied successfully', status: 'pending' });
  } catch (error) {
    next(error);
  }
});

// ===== MENU ITEMS ENDPOINTS =====
router.get('/menu-items', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*, r.name as restaurant_name 
      FROM menu_items m 
      LEFT JOIN restaurants r ON m.restaurant_id = r.id 
      ORDER BY m.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/menu-items/restaurant/:restaurantId', [
  param('restaurantId').isInt({ min: 1 }).withMessage('Restaurant ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name', [req.params.restaurantId]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/menu-items/:id', [idValidator, validate], async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/menu-items', [
  body('restaurant_id').isInt({ min: 1 }).withMessage('Restaurant ID is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  validate
], async (req, res, next) => {
  try {
    const { restaurant_id, name, description, price, image_url, category, is_available, preparation_time } = req.body;
    const [result] = await pool.query(
      `INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category, is_available, preparation_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurant_id, name, description || null, price, image_url || null, category || 'General', is_available !== false, preparation_time || 20]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    next(error);
  }
});

router.put('/menu-items/:id', [
  idValidator,
  validate
], async (req, res, next) => {
  try {
    const { restaurant_id, name, description, price, image_url, category, is_available, preparation_time } = req.body;
    await pool.query(
      `UPDATE menu_items SET restaurant_id=?, name=?, description=?, price=?, image_url=?, category=?, is_available=?, preparation_time=? WHERE id=?`,
      [restaurant_id, name, description || null, price, image_url || null, category || 'General', is_available !== false, preparation_time || 20, req.params.id]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    next(error);
  }
});

router.delete('/menu-items/:id', [idValidator, validate], async (req, res, next) => {
  try {
    await pool.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  }
});

// ===== ORDERS ENDPOINTS =====
router.get('/orders', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, u.name as user_name, u.email as user_email, u.phone_number as user_phone,
             r.name as restaurant_name,
             rdr.name as rider_name, rdr.phone as rider_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN riders rdr ON o.rider_id = rdr.id
      ORDER BY o.created_at DESC
    `);
    
    // Parse food_items JSON if it's a string
    const orders = rows.map(order => ({
      ...order,
      food_items: typeof order.food_items === 'string' ? JSON.parse(order.food_items) : order.food_items
    }));
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.get('/orders/:id', [idValidator, validate], async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, u.name as user_name, u.email as user_email, u.phone_number as user_phone,
             r.name as restaurant_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = {
      ...rows[0],
      food_items: typeof rows[0].food_items === 'string' ? JSON.parse(rows[0].food_items) : rows[0].food_items
    };
    
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.get('/orders/user/:userId', [
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, r.name as restaurant_name
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [req.params.userId]);
    
    const orders = rows.map(order => ({
      ...order,
      food_items: typeof order.food_items === 'string' ? JSON.parse(order.food_items) : order.food_items
    }));
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.post('/orders', [
  body('user_id').optional().isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  body('restaurant_id').isInt({ min: 1 }).withMessage('Restaurant ID is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be a positive number'),
  body('delivery_fee').optional().isFloat({ min: 0 }).withMessage('Delivery fee must be a positive number'),
  body('tax').optional().isFloat({ min: 0 }).withMessage('Tax must be a positive number'),
  body('total').isFloat({ min: 0 }).withMessage('Total must be a positive number'),
  body('food_items').isArray({ min: 1 }).withMessage('At least one food item is required'),
  body('delivery_address').trim().notEmpty().withMessage('Delivery address is required'),
  validate
], async (req, res, next) => {
  try {
    const { user_id, restaurant_id, subtotal, delivery_fee, tax, total, food_items, delivery_address, notes, payment_method } = req.body;
    
    // Generate order ID
    const order_id = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const [result] = await pool.query(
      `INSERT INTO orders (id, user_id, restaurant_id, subtotal, delivery_fee, tax, total, food_items, delivery_address, notes, payment_method, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [order_id, user_id || null, restaurant_id, subtotal, delivery_fee || 0, tax || 0, total, JSON.stringify(food_items), delivery_address, notes || null, payment_method || 'cash']
    );
    
    // Insert order items
    for (const item of food_items) {
      await pool.query(
        `INSERT INTO order_items (order_id, food_item_id, quantity, price, special_instructions) VALUES (?, ?, ?, ?, ?)`,
        [order_id, item.id, item.quantity, item.price, item.special_instructions || null]
      );
    }
    
    res.status(201).json({
      id: order_id,
      user_id,
      restaurant_id,
      subtotal,
      delivery_fee,
      tax,
      total,
      food_items,
      delivery_address,
      notes,
      payment_method,
      status: 'pending'
    });
  } catch (error) {
    next(error);
  }
});

router.put('/orders/:id', [
  idValidator,
  validate
], async (req, res, next) => {
  try {
    const { status, delivery_address, notes, payment_method, rider_id } = req.body;
    
    // Get current order
    const [currentOrder] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (currentOrder.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = currentOrder[0];
    
    // Update the order
    await pool.query(
      `UPDATE orders SET status=?, delivery_address=?, notes=?, payment_method=?, rider_id=? WHERE id=?`,
      [status || order.status, delivery_address || order.delivery_address, notes || order.notes, payment_method || order.payment_method, rider_id || order.rider_id, req.params.id]
    );
    
    res.json({ id: req.params.id, status, delivery_address, notes, payment_method, rider_id });
  } catch (error) {
    next(error);
  }
});

// Update order status
router.put('/orders/:id/status', [
  idValidator,
  body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']).withMessage('Invalid status'),
  validate
], async (req, res, next) => {
  try {
    const { status } = req.body;
    
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    
    res.json({ id: req.params.id, status });
  } catch (error) {
    next(error);
  }
});

// ===== ORDER ITEMS ENDPOINTS =====
router.get('/order-items/:orderId', [
  param('orderId').notEmpty().withMessage('Order ID is required'),
  validate
], async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT oi.*, m.name as food_item_name
      FROM order_items oi
      LEFT JOIN menu_items m ON oi.food_item_id = m.id
      WHERE oi.order_id = ?
    `, [req.params.orderId]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ===== RIDERS ENDPOINTS (For admin management) =====
router.get('/riders', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM riders ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ===== TRANSACTIONS ENDPOINTS =====
router.get('/transactions', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 100');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ===== CHART DATA FOR DASHBOARD =====
router.get('/chart-data/orders-by-day', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total) as revenue
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/chart-data/orders-by-status', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/chart-data/top-restaurants', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.name, COUNT(o.id) as order_count, SUM(o.total) as total_revenue
      FROM restaurants r
      LEFT JOIN orders o ON r.id = o.restaurant_id AND o.status = 'delivered'
      GROUP BY r.id
      ORDER BY order_count DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ===== FOOD DELIVERY STATS (for dashboard) =====
router.get('/food-delivery-stats', async (req, res, next) => {
  try {
    // Get counts from the food_delivery database
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [restaurantCount] = await pool.query('SELECT COUNT(*) as count FROM restaurants');
    const [orderCount] = await pool.query('SELECT COUNT(*) as count FROM orders');
    const [totalRevenue] = await pool.query('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status = "delivered"');
    const [todayOrders] = await pool.query("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()");
    const [pendingOrders] = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    
    // Get recent orders
    const [recentOrders] = await pool.query(`
      SELECT o.*, u.name as customer_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    
    // Parse food_items JSON if it's a string
    const parsedOrders = recentOrders.map(order => ({
      ...order,
      food_items: typeof order.food_items === 'string' ? JSON.parse(order.food_items) : order.food_items
    }));
    
    // Get orders by status
    const [ordersByStatus] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);
    
    const statusCount = {};
    ordersByStatus.forEach(item => {
      statusCount[item.status] = item.count;
    });
    
    // Get riders count
    const [riderCount] = await pool.query('SELECT COUNT(*) as count FROM riders WHERE status = "available"');
    
    // Calculate today's revenue
    const [todayRevenue] = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as total 
      FROM orders 
      WHERE DATE(created_at) = CURDATE() AND status = "delivered"
    `);
    
    res.json({
      totalUsers: userCount[0].count,
      totalRestaurants: restaurantCount[0].count,
      totalOrders: orderCount[0].count,
      totalRevenue: parseFloat(totalRevenue[0].total),
      todayOrders: todayOrders[0].count,
      pendingOrders: pendingOrders[0].count,
      recentOrders: parsedOrders,
      ordersByStatus: statusCount,
      activeRiders: riderCount[0].count,
      totalCustomers: userCount[0].count,
      todayRevenue: parseFloat(todayRevenue[0].total),
      restaurants: restaurantCount[0].count
    });
  } catch (error) {
    next(error);
  }
});

// ===== CONTACTS ENDPOINTS =====
router.get('/contacts', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, age, email, phone, address1, address2, city, zip_code, registrarId, created_at FROM contacts ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/contacts/:id', [idValidator, validate], async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, age, email, phone, address1, address2, city, zip_code, registrarId, created_at FROM contacts WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/contacts', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  validate
], async (req, res, next) => {
  try {
    const { name, age, email, phone, address1, address2, city, zip_code, registrarId } = req.body;
    const [result] = await pool.query(
      `INSERT INTO contacts (name, age, email, phone, address1, address2, city, zip_code, registrarId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, age || null, email, phone || null, address1 || null, address2 || null, city || null, zip_code || null, registrarId || null]
    );
    res.status(201).json({ id: result.insertId, name, age, email, phone, address1, address2, city, zip_code, registrarId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    next(error);
  }
});

router.put('/contacts/:id', [
  idValidator,
  body('email').optional().trim().isEmail().withMessage('Valid email is required'),
  validate
], async (req, res, next) => {
  try {
    const { name, age, email, phone, address1, address2, city, zip_code, registrarId } = req.body;
    await pool.query(
      `UPDATE contacts SET name=?, age=?, email=?, phone=?, address1=?, address2=?, city=?, zip_code=?, registrarId=? WHERE id=?`,
      [name || null, age || null, email || null, phone || null, address1 || null, address2 || null, city || null, zip_code || null, registrarId || null, req.params.id]
    );
    res.json({ id: req.params.id, name, age, email, phone, address1, address2, city, zip_code, registrarId });
  } catch (error) {
    next(error);
  }
});

router.delete('/contacts/:id', [idValidator, validate], async (req, res, next) => {
  try {
    await pool.query('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    next(error);
  }
});

// ===== UPLOAD ENDPOINT =====
// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  // Removed fileFilter - now accepts all file types
});

// Upload endpoint
router.post('/upload', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    next(error);
  }
});

// ===== MERCHANT APP DOCUMENT UPLOAD ENDPOINT =====
// This endpoint handles document uploads from the merchant app (teresa-eats-merchant)
router.post('/merchant-documents', upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }
    
    const { merchant_id, document_type, document_name } = req.body;
    
    if (!merchant_id) {
      return res.status(400).json({ error: 'Merchant ID is required' });
    }
    
    if (!document_type) {
      return res.status(400).json({ error: 'Document type is required' });
    }
    
    const documentUrl = `/uploads/${req.file.filename}`;
    
    // Insert into merchant_documents table
    const [result] = await pool.query(
      `INSERT INTO merchant_documents (merchant_id, document_type, document_name, document_url, uploaded_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [merchant_id, document_type, document_name || document_type, documentUrl]
    );
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      merchant_id,
      document_type,
      document_name: document_name || document_type,
      document_url: documentUrl,
      uploaded_at: new Date()
    });
  } catch (error) {
    next(error);
  }
});

// ===== MERCHANT DOCUMENTS ENDPOINTS =====
// Get all documents for a specific merchant
router.get('/merchants/:merchantId/documents', [
  param('merchantId').isInt({ min: 1 }).withMessage('Merchant ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM merchant_documents WHERE merchant_id = ? ORDER BY uploaded_at DESC',
      [req.params.merchantId]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// Add a document for a merchant
router.post('/merchants/:merchantId/documents', [
  param('merchantId').isInt({ min: 1 }).withMessage('Merchant ID must be a positive integer'),
  body('document_type').trim().notEmpty().withMessage('Document type is required'),
  body('document_name').trim().notEmpty().withMessage('Document name is required'),
  body('document_url').trim().notEmpty().withMessage('Document URL is required'),
  validate
], async (req, res, next) => {
  try {
    const { document_type, document_name, document_url } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO merchant_documents (merchant_id, document_type, document_name, document_url) 
       VALUES (?, ?, ?, ?)`,
      [req.params.merchantId, document_type, document_name, document_url]
    );
    
    res.status(201).json({
      id: result.insertId,
      merchant_id: req.params.merchantId,
      document_type,
      document_name,
      document_url,
      uploaded_at: new Date()
    });
  } catch (error) {
    next(error);
  }
});

// Delete a document
router.delete('/documents/:documentId', [
  param('documentId').isInt({ min: 1 }).withMessage('Document ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    await pool.query('DELETE FROM merchant_documents WHERE id = ?', [req.params.documentId]);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ===== COMMISSIONS ENDPOINTS =====
// Get commissions for a specific merchant
router.get('/commissions/restaurant/:restaurantId', [
  param('restaurantId').isInt({ min: 1 }).withMessage('Restaurant ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM commissions WHERE restaurant_id = ? ORDER BY created_at DESC',
      [req.params.restaurantId]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// Calculate commission for an order (called when order is delivered)
router.post('/commissions/calculate', [
  body('order_id').trim().notEmpty().withMessage('Order ID is required'),
  validate
], async (req, res, next) => {
  try {
    const { order_id } = req.body;
    
    // Get order details
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [order_id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orders[0];
    const commissionRate = 10.00; // 10% platform fee
    const commissionAmount = (order.total * commissionRate) / 100;
    const merchantEarnings = order.total - commissionAmount - (order.delivery_fee || 0);
    
    // Create commission record
    const [result] = await pool.query(
      `INSERT INTO commissions (order_id, restaurant_id, subtotal, delivery_fee, platform_fee, commission_rate, commission_amount, merchant_earnings, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'calculated')`,
      [order.id, order.restaurant_id, order.subtotal, order.delivery_fee || 0, commissionAmount, commissionRate, commissionAmount, merchantEarnings]
    );
    
    res.status(201).json({
      id: result.insertId,
      order_id,
      commission_amount: commissionAmount,
      merchant_earnings: merchantEarnings
    });
  } catch (error) {
    next(error);
  }
});

// ===== PAYOUTS ENDPOINTS =====
// Get payouts for a restaurant
router.get('/payouts/restaurant/:restaurantId', [
  param('restaurantId').isInt({ min: 1 }).withMessage('Restaurant ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM merchant_payouts WHERE restaurant_id = ? ORDER BY created_at DESC',
      [req.params.restaurantId]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// Get wallet balance for a restaurant
router.get('/wallet/restaurant/:restaurantId', [
  param('restaurantId').isInt({ min: 1 }).withMessage('Restaurant ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM restaurant_wallets WHERE restaurant_id = ?',
      [req.params.restaurantId]
    );
    if (rows.length === 0) {
      // Create wallet if doesn't exist
      await pool.query(
        'INSERT INTO restaurant_wallets (restaurant_id, balance, pending_balance) VALUES (?, 0, 0)',
        [req.params.restaurantId]
      );
      return res.json({ restaurant_id: req.params.restaurantId, balance: 0, pending_balance: 0 });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// ===== DOCUMENT STATUS UPDATE (Admin) =====
// Update document status (approve/reject)
router.put('/merchant-documents/:documentId/status', [
  param('documentId').isInt({ min: 1 }).withMessage('Document ID must be a positive integer'),
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Status must be pending, approved, or rejected'),
  body('notes').optional().trim(),
  validate
], async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const [result] = await pool.query(
      'UPDATE merchant_documents SET status = ?, notes = ?, reviewed_at = NOW() WHERE id = ?',
      [status, notes || null, req.params.documentId]
    );
    res.json({ message: 'Document status updated', status });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
