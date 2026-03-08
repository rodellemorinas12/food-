// Input validation utilities

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const re = /^[\d\s\-\+\(\)]{10,}$/;
  return re.test(phone);
};

const validatePassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};

const validateName = (name) => {
  return name && name.trim().length >= 2;
};

const validatePrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0;
};

const validateQuantity = (quantity) => {
  const num = parseInt(quantity);
  return !isNaN(num) && num > 0;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

const validateOrderData = (data) => {
  const errors = [];
  
  if (!data.user_id) errors.push('User ID is required');
  if (!data.restaurant_id) errors.push('Restaurant ID is required');
  if (!data.address) errors.push('Address is required');
  if (!data.total) errors.push('Total is required');
  if (data.total < 0) errors.push('Total must be positive');
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Order must have at least one item');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateEmail,
  validatePhone,
  validatePassword,
  validateName,
  validatePrice,
  validateQuantity,
  sanitizeInput,
  validateOrderData
};
