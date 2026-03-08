const restaurantModel = require('../models/restaurantModel');

// Get all restaurants (public)
exports.getAll = async (req, res) => {
  try {
    const restaurants = await restaurantModel.getApproved();
    res.json(restaurants);
  } catch (err) {
    console.error('Get restaurants error:', err);
    res.status(500).json({ message: 'Error getting restaurants' });
  }
};

// Get restaurant by ID
exports.getById = async (req, res) => {
  try {
    const restaurant = await restaurantModel.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (err) {
    console.error('Get restaurant error:', err);
    res.status(500).json({ message: 'Error getting restaurant' });
  }
};

// Search restaurants
exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }
    const restaurants = await restaurantModel.search(q);
    res.json(restaurants);
  } catch (err) {
    console.error('Search restaurants error:', err);
    res.status(500).json({ message: 'Error searching restaurants' });
  }
};

// Create restaurant (merchant)
exports.create = async (req, res) => {
  try {
    const { name, address, description, image } = req.body;
    const restaurant = await restaurantModel.create({
      merchant_id: req.user.id,
      name,
      address,
      description,
      image,
      status: 'pending'
    });
    res.status(201).json({ message: 'Restaurant created successfully', id: restaurant.insertId });
  } catch (err) {
    console.error('Create restaurant error:', err);
    res.status(500).json({ message: 'Error creating restaurant' });
  }
};

// Update restaurant
exports.update = async (req, res) => {
  try {
    const { name, address, description, image, status } = req.body;
    await restaurantModel.update(req.params.id, {
      name,
      address,
      description,
      image,
      status
    });
    res.json({ message: 'Restaurant updated successfully' });
  } catch (err) {
    console.error('Update restaurant error:', err);
    res.status(500).json({ message: 'Error updating restaurant' });
  }
};

// Delete restaurant
exports.delete = async (req, res) => {
  try {
    await restaurantModel.delete(req.params.id);
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (err) {
    console.error('Delete restaurant error:', err);
    res.status(500).json({ message: 'Error deleting restaurant' });
  }
};

// Get my restaurants (merchant)
exports.getMyRestaurants = async (req, res) => {
  try {
    const restaurants = await restaurantModel.getByMerchant(req.user.id);
    res.json(restaurants);
  } catch (err) {
    console.error('Get my restaurants error:', err);
    res.status(500).json({ message: 'Error getting restaurants' });
  }
};
