// Payment service - integrates with payment gateways
// Currently supports Cash on Delivery (COD)

const db = require('../config/db');

const paymentService = {
  // Process payment (currently only COD)
  processPayment: async (orderId, paymentMethod, amount) => {
    if (paymentMethod === 'cash') {
      // Cash on Delivery - mark as pending payment
      return {
        success: true,
        status: 'pending',
        message: 'Cash on Delivery'
      };
    }
    
    // Other payment methods would integrate with Stripe, PayPal, GCash, etc.
    return {
      success: false,
      message: 'Payment method not supported'
    };
  },

  // Verify payment (for online payments)
  verifyPayment: async (transactionId) => {
    // Would verify with payment gateway
    return {
      verified: true,
      status: 'paid'
    };
  },

  // Create payment record
  createPayment: async (paymentData) => {
    return new Promise((resolve, reject) => {
      const { order_id, payment_method, amount, transaction_id, status } = paymentData;
      db.query(
        'INSERT INTO payments (order_id, payment_method, amount, transaction_id, payment_status) VALUES (?, ?, ?, ?, ?)',
        [order_id, payment_method, amount, transaction_id, status || 'pending'],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  },

  // Get payment by order
  getByOrder: async (orderId) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM payments WHERE order_id = ?', [orderId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  },

  // Update payment status
  updateStatus: async (orderId, status) => {
    return new Promise((resolve, reject) => {
      db.query('UPDATE payments SET payment_status = ? WHERE order_id = ?', [status, orderId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Stripe integration (example)
  stripePayment: async (amount, currency = 'php') => {
    // This would integrate with Stripe API
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amount * 100,
    //   currency,
    // });
    // return paymentIntent;
    return { mock: true, message: 'Stripe integration not configured' };
  },

  // PayPal integration (example)
  paypalPayment: async (amount) => {
    // Would integrate with PayPal API
    return { mock: true, message: 'PayPal integration not configured' };
  },

  // GCash integration (example)
  gcashPayment: async (amount) => {
    // Would integrate with GCash API
    return { mock: true, message: 'GCash integration not configured' };
  },

  // Process refund
  refund: async (orderId, amount) => {
    // Would process refund through payment gateway
    return {
      success: true,
      message: 'Refund processed'
    };
  }
};

module.exports = paymentService;
