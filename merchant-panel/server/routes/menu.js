const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const db = new Database('teresa_eats.db');
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
    cb(null, 'menu-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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

// Upload menu image endpoint
router.post('/upload-image', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const imagePath = `/uploads/${req.file.filename}`;
    res.json({ path: imagePath, message: 'Image uploaded successfully' });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Get menu items for a restaurant
router.get('/restaurant/:restaurantId', authenticateToken, (req, res) => {
  try {
    const menuItems = db.prepare(`
      SELECT * FROM menu_items WHERE restaurant_id = ?
    `).all(req.params.restaurantId);

    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Public: Get menu items for a restaurant (for customer app)
router.get('/public/restaurant/:restaurantId', (req, res) => {
  try {
    // First check if restaurant exists and is approved
    const restaurant = db.prepare(`
      SELECT id FROM restaurants WHERE id = ? AND status = 'approved'
    `).get(req.params.restaurantId);

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const menuItems = db.prepare(`
      SELECT id, name, description, price, category, image_url, status 
      FROM menu_items 
      WHERE restaurant_id = ? AND status = 'available'
      ORDER BY category, name ASC
    `).all(req.params.restaurantId);

    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Get single menu item
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const menuItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});

// Create menu item
router.post('/', authenticateToken, (req, res) => {
  try {
    const { restaurant_id, name, description, price, category, image_url, status } = req.body;

    // Verify restaurant belongs to user
    const restaurant = db.prepare(
      'SELECT id FROM restaurants WHERE id = ? AND user_id = ?'
    ).get(restaurant_id, req.user.userId);

    if (!restaurant) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = db.prepare(`
      INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      restaurant_id,
      name,
      description || null,
      price,
      category || 'Main Dish',
      image_url || null,
      status || 'available'
    );

    res.status(201).json({
      message: 'Menu item created',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// Update menu item
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { name, description, price, category, image_url, status } = req.body;

    // Check ownership through restaurant
    const menuItem = db.prepare(`
      SELECT m.* FROM menu_items m
      JOIN restaurants r ON m.restaurant_id = r.id
      WHERE m.id = ? AND r.user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    db.prepare(`
      UPDATE menu_items 
      SET name = ?, description = ?, price = ?, category = ?, image_url = ?, status = ?
      WHERE id = ?
    `).run(
      name || menuItem.name,
      description || menuItem.description,
      price || menuItem.price,
      category || menuItem.category,
      image_url || menuItem.image_url,
      status || menuItem.status,
      req.params.id
    );

    res.json({ message: 'Menu item updated' });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Delete menu item
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    // Check ownership through restaurant
    const menuItem = db.prepare(`
      SELECT m.* FROM menu_items m
      JOIN restaurants r ON m.restaurant_id = r.id
      WHERE m.id = ? AND r.user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);

    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

module.exports = router;
