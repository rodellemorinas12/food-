const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all approved restaurants (public endpoint)
router.get("/public", (req, res) => {
  db.query(
    "SELECT * FROM restaurants WHERE is_open = TRUE",
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching restaurants", error: err.message });
      }
      res.json(result);
    }
  );
});

// Get public restaurant by ID
router.get("/public/:id", (req, res) => {
  db.query(
    "SELECT * FROM restaurants WHERE id = ? AND is_open = TRUE",
    [req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching restaurant", error: err.message });
      }
      if (result.length === 0) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(result[0]);
    }
  );
});

// Get all restaurants
router.get("/", (req, res) => {
  db.query(
    "SELECT r.*, u.name as merchant_name FROM restaurants r LEFT JOIN users u ON r.merchant_id = u.id",
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching restaurants", error: err.message });
      }
      res.json(result);
    }
  );
});

// Get restaurant by ID
router.get("/:id", (req, res) => {
  db.query(
    "SELECT r.*, u.name as merchant_name FROM restaurants r LEFT JOIN users u ON r.merchant_id = u.id WHERE r.id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching restaurant", error: err.message });
      }
      if (result.length === 0) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(result[0]);
    }
  );
});

// Get restaurant menu
router.get("/:id/menu", (req, res) => {
  db.query(
    "SELECT * FROM menu_items WHERE restaurant_id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching menu", error: err.message });
      }
      res.json(result);
    }
  );
});

// Create restaurant (merchant only)
router.post("/create", (req, res) => {
  const { name, address, description, merchant_id } = req.body;
  
  db.query(
    "INSERT INTO restaurants (name, address, description, merchant_id, status) VALUES (?, ?, ?, ?, ?)",
    [name, address, description, merchant_id, "pending"],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error creating restaurant", error: err.message });
      }
      res.json({ message: "Restaurant created successfully", restaurantId: result.insertId });
    }
  );
});

// Update restaurant
router.put("/:id", (req, res) => {
  const { name, address, description, status } = req.body;
  
  db.query(
    "UPDATE restaurants SET name = ?, address = ?, description = ?, status = ? WHERE id = ?",
    [name, address, description, status, req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error updating restaurant", error: err.message });
      }
      res.json({ message: "Restaurant updated successfully" });
    }
  );
});

// Add menu item
router.post("/:id/menu", (req, res) => {
  const { name, description, price, image, category } = req.body;
  
  db.query(
    "INSERT INTO menu_items (restaurant_id, name, description, price, image, category) VALUES (?, ?, ?, ?, ?, ?)",
    [req.params.id, name, description, price, image, category],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error adding menu item", error: err.message });
      }
      res.json({ message: "Menu item added successfully", itemId: result.insertId });
    }
  );
});

// Update menu item
router.put("/:restaurantId/menu/:itemId", (req, res) => {
  const { name, description, price, image, category, available } = req.body;
  
  db.query(
    "UPDATE menu_items SET name = ?, description = ?, price = ?, image = ?, category = ?, available = ? WHERE id = ?",
    [name, description, price, image, category, available, req.params.itemId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error updating menu item", error: err.message });
      }
      res.json({ message: "Menu item updated successfully" });
    }
  );
});

// Delete menu item
router.delete("/:restaurantId/menu/:itemId", (req, res) => {
  db.query(
    "DELETE FROM menu_items WHERE id = ?",
    [req.params.itemId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error deleting menu item", error: err.message });
      }
      res.json({ message: "Menu item deleted successfully" });
    }
  );
});

module.exports = router;
