const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { validationResult } = require('express-validator');
const winston = require('winston');
require('dotenv').config();
const { initializeDatabase } = require('./init');
const routes = require('./routes');
const authRoutes = require('./routes-auth');
const commissionsRoutes = require('./routes-commissions');
const calendarRoutes = require('./routes-calendar');
const riderRoutes = require('./routes-riders');
const merchantRoutes = require('./routes-merchants');
const merchantPortalRoutes = require('./routes-merchant-portal');

const app = express();

// ===== WINSTON LOGGER SETUP =====
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// ===== RATE LIMITING =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (increased from 500)
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== MIDDLEWARE =====
app.use(helmet()); // Security headers
// ===== CORS CONFIGURATION =====
// Get allowed origins from environment variable, split by comma
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173']; // Default to localhost development

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // In production, you might want to require origins
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(limiter); // Apply rate limiting

// Request logging middleware
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

// ===== ERROR HANDLING =====
const handleErrors = (err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api', routes);
app.use('/api', authRoutes);
app.use('/api', commissionsRoutes);
app.use('/api', calendarRoutes);
app.use('/api', riderRoutes);
app.use('/api', merchantRoutes);
app.use('/api', merchantPortalRoutes);

// Error handler
app.use(handleErrors);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`✓ Server running on http://localhost:${PORT}`);
      logger.info(`✓ API Base: http://localhost:${PORT}/api`);
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

// Export for testing
module.exports = app;
