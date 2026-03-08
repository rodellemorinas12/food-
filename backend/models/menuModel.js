const db = require('../config/db');

const menuModel = {
  // Create menu item
  create: (menuData) => {
    return new Promise((resolve, reject) => {
      const { restaurant_id, name, description, price, image, category, available } = menuData;
      db.query(
        'INSERT INTO menu_items (restaurant_id, name, description, price, image, category, available) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [restaurant_id, name, description, price, image, category, available !== false],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Get menu items by restaurant
  getByRestaurant: (restaurantId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name',
        [restaurantId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Get available menu items by restaurant
  getAvailableByRestaurant: (restaurantId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM menu_items WHERE restaurant_id = ? AND available = TRUE ORDER BY category, name',
        [restaurantId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Get menu item by ID
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM menu_items WHERE id = ?', [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Get all menu items
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM menu_items ORDER BY restaurant_id, category, name', (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Get categories by restaurant
  getCategories: (restaurantId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT DISTINCT category FROM menu_items WHERE restaurant_id = ? AND category IS NOT NULL ORDER BY category',
        [restaurantId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results.map(r => r.category));
        }
      );
    });
  },

  // Update menu item
  update: (id, menuData) => {
    return new Promise((resolve, reject) => {
      const { name, description, price, image, category, available } = menuData;
      db.query(
        'UPDATE menu_items SET name = ?, description = ?, price = ?, image = ?, category = ?, available = ? WHERE id = ?',
        [name, description, price, image, category, available, id],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Toggle availability
  toggleAvailability: (id) => {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE menu_items SET available = NOT available WHERE id = ?',
        [id],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Delete menu item
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.query('DELETE FROM menu_items WHERE id = ?', [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
};

module.exports = menuModel;
