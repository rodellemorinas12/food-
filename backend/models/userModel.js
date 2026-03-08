const db = require('../config/db');

const userModel = {
  // Create new user
  create: (userData) => {
    return new Promise((resolve, reject) => {
      const { name, email, password, phone, role } = userData;
      db.query(
        'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
        [name, email, password, phone || null, role || 'customer'],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Find user by email
  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Find user by ID
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Get all users
  getAll: (role) => {
    return new Promise((resolve, reject) => {
      let query = 'SELECT id, name, email, phone, role, created_at FROM users';
      let params = [];
      
      if (role) {
        query += ' WHERE role = ?';
        params.push(role);
      }
      
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  },

  // Update user
  update: (id, userData) => {
    return new Promise((resolve, reject) => {
      const { name, phone, email } = userData;
      db.query(
        'UPDATE users SET name = ?, phone = ?, email = ? WHERE id = ?',
        [name, phone, email, id],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Update password
  updatePassword: (id, password) => {
    return new Promise((resolve, reject) => {
      db.query('UPDATE users SET password = ? WHERE id = ?', [password, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Delete user
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
};

module.exports = userModel;
