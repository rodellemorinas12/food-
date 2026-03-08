const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('./db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ===== JWT SECRET =====
// IMPORTANT: JWT_SECRET must be set in environment variable for production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set!');
  console.error('Please set JWT_SECRET before starting the server.');
  // In production, you might want to exit here:
  // process.exit(1);
}

// ===== VALIDATION MIDDLEWARE =====
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ===== REGISTER =====
router.post('/auth/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isString().trim(),
  validate
], async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.json({ status: "0", message: "Email already registered" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone_number, password) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, hashedPassword]
    );
    
    const token = jwt.sign({ id: result.insertId, email, name }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      status: "1",
      message: "Registration successful",
      payload: {
        id: result.insertId.toString(),
        name: name,
        email: email,
        phone: phone,
        token: token
      }
    });
  } catch (error) {
    next(error);
  }
});

// ===== LOGIN =====
router.post('/auth/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.json({ status: "0", message: "Invalid email or password" });
    }
    
    const user = rows[0];
    
    // Check password - only accept hashed passwords
    let passwordValid = false;
    if (user.password) {
      passwordValid = await bcrypt.compare(password, user.password);
    }
    
    if (!passwordValid) {
      return res.json({ status: "0", message: "Invalid email or password" });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      status: "1",
      message: "Login successful",
      payload: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone_number,
        token: token
      }
    });
  } catch (error) {
    next(error);
  }
});

// ===== FORGOT PASSWORD REQUEST =====
router.post('/auth/forgot_password_request', [
  body('email').isEmail().withMessage('Valid email is required'),
  validate
], async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a reset code has been sent' });
    }
    
    // Generate reset code (6 digits)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration (15 minutes from now)
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);
    
    // Store reset code with expiration (in production, send via email)
    await pool.query(
      'UPDATE users SET reset_code = ?, reset_code_expires = ? WHERE id = ?', 
      [resetCode, resetExpires, rows[0].id]
    );
    
    // Return generic message - don't reveal reset code in production
    res.json({ message: 'If the email exists, a reset code has been sent' });
  } catch (error) {
    next(error);
  }
});

// ===== VERIFY RESET CODE =====
router.post('/auth/verify_reset_code', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('resetCode').isLength({ min: 6, max: 6 }).withMessage('Valid reset code is required'),
  validate
], async (req, res, next) => {
  try {
    const { email, resetCode } = req.body;
    
    // Check if code matches and hasn't expired
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND reset_code = ? AND (reset_code_expires IS NULL OR reset_code_expires > NOW())', 
      [email, resetCode]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }
    
    res.json({ message: 'Reset code verified' });
  } catch (error) {
    next(error);
  }
});

// ===== SET NEW PASSWORD =====
router.post('/auth/set_new_password', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('resetCode').isLength({ min: 6, max: 6 }).withMessage('Valid reset code is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], async (req, res, next) => {
  try {
    const { email, resetCode, password } = req.body;
    
    // Check if code matches and hasn't expired
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND reset_code = ? AND (reset_code_expires IS NULL OR reset_code_expires > NOW())', 
      [email, resetCode]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password and clear reset code and expiration
    await pool.query(
      'UPDATE users SET password = ?, reset_code = NULL, reset_code_expires = NULL WHERE id = ?', 
      [hashedPassword, rows[0].id]
    );
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
