const db = require('../config/db');

const orderModel = {
  // Create order
  create: (orderData) => {
    return new Promise((resolve, reject) => {
      const { user_id, restaurant_id, rider_id, total, delivery_fee, address, phone, notes, payment_method, order_number } = orderData;
      db.query(
        `INSERT INTO orders (user_id, restaurant_id, rider_id, total, delivery_fee, address, phone, notes, payment_method, order_number) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, restaurant_id, rider_id || null, total, delivery_fee || 0, address, phone, notes, payment_method || 'cash', order_number],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Get order by ID
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT o.*, r.name as restaurant_name, r.address as restaurant_address, u.name as customer_name 
         FROM orders o 
         LEFT JOIN restaurants r ON o.restaurant_id = r.id 
         LEFT JOIN users u ON o.user_id = u.id 
         WHERE o.id = ?`,
        [id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        }
      );
    });
  },

  // Get order items
  getItems: (orderId) => {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT oi.*, mi.name as menu_item_name, mi.image as menu_item_image 
         FROM order_items oi 
         LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id 
         WHERE oi.order_id = ?`,
        [orderId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Get orders by user
  getByUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT o.*, r.name as restaurant_name, r.image as restaurant_image 
         FROM orders o 
         LEFT JOIN restaurants r ON o.restaurant_id = r.id 
         WHERE o.user_id = ? 
         ORDER BY o.created_at DESC`,
        [userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Get orders by restaurant
  getByRestaurant: (restaurantId) => {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT o.*, u.name as customer_name, u.phone as customer_phone 
         FROM orders o 
         LEFT JOIN users u ON o.user_id = u.id 
         WHERE o.restaurant_id = ? 
         ORDER BY o.created_at DESC`,
        [restaurantId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Get pending orders (for riders)
  getPending: () => {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT o.*, r.name as restaurant_name, r.address as restaurant_address 
         FROM orders o 
         LEFT JOIN restaurants r ON o.restaurant_id = r.id 
         WHERE o.status IN ('pending', 'accepted', 'ready') AND o.rider_id IS NULL
         ORDER BY o.created_at ASC`,
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Get orders by rider
  getByRider: (riderId) => {
    return new Promise((resolve, reject) => {
      db.query(
        `SELECT o.*, r.name as restaurant_name, r.address as restaurant_address 
         FROM orders o 
         LEFT JOIN restaurants r ON o.restaurant_id = r.id 
         WHERE o.rider_id = ? 
         ORDER BY o.created_at DESC`,
        [riderId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Update order status
  updateStatus: (id, status) => {
    return new Promise((resolve, reject) => {
      db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Assign rider
  assignRider: (orderId, riderId) => {
    return new Promise((resolve, reject) => {
      db.query('UPDATE orders SET rider_id = ?, status = "accepted" WHERE id = ?', [riderId, orderId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Add order items
  addItems: (orderId, items) => {
    return new Promise((resolve, reject) => {
      const values = items.map(item => [orderId, item.menu_item_id, item.quantity, item.price, item.notes || null]);
      db.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes) VALUES ?',
        [values],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Get all orders (admin)
  getAll: (status) => {
    return new Promise((resolve, reject) => {
      let query = `SELECT o.*, r.name as restaurant_name, u.name as customer_name 
                   FROM orders o 
                   LEFT JOIN restaurants r ON o.restaurant_id = r.id 
                   LEFT JOIN users u ON o.user_id = u.id`;
      
      if (status) {
        query += ' WHERE o.status = ?';
        db.query(query + ' ORDER BY o.created_at DESC', [status], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      } else {
        db.query(query + ' ORDER BY o.created_at DESC', (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }
    });
  },

  // Cancel order
  cancel: (id) => {
    return new Promise((resolve, reject) => {
      db.query('UPDATE orders SET status = "cancelled" WHERE id = ?', [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
};

module.exports = orderModel;
