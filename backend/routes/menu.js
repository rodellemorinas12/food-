const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all menu items (public)
router.get("/", (req, res) => {
  db.query("SELECT * FROM menu_items", (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching menu items", error: err.message });
    }
    res.json(result);
  });
});

// Get menu items by restaurant (public)
router.get("/public/restaurant/:restaurantId", (req, res) => {
  db.query(
    "SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = TRUE ORDER BY category, name",
    [req.params.restaurantId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching menu items", error: err.message });
      }
      res.json(result);
    }
  );
});

// Get menu item by ID
router.get("/:id", (req, res) => {
  db.query(
    "SELECT * FROM menu_items WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error fetching menu item", error: err.message });
      }
      if (result.length === 0) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      res.json(result[0]);
    }
  );
});

// Create menu item
router.post("/", (req, res) => {
  const { restaurant_id, name, description, price, image_url, category, is_available } = req.body;
  
  db.query(
    "INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category, is_available) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [restaurant_id, name, description, price, image_url, category, is_available !== false],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error creating menu item", error: err.message });
      }
      res.status(201).json({ message: "Menu item created", id: result.insertId });
    }
  );
});

// Update menu item
router.put("/:id", (req, res) => {
  const { name, description, price, image_url, category, is_available } = req.body;
  
  db.query(
    "UPDATE menu_items SET name = ?, description = ?, price = ?, image_url = ?, category = ?, is_available = ? WHERE id = ?",
    [name, description, price, image_url, category, is_available, req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error updating menu item", error: err.message });
      }
      res.json({ message: "Menu item updated" });
    }
  );
});

// Delete menu item
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM menu_items WHERE id = ?", [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error deleting menu item", error: err.message });
    }
    res.json({ message: "Menu item deleted" });
  });
});

module.exports = router;
