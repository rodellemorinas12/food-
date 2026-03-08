const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const db = new Database('teresa_eats.db');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Upload document
router.post('/', authenticateToken, (req, res) => {
  try {
    const { merchant_id, document_type, document_name } = req.body;

    // Check if merchant belongs to user
    const merchant = db.prepare(
      'SELECT id FROM restaurants WHERE id = ? AND user_id = ?'
    ).get(merchant_id, req.user.userId);

    if (!merchant) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Handle file upload (if file is sent as base64)
    let filePath = null;
    if (req.body.file_data) {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Save file
      const fileBuffer = Buffer.from(req.body.file_data, 'base64');
      const fileName = `${Date.now()}_${document_name || document_type}`;
      filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, fileBuffer);
    }

    const result = db.prepare(`
      INSERT INTO merchant_documents (merchant_id, document_type, document_name, file_path)
      VALUES (?, ?, ?, ?)
    `).run(merchant_id, document_type, document_name, filePath);

    res.status(201).json({
      message: 'Document uploaded successfully',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get documents for merchant
router.get('/merchant/:merchantId', authenticateToken, (req, res) => {
  try {
    // Check if merchant belongs to user
    const merchant = db.prepare(
      'SELECT id FROM restaurants WHERE id = ? AND user_id = ?'
    ).get(req.params.merchantId, req.user.userId);

    if (!merchant) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const documents = db.prepare(
      'SELECT * FROM merchant_documents WHERE merchant_id = ?'
    ).all(req.params.merchantId);

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Delete document
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    // Check ownership
    const document = db.prepare(`
      SELECT d.* FROM merchant_documents d
      JOIN restaurants r ON d.merchant_id = r.id
      WHERE d.id = ? AND r.user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file if exists
    if (document.file_path && fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    db.prepare('DELETE FROM merchant_documents WHERE id = ?').run(req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
