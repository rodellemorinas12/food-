const db = require('../config/db');

const notificationService = {
  // Send notification (stores in database)
  send: async (userId, title, message) => {
    return new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [userId, title, message],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Get notifications by user
  getByUser: async (userId, limit = 20) => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Get unread notifications
  getUnread: async (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM notifications WHERE user_id = ? AND is_read = FALSE ORDER BY created_at DESC',
        [userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
  },

  // Mark as read
  markAsRead: async (notificationId, userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
        [notificationId, userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Mark all as read
  markAllAsRead: async (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
        [userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Delete notification
  delete: async (notificationId, userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'DELETE FROM notifications WHERE id = ? AND user_id = ?',
        [notificationId, userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Firebase Cloud Messaging (FCM) - for push notifications
  // Requires firebase-admin package
  sendPush: async (fcmToken, title, body, data) => {
    // This would integrate with FCM
    // const admin = require('firebase-admin');
    // const message = {
    //   notification: { title, body },
    //   data: data || {},
    //   token: fcmToken
    // };
    // return await admin.messaging().send(message);
    
    console.log(`[PUSH] Sending to ${fcmToken}: ${title} - ${body}`);
    return { mock: true };
  },

  // Send order notification
  notifyOrderStatus: async (orderId, status) => {
    // Get order with user info
    const order = await new Promise((resolve, reject) => {
      db.query(
        'SELECT o.*, u.id as user_id FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?',
        [orderId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        }
      );
    });

    if (order) {
      const messages = {
        pending: 'Your order has been received and is waiting for restaurant confirmation.',
        accepted: 'Your order has been accepted by the restaurant!',
        preparing: 'The restaurant is preparing your food.',
        ready: 'Your order is ready for pickup!',
        picked_up: 'Your rider has picked up your order.',
        delivered: 'Your order has been delivered. Enjoy your meal!',
        cancelled: 'Your order has been cancelled.'
      };

      await this.send(order.user_id, 'Order Update', messages[status] || `Order status: ${status}`);
    }
  },

  // Send to device via Socket.io
  sendRealtime: (io, userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
  }
};

module.exports = notificationService;
