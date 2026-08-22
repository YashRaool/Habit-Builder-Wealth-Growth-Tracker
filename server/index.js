require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const transactionRoutes = require('./src/routes/transactions');
const habitRoutes = require('./src/routes/habits');
const goalRoutes = require('./src/routes/goals');
const wealthRoutes = require('./src/routes/wealth');
const adminRoutes = require('./src/routes/admin');

// Connect to MongoDB
connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting — auth endpoints: 15 req/15min; all other /api/: 300 req/15min
const limiterBase = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});
app.use('/api/auth', limiterAuth);
app.use('/api/', limiterBase);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Financial Habit Tracker API is running', timestamp: new Date() });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/wealth', wealthRoutes);
app.use('/api/admin', adminRoutes);

// 404 API handler
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (_req, res) =>
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'))
  );
}

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
