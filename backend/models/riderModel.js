const db = require('../config/db');

const riderModel = {
  // Create rider profile
  create: (riderData) => {
    return new Promise((resolve, reject) => {
      const { user_id, vehicle_type, license_plate } = riderData;
      db.query(
        'INSERT INTO riders (user_id, vehicle_type, license_plate, is_online) VALUES (?, ?, ?, ?)',
        [user_id, vehicle_type, license_plate, false],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Get rider by user ID
  findByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT r.*, u.name, u.email, u.phone 
         FROM riders r 
         LEFT JOIN users u ON r.user_id = u.id 
         WHERE r.user_id = ?`,
        [userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        }
      );
    });
  },

  // Get rider by ID
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT r.*, u.name, u.email, u.phone 
         FROM riders r 
         LEFT JOIN users u ON r.user_id = u.id 
         WHERE r.id = ?`,
        [id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        }
      );
    });
  },

  // Get all riders
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT r.*, u.name, u.email, u.phone 
         FROM riders r 
         LEFT JOIN users u ON r.user_id = u.id 
         ORDER BY r.created_at DESC`,
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Get online riders
  getOnline: () => {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT r.*, u.name, u.email, u.phone 
         FROM riders r 
         LEFT JOIN users u ON r.user_id = u.id 
         WHERE r.is_online = true`,
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Toggle online status
  toggleOnline: (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE riders SET is_online = NOT is_online WHERE user_id = ?',
        [userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Update location
  updateLocation: (userId, lat, lng) => {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE riders SET last_lat = ?, last_lng = ?, last_update = NOW() WHERE user_id = ?',
        [lat, lng, userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Get location
  getLocation: (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT last_lat, last_lng, last_update FROM riders WHERE user_id = ?',
        [userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        }
      );
    });
  },

  // Update rider
  update: (userId, riderData) => {
    return new Promise((resolve, reject) => {
      const { vehicle_type, license_plate } = riderData;
      db.query(
        'UPDATE riders SET vehicle_type = ?, license_plate = ? WHERE user_id = ?',
        [vehicle_type, license_plate, userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Get nearby riders (simple implementation)
  getNearby: (lat, lng, radius = 10) => {
    return new Promise((resolve, reject) => {
      // Simple distance calculation (not accurate for large distances)
      db.query(
        `SELECT r.*, u.name, u.phone,
         (6371 * acos(cos(radians(?)) * cos(radians(r.last_lat)) * 
         cos(radians(r.last_lng) - radians(?)) + sin(radians(?)) * 
         sin(radians(r.last_lat)))) AS distance
         FROM riders r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.is_online = true AND r.last_lat IS NOT NULL
         HAVING distance < ?
         ORDER BY distance`,
        [lat, lng, lat, radius],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  }
};

module.exports = riderModel;
