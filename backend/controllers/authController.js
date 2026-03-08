const userModel = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { generateToken } = require('../utils/jwt');

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create user
    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'customer'
    });

    // Generate token
    const token = generateToken({
      id: user.insertId,
      email,
      role: role || 'customer',
      name
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.insertId, name, email, role: role || 'customer' }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    if (!comparePassword(password, user.password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Error logging in' });
  }
};

// Get current user
exports.me = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Error getting user' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    await userModel.update(req.user.id, { name, phone, email });
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user
    const user = await userModel.findById(req.user.id);
    if (!comparePassword(currentPassword, user.password)) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    const hashedPassword = hashPassword(newPassword);
    await userModel.updatePassword(req.user.id, hashedPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Error changing password' });
  }
};

// Logout (client-side token removal, but we can log it)
exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};
