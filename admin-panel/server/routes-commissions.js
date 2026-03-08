// Commission and Subscription Routes
// Copy this entire content and paste it BEFORE the "module.exports = router;" line in server/routes.js

const express = require('express');
const { query, body } = require('express-validator');
const pool = require('./db');
const router = express.Router();

// ===== COMMISSIONS API =====
// GET /api/commissions - List all commissions
router.get('/commissions', async (req, res, next) => {
  try {
    const { restaurant_id, status, start_date, end_date } = req.query;
    let query = `
      SELECT rc.*, r.name as restaurant_name, o.order_number, o.total_cost
      FROM restaurant_commissions rc
      LEFT JOIN restaurants r ON rc.restaurant_id = r.id
      LEFT JOIN orders o ON rc.order_id = o.id
      WHERE 1=1
    `;
    const params = [];
    
    if (restaurant_id) {
      query += ' AND rc.restaurant_id = ?';
      params.push(restaurant_id);
    }
    if (status) {
      query += ' AND rc.status = ?';
      params.push(status);
    }
    if (start_date) {
      query += ' AND DATE(rc.created_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND DATE(rc.created_at) <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY rc.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/commissions - Create a commission record
router.post('/commissions', async (req, res, next) => {
  try {
    const { restaurant_id, order_id, commission_rate, order_total, delivery_fee } = req.body;
    
    const commission_amount = (order_total * commission_rate) / 100;
    const restaurant_earnings = order_total - commission_amount;
    
    const [result] = await pool.query(
      `INSERT INTO restaurant_commissions 
       (restaurant_id, order_id, commission_rate, order_total, commission_amount, delivery_fee, restaurant_earnings)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [restaurant_id, order_id, commission_rate, order_total, commission_amount, delivery_fee || 0, restaurant_earnings]
    );
    
    res.status(201).json({ id: result.insertId, commission_amount, restaurant_earnings });
  } catch (error) {
    next(error);
  }
});

// ===== DELIVERY FEES API =====
// GET /api/delivery-fees - List all delivery fees
router.get('/delivery-fees', async (req, res, next) => {
  try {
    const { rider_id, status } = req.query;
    let query = `
      SELECT df.*, r.name as rider_name, o.order_number
      FROM delivery_fees df
      LEFT JOIN riders r ON df.rider_id = r.id
      LEFT JOIN orders o ON df.order_id = o.id
      WHERE 1=1
    `;
    const params = [];
    
    if (rider_id) {
      query += ' AND df.rider_id = ?';
      params.push(rider_id);
    }
    if (status) {
      query += ' AND df.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY df.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/delivery-fees - Create delivery fee record
router.post('/delivery-fees', async (req, res, next) => {
  try {
    const { rider_id, order_id, base_fee, distance_surcharge } = req.body;
    
    const total_fee = (base_fee || 20) + (distance_surcharge || 0);
    const rider_earnings = total_fee;
    
    const [result] = await pool.query(
      `INSERT INTO delivery_fees 
       (rider_id, order_id, base_fee, distance_surcharge, total_fee, rider_earnings)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [rider_id, order_id, base_fee || 20, distance_surcharge || 0, total_fee, rider_earnings]
    );
    
    res.status(201).json({ id: result.insertId, total_fee, rider_earnings });
  } catch (error) {
    next(error);
  }
});

// ===== SUBSCRIPTION PLANS API =====
// GET /api/subscription-plans - Get all active subscription plans
router.get('/subscription-plans', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY price ASC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// ===== RIDER SUBSCRIPTIONS API =====
// GET /api/rider-subscriptions - List all rider subscriptions
router.get('/rider-subscriptions', async (req, res, next) => {
  try {
    const { rider_id, status } = req.query;
    let query = `
      SELECT rs.*, r.name as rider_name, r.email, sp.name as plan_name, sp.plan_type, sp.price as plan_price
      FROM rider_subscriptions rs
      LEFT JOIN riders r ON rs.rider_id = r.id
      LEFT JOIN subscription_plans sp ON rs.plan_id = sp.id
      WHERE 1=1
    `;
    const params = [];
    
    if (rider_id) {
      query += ' AND rs.rider_id = ?';
      params.push(rider_id);
    }
    if (status) {
      query += ' AND rs.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY rs.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/rider-subscriptions - Subscribe a rider to a plan
router.post('/rider-subscriptions', async (req, res, next) => {
  try {
    const { rider_id, plan_id, subscription_start, subscription_end, payment_method, transaction_reference } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO rider_subscriptions 
       (rider_id, plan_id, subscription_start, subscription_end, status, payment_status, payment_method, transaction_reference)
       VALUES (?, ?, ?, ?, 'active', 'paid', ?, ?)`,
      [rider_id, plan_id, subscription_start, subscription_end, payment_method, transaction_reference]
    );
    
    await pool.query(
      `INSERT INTO subscription_payments 
       (rider_subscription_id, amount, payment_method, transaction_reference, status)
       VALUES (?, (SELECT price FROM subscription_plans WHERE id = ?), ?, ?, 'success')`,
      [result.insertId, plan_id, payment_method, transaction_reference]
    );
    
    await pool.query(
      "UPDATE riders SET status = 'available' WHERE id = ?",
      [rider_id]
    );
    
    res.status(201).json({ id: result.insertId, status: 'active' });
  } catch (error) {
    next(error);
  }
});

// ===== EARNINGS API =====
// GET /api/earnings/summary - Get earnings summary
router.get('/earnings/summary', async (req, res, next) => {
  try {
    const { period_type = 'daily', start_date, end_date } = req.query;
    
    let query = `
      SELECT date, period_type, total_orders, total_revenue, restaurant_commissions,
             delivery_fees_collected, rider_subscriptions, gross_earnings, net_earnings
      FROM platform_earnings
      WHERE period_type = ?
    `;
    const params = [period_type];
    
    if (start_date) {
      query += ' AND date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND date <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY date DESC';
    
    const [rows] = await pool.query(query, params);
    
    const summary = {
      total_orders: rows.reduce((sum, r) => sum + (r.total_orders || 0), 0),
      total_revenue: rows.reduce((sum, r) => sum + (r.total_revenue || 0), 0),
      restaurant_commissions: rows.reduce((sum, r) => sum + (r.restaurant_commissions || 0), 0),
      delivery_fees: rows.reduce((sum, r) => sum + (r.delivery_fees_collected || 0), 0),
      subscriptions: rows.reduce((sum, r) => sum + (r.rider_subscriptions || 0), 0),
      gross_earnings: rows.reduce((sum, r) => sum + (r.gross_earnings || 0), 0),
      net_earnings: rows.reduce((sum, r) => sum + (r.net_earnings || 0), 0),
      period_details: rows
    };
    
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// GET /api/earnings/today - Get today's earnings
router.get('/earnings/today', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [commissions] = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(commission_amount), 0) as total 
       FROM restaurant_commissions WHERE DATE(created_at) = ?`,
      [today]
    );
    
    const [deliveryFees] = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_fee), 0) as total 
       FROM delivery_fees WHERE DATE(created_at) = ?`,
      [today]
    );
    
    const [subscriptions] = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
       FROM subscription_payments WHERE DATE(payment_date) = ?`,
      [today]
    );
    
    res.json({
      date: today,
      commissions: { count: commissions[0]?.count || 0, total: parseFloat(commissions[0]?.total || 0) },
      delivery_fees: { count: deliveryFees[0]?.count || 0, total: parseFloat(deliveryFees[0]?.total || 0) },
      subscriptions: { count: subscriptions[0]?.count || 0, total: parseFloat(subscriptions[0]?.total || 0) },
      gross_earnings: parseFloat(commissions[0]?.total || 0) + parseFloat(deliveryFees[0]?.total || 0) + parseFloat(subscriptions[0]?.total || 0)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
