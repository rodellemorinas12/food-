// Calendar Routes
const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const pool = require('./db');
const router = express.Router();

// ===== VALIDATION MIDDLEWARE =====
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ===== CALENDAR EVENTS API =====

// GET /api/calendar - Get all calendar events
router.get('/calendar', async (req, res, next) => {
  try {
    const { start_date, end_date, event_type } = req.query;
    
    let queryStr = 'SELECT * FROM calendar_events WHERE 1=1';
    const params = [];
    
    if (start_date) {
      queryStr += ' AND start >= ?';
      params.push(start_date);
    }
    if (end_date) {
      queryStr += ' AND end <= ?';
      params.push(end_date);
    }
    if (event_type) {
      queryStr += ' AND event_type = ?';
      params.push(event_type);
    }
    
    queryStr += ' ORDER BY start ASC';
    
    const [rows] = await pool.query(queryStr, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/calendar/:id - Get single calendar event
router.get('/calendar/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM calendar_events WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/calendar - Create calendar event
router.post('/calendar', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('start').notEmpty().withMessage('Start date is required'),
  body('end').optional(),
  body('event_type').optional().trim(),
  body('description').optional().trim(),
  body('color').optional().trim(),
  body('all_day').optional().isBoolean().withMessage('all_day must be a boolean'),
  validate
], async (req, res, next) => {
  try {
    const { title, start, end, event_type, description, color, all_day } = req.body;
    
    // Ensure start and end are valid date strings
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : startDate;
    
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'Invalid start date format' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO calendar_events (title, start, end, event_type, description, color, all_day) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, startDate, endDate, event_type || 'general', description || null, color || '#1976d2', all_day || false]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      title, 
      start: startDate, 
      end: endDate, 
      event_type: event_type || 'general',
      description,
      color: color || '#1976d2',
      all_day: all_day || false
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/calendar/:id - Update calendar event
router.put('/calendar/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    const { title, start, end, event_type, description, color, all_day } = req.body;
    
    await pool.query(
      `UPDATE calendar_events 
       SET title=?, start=?, end=?, event_type=?, description=?, color=?, all_day=? 
       WHERE id=?`,
      [title, start, end || start, event_type || 'general', description || null, color || '#1976d2', all_day || false, req.params.id]
    );
    
    res.json({ 
      id: req.params.id, 
      title, 
      start, 
      end: end || start, 
      event_type: event_type || 'general',
      description,
      color: color || '#1976d2',
      all_day: all_day || false
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/calendar/:id - Delete calendar event
router.delete('/calendar/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  validate
], async (req, res, next) => {
  try {
    await pool.query('DELETE FROM calendar_events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
