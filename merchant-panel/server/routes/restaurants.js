const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const db = new Database('teresa_eats.db');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Multer for file uploads
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

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

// Upload logo endpoint
router.post('/upload-logo', authenticateToken, upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const logoPath = `/uploads/${req.file.filename}`;
    res.json({ path: logoPath, message: 'Logo uploaded successfully' });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Get all restaurants (for admin) or user's restaurant
router.get('/', authenticateToken, (req, res) => {
  try {
    const restaurants = db.prepare(`
      SELECT * FROM restaurants WHERE user_id = ?
    `).all(req.user.userId);
    
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Public: Get all approved restaurants (for customer app)
router.get('/public', (req, res) => {
  try {
    const restaurants = db.prepare(`
      SELECT id, name, cuisine_type, address, phone, email, description, is_open, logo 
      FROM restaurants 
      WHERE status = 'approved'
      ORDER BY name ASC
    `).all();
    
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Public: Get single restaurant by ID
router.get('/public/:id', (req, res) => {
  try {
    const restaurant = db.prepare(`
      SELECT id, name, cuisine_type, address, phone, email, description, is_open, logo 
      FROM restaurants 
      WHERE id = ? AND status = 'approved'
    `).get(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

// Get single restaurant
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const restaurant = db.prepare(`
      SELECT * FROM restaurants WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

// Create restaurant (merchant application)
router.post('/', authenticateToken, [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty(),
], validateRequest, (req, res) => {
  try {
    const { name, cuisine_type, address, phone, email, description, status, is_open, logo } = req.body;

    // Check if user already has a restaurant
    const existingRestaurant = db.prepare(
      'SELECT id FROM restaurants WHERE user_id = ?'
    ).get(req.user.userId);

    if (existingRestaurant) {
      return res.status(400).json({ error: 'You already have a restaurant registered' });
    }

    // Handle logo upload (base64 or file path)
    let logoPath = null;
    if (logo) {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // If logo is base64, save it
      if (logo.startsWith('data:image')) {
        const base64Data = logo.replace(/^data:image\/\w+;base64,/, '');
        const fileBuffer = Buffer.from(base64Data, 'base64');
        const fileName = `logo_${Date.now()}.png`;
        logoPath = path.join(uploadsDir, fileName);
        fs.writeFileSync(logoPath, fileBuffer);
        logoPath = `/uploads/${fileName}`; // Store relative path
      } else if (logo.startsWith('/uploads/')) {
        logoPath = logo;
      }
    }

    const result = db.prepare(`
      INSERT INTO restaurants (user_id, name, cuisine_type, address, phone, email, description, status, is_open, logo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.userId,
      name,
      cuisine_type || null,
      address || null,
      phone,
      email,
      description || null,
      status || 'pending',
      is_open ? 1 : 0,
      logoPath
    );

    res.status(201).json({
      message: 'Restaurant created successfully',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

// Update restaurant
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { name, cuisine_type, address, phone, email, description, status, is_open } = req.body;

    // Check ownership
    const restaurant = db.prepare(
      'SELECT * FROM restaurants WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.userId);

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    db.prepare(`
      UPDATE restaurants 
      SET name = ?, cuisine_type = ?, address = ?, phone = ?, email = ?, 
          description = ?, status = ?, is_open = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      name || restaurant.name,
      cuisine_type || restaurant.cuisine_type,
      address || restaurant.address,
      phone || restaurant.phone,
      email || restaurant.email,
      description || restaurant.description,
      status || restaurant.status,
      is_open !== undefined ? (is_open ? 1 : 0) : restaurant.is_open,
      req.params.id,
      req.user.userId
    );

    res.json({ message: 'Restaurant updated successfully' });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// Delete restaurant
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare(
      'DELETE FROM restaurants WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
});

// Validation helper
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = router;
