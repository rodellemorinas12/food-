const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Create new order
router.post("/create", (req, res) => {
  const { user_id, restaurant_id, items, total, address, phone } = req.body;
  
  db.query(
    "INSERT INTO orders (user_id, restaurant_id, total, address, phone, status) VALUES (?, ?, ?, ?, ?, ?)",
    [user_id, restaurant_id, total, address, phone, "pending"],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error creating order", error: err.message });
      }
      
      const orderId = result.insertId;
      
      // Insert order items
      if (items && items.length > 0) {
        const itemValues = items.map(item => [
          orderId,
          item.menu_item_id,
          item.quantity,
          item.price
        ]);
        
        db.query(
          "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES ?",
          [itemValues],
          (err2) => {
            if (err2) {
              return res.status(500).json({ message: "Error adding order items", error: err2.message });
            }
            res.json({ message: "Order created successfully", orderId });
          }
        );
      } else {
        res.json({ message: "Order created successfully", orderId });
      }
    }
  );
});

// Get all orders (admin)
router.get("/", (req, res) => {
  const { status, role, user_id } = req.query;
  
  let query = `
    SELECT o.*, r.name as restaurant_name, u.name as customer_name 
    FROM orders o 
    LEFT JOIN restaurants r ON o.restaurant_id = r.id 
    LEFT JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (status) {
    query += " AND o.status = ?";
    params.push(status);
  }
  
  if (role === "customer") {
    query += " AND o.user_id = ?";
    params.push(user_id);
  } else if (role === "merchant") {
    query += " AND o.restaurant_id = ?";
    params.push(user_id); // Using user_id to pass restaurant_id for merchant
  }
  
  query += " ORDER BY o.created_at DESC";
  
  db.query(query, params, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching orders", error: err.message });
    }
    res.json(result);
  });
});

// Get order by ID
router.get("/:id", (req, res) => {
  db.query(
    `SELECT o.*, r.name as restaurant_name, u.name as customer_name 
     FROM orders o 
     LEFT JOIN restaurants r ON o.restaurant_id = r.id 
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.id = ?`,
    [req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching order", error: err.message });
      }
      if (result.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Get order items
      db.query(
        "SELECT oi.*, m.name, m.image FROM order_items oi LEFT JOIN menu_items m ON oi.menu_item_id = m.id WHERE oi.order_id = ?",
        [req.params.id],
        (err2, items) => {
          if (err2) {
            return res.status(500).json({ message: "Error fetching order items", error: err2.message });
          }
          res.json({ ...result[0], items });
        }
      );
    }
  );
});

// Update order status
router.put("/:id/status", (req, res) => {
  const { status } = req.body;
  
  db.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error updating order", error: err.message });
      }
      res.json({ message: "Order status updated successfully" });
    }
  );
});

// Assign rider to order
router.put("/:id/assign-rider", (req, res) => {
  const { rider_id } = req.body;
  
  db.query(
    "UPDATE orders SET rider_id = ?, status = 'assigned' WHERE id = ?",
    [rider_id, req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error assigning rider", error: err.message });
      }
      res.json({ message: "Rider assigned successfully" });
    }
  );
});

// Get orders for rider
router.get("/rider/available", (req, res) => {
  db.query(
    `SELECT o.*, r.name as restaurant_name, r.address as restaurant_address
     FROM orders o
     LEFT JOIN restaurants r ON o.restaurant_id = r.id
     WHERE o.status = 'ready' OR o.status = 'accepted'
     ORDER BY o.created_at ASC`,
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching orders", error: err.message });
      }
      res.json(result);
    }
  );
});

// Get rider's assigned orders
router.get("/rider/my-orders", (req, res) => {
  const rider_id = req.query.rider_id;
  
  db.query(
    `SELECT o.*, r.name as restaurant_name, r.address as restaurant_address
     FROM orders o
     LEFT JOIN restaurants r ON o.restaurant_id = r.id
     WHERE o.rider_id = ?
     ORDER BY o.created_at DESC`,
    [rider_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching orders", error: err.message });
      }
      res.json(result);
    }
  );
});

module.exports = router;
