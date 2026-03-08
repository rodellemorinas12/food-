const orderModel = require('../models/orderModel');
const restaurantModel = require('../models/restaurantModel');
const riderModel = require('../models/riderModel');

const orderService = {
  // Create order with items
  createOrder: async (orderData, items) => {
    // Generate order number
    const orderNumber = 'ORD' + Date.now();
    
    // Create order
    const result = await orderModel.create({ ...orderData, order_number: orderNumber });
    const orderId = result.insertId;
    
    // Add order items
    await orderModel.addItems(orderId, items);
    
    // Get complete order
    const order = await orderModel.findById(orderId);
    order.items = await orderModel.getItems(orderId);
    
    return order;
  },

  // Accept order by restaurant
  acceptOrder: async (orderId) => {
    return await orderModel.updateStatus(orderId, 'accepted');
  },

  // Start preparing order
  startPreparing: async (orderId) => {
    return await orderModel.updateStatus(orderId, 'preparing');
  },

  // Mark as ready for pickup
  markReady: async (orderId) => {
    return await orderModel.updateStatus(orderId, 'ready');
  },

  // Assign rider to order
  assignRider: async (orderId, riderId) => {
    return await orderModel.assignRider(orderId, riderId);
  },

  // Pick up order
  pickupOrder: async (orderId) => {
    return await orderModel.updateStatus(orderId, 'picked_up');
  },

  // Complete delivery
  completeDelivery: async (orderId) => {
    return await orderModel.updateStatus(orderId, 'delivered');
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    return await orderModel.cancel(orderId);
  },

  // Find nearest rider
  findNearestRider: async (restaurantLat, restaurantLng) => {
    // Get nearby online riders
    const riders = await riderModel.getNearby(restaurantLat, restaurantLng, 10);
    
    if (riders.length === 0) {
      // Get any online rider if none nearby
      return await riderModel.getOnline();
    }
    
    return riders[0]; // Return nearest
  },

  // Get order details with items
  getOrderDetails: async (orderId) => {
    const order = await orderModel.findById(orderId);
    if (order) {
      order.items = await orderModel.getItems(orderId);
    }
    return order;
  }
};

module.exports = orderService;
