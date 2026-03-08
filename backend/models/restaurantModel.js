const db = require('../config/db');

const restaurantModel = {
  // Create restaurant
  create: (restaurantData) => {
    return new Promise((resolve, reject) => {
      const { merchant_id, name, address, description, image, status } = restaurantData;
      db.query(
        'INSERT INTO restaurants (merchant_id, name, address, description, image, status) VALUES (?, ?, ?, ?, ?, ?)',
        [merchant_id, name, address, description, image, status || 'approved'],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Get all restaurants (public)
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM restaurants WHERE status = "approved" ORDER BY created_at DESC',
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Get restaurant by ID
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM restaurants WHERE id = ?', [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Get restaurants by merchant
  getByMerchant: (merchantId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM restaurants WHERE merchant_id = ? ORDER BY created_at DESC',
        [merchantId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Get approved restaurants
  getApproved: () => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM restaurants WHERE status = "approved" ORDER BY rating DESC',
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Search restaurants
  search: (query) => {
    return new Promise((resolve, reject) => {
      const searchTerm = `%${query}%`;
      db.query(
        `SELECT * FROM restaurants WHERE status = "approved" AND 
         (name LIKE ? OR description LIKE ?) ORDER BY rating DESC`,
        [searchTerm, searchTerm],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Update restaurant
  update: (id, restaurantData) => {
    return new Promise((resolve, reject) => {
      const { name, address, description, image, status } = restaurantData;
      db.query(
        'UPDATE restaurants SET name = ?, address = ?, description = ?, image = ?, status = ? WHERE id = ?',
        [name, address, description, image, status, id],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Update rating
  updateRating: (id) => {
    return new Promise((resolve, reject) => {
      db.query(
        `UPDATE restaurants r SET r.rating = (
          SELECT AVG(rating) FROM reviews WHERE restaurant_id = r.id
        ) WHERE r.id = ?`,
        [id],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Delete restaurant
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.query('DELETE FROM restaurants WHERE id = ?', [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
};

module.exports = restaurantModel;
