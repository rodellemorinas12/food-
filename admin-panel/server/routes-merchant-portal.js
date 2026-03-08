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

// ===== MERCHANT AUTHENTICATION =====

// Register new merchant (creates user + restaurant)
router.post('/auth/register', [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('restaurantName').trim().notEmpty().withMessage('Restaurant name is required'),
  validate
], async (req, res, next) => {
  try {
    const { email, password, name, phone, restaurantName, address, cuisineType } = req.body;
    
    // Check if user exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create user
    const [userResult] = await pool.query(
      'INSERT INTO users (name, email, phone_number, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, password, 'merchant']
    );
    
    const userId = userResult.insertId;
    
    // Create restaurant
    const [restaurantResult] = await pool.query(
      'INSERT INTO restaurants (user_id, name, address, cuisine_type, status, is_open) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, restaurantName, address || '', cuisineType || '', 'pending', 0]
    );
    
    const restaurantId = restaurantResult.insertId;
    
    res.status(201).json({
      message: 'Registration successful',
      user: { id: userId, email, name },
      restaurant: { id: restaurantId, name: restaurantName }
    });
  } catch (error) {
    next(error);
  }
});

// Merchant login
router.post('/auth/login', [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').trim().notEmpty().withMessage('Password is required'),
  validate
], async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'merchant']);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Check password (plain text comparison - in production use bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Get restaurant
    const [restaurants] = await pool.query('SELECT * FROM restaurants WHERE user_id = ?', [user.id]);
    const restaurant = restaurants[0];
    
    res.json({
      message: 'Login successful',
      token: `merchant_${user.id}_${Date.now()}`,
      user: { id: user.id, email: user.email, name: user.name },
      restaurant: restaurant ? {
        id: restaurant.id,
        name: restaurant.name,
        status: restaurant.status,
        is_open: restaurant.is_open
      } : null
    });
  } catch (error) {
    next(error);
  }
});

// ===== RESTAURANT MANAGEMENT =====

// Create restaurant (for onboarding)
router.post('/restaurants', [
  body('name').trim().notEmpty().withMessage('Restaurant name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  validate
], async (req, res, next) => {
  try {
    const { name, cuisine_type, address, phone, email, description, user_id } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO restaurants (user_id, name, cuisine_type, address, phone, email, description, status, is_open) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
      [user_id || null, name, cuisine_type || null, address || '', phone, email, description || '']
    );
    
    res.status(201).json({
      message: 'Restaurant created successfully',
      id: result.insertId,
      name,
      status: 'pending'
    });
  } catch (error) {
    next(error);
  }
});

// Get restaurant by user ID
router.get('/restaurants/user/:userId', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM restaurants WHERE user_id = ?', [req.params.userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update restaurant status
router.put('/restaurants/:id/status', [
  param('id').isInt({ min: 1 }).withMessage('Valid restaurant ID required'),
  body('status').trim().notEmpty().withMessage('Status is required'),
  validate
], async (req, res, next) => {
  try {
    const { status } = req.body;
    
    await pool.query('UPDATE restaurants SET status = ? WHERE id = ?', [status, req.params.id]);
    
    res.json({ message: 'Status updated', id: req.params.id, status });
  } catch (error) {
    next(error);
  }
});

// ===== MENU ITEMS =====

// Get menu items for restaurant
router.get('/menu-items/restaurant/:restaurantId', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name',
      [req.params.restaurantId]
    );
    
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// Create menu item
router.post('/menu-items', [
  body('restaurant_id').isInt({ min: 1 }).withMessage('Valid restaurant ID required'),
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  validate
], async (req, res, next) => {
  try {
    const { restaurant_id, name, description, price, category, image_url, status } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [restaurant_id, name, description || '', price, category || 'Main Dish', image_url || null, status || 'available']
    );
    
    res.status(201).json({
      message: 'Menu item created',
      id: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

// Update menu item
router.put('/menu-items/:id', [
  param('id').isInt({ min: 1 }).withMessage('Valid menu item ID required'),
  validate
], async (req, res, next) => {
  try {
    const { name, description, price, category, image_url, status } = req.body;
    
    // Get current item
    const [current] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (current.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    await pool.query(
      'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, image_url = ?, status = ? WHERE id = ?',
      [
        name || current[0].name,
        description || current[0].description,
        price || current[0].price,
        category || current[0].category,
        image_url || current[0].image_url,
        status || current[0].status,
        req.params.id
      ]
    );
    
    res.json({ message: 'Menu item updated' });
  } catch (error) {
    next(error);
  }
});

// Delete menu item
router.delete('/menu-items/:id', [
  param('id').isInt({ min: 1 }).withMessage('Valid menu item ID required'),
  validate
], async (req, res, next) => {
  try {
    await pool.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  }
});

// ===== ORDERS =====

// Get orders for restaurant
router.get('/orders', async (req, res, next) => {
  try {
    const { restaurant_id } = req.query;
    
    let query = 'SELECT * FROM orders';
    let params = [];
    
    if (restaurant_id) {
      query += ' WHERE restaurant_id = ?';
      params.push(restaurant_id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// Update order status
router.put('/orders/:id/status', [
  param('id').isInt({ min: 1 }).withMessage('Valid order ID required'),
  body('status').trim().notEmpty().withMessage('Status is required'),
  validate
], async (req, res, next) => {
  try {
    const { status, estimated_prep_time, reject_reason } = req.body;
    
    await pool.query(
      'UPDATE orders SET status = ?, estimated_prep_time = ?, reject_reason = ? WHERE id = ?',
      [status, estimated_prep_time || null, reject_reason || null, req.params.id]
    );
    
    res.json({ message: 'Order status updated', id: req.params.id, status });
  } catch (error) {
    next(error);
  }
});

// ===== MERCHANT DOCUMENTS =====

// Upload document
router.post('/merchant-documents', [
  body('merchant_id').isInt({ min: 1 }).withMessage('Valid merchant ID required'),
  body('document_type').trim().notEmpty().withMessage('Document type is required'),
  validate
], async (req, res, next) => {
  try {
    const { merchant_id, document_type, document_name, document_url } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO merchant_documents (merchant_id, document_type, document_name, document_url) VALUES (?, ?, ?, ?)',
      [merchant_id, document_type, document_name || document_type, document_url || '']
    );
    
    res.status(201).json({
      message: 'Document uploaded',
      id: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

// Get documents for merchant
router.get('/merchant-documents/:merchantId', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM merchant_documents WHERE merchant_id = ? ORDER BY created_at DESC',
      [req.params.merchantId]
    );
    
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
