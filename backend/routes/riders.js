const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all riders (admin only)
router.get("/", (req, res) => {
  db.query(
    "SELECT id, name, email, phone, created_at FROM users WHERE role = 'rider'",
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching riders", error: err.message });
      }
      res.json(result);
    }
  );
});

// Get rider by ID
router.get("/:id", (req, res) => {
  db.query(
    "SELECT id, name, email, phone, created_at FROM users WHERE id = ? AND role = 'rider'",
    [req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching rider", error: err.message });
      }
      if (result.length === 0) {
        return res.status(404).json({ message: "Rider not found" });
      }
      res.json(result[0]);
    }
  );
});

// Get rider's statistics
router.get("/:id/stats", (req, res) => {
  db.query(
    `SELECT 
       COUNT(*) as total_deliveries,
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_deliveries
     FROM orders 
     WHERE rider_id = ?`,
    [req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching stats", error: err.message });
      }
      res.json(result[0]);
    }
  );
});

// Update rider location (for real-time tracking)
router.put("/:id/location", (req, res) => {
  const { latitude, longitude } = req.body;
  
  // Store location in a separate table or update user record
  db.query(
    "UPDATE riders SET last_lat = ?, last_lng = ?, last_update = NOW() WHERE user_id = ?",
    [latitude, longitude, req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error updating location", error: err.message });
      }
      res.json({ message: "Location updated successfully" });
    }
  );
});

// Accept delivery
router.post("/accept", (req, res) => {
  const { order_id, rider_id } = req.body;
  
  db.query(
    "UPDATE orders SET rider_id = ?, status = 'picked_up' WHERE id = ?",
    [rider_id, order_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error accepting order", error: err.message });
      }
      res.json({ message: "Order accepted successfully" });
    }
  );
});

// Update delivery status
router.put("/delivery/:orderId", (req, res) => {
  const { status } = req.body;
  
  db.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, req.params.orderId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error updating status", error: err.message });
      }
      res.json({ message: "Status updated successfully" });
    }
  );
});

module.exports = router;
