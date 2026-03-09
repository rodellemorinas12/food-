const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Import routes
const authRoutes = require("./backend/routes/auth");
const restaurantRoutes = require("./backend/routes/restaurants");
const menuRoutes = require("./backend/routes/menu");
const orderRoutes = require("./backend/routes/orders");
const riderRoutes = require("./backend/routes/riders");

const app = express();
const server = http.createServer(app);

// Socket.io for real-time updates
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root route
app.get("/", (req, res) => {
  res.send("Food Delivery Backend API is running 🚀");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu-items", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/riders", riderRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Food Delivery API is running" });
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  
  // Join room based on role
  socket.on("join", (data) => {
    const { role, userId } = data;
    socket.join(role);
    if (userId) {
      socket.join(`user_${userId}`);
    }
    console.log(`Socket ${socket.id} joined ${role} room`);
  });
  
  // Order placed - notify merchants and admin
  socket.on("order_placed", (order) => {
    io.to("merchant").emit("new_order", order);
    io.to("admin").emit("new_order", order);
  });
  
  // Order status updated - notify customer
  socket.on("order_status_update", (data) => {
    const { orderId, status, userId } = data;
    io.to(`user_${userId}`).emit("order_status_changed", { orderId, status });
  });
  
  // Rider location update
  socket.on("rider_location", (data) => {
    const { orderId, latitude, longitude } = data;
    io.to(`user_${orderId}`).emit("rider_location_update", { latitude, longitude });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Make io accessible to routes
app.set("io", io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access from other devices at: http://YOUR_LOCAL_IP:${PORT}`);
});
