const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const {
  noSQLInjection, sqlInjectionGuard, xssSanitizer, fileUploadGuard,
  securityHeaders, csrfGuard, authRateLimiter, apiRateLimiter, requestQuotaCap,
} = require('./src/middleware/security');

// ── Startup env validation ──────────────────────────────────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(`[STARTUP] Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}
// ───────────────────────────────────────────────────────────────────────────

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

// Trust proxy (required for correct IP behind load balancer / reverse proxy)
app.set('trust proxy', 1);
app.disable('x-powered-by'); // redundant with securityHeaders but belt-and-suspenders

// ── HTTPS redirect in production ────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// ── Helmet (base security headers) ─────────────────────────────────────────
app.use(helmet());

// ── Response compression (gzip/br — cuts payload ~70% at scale) ────────────
app.use(compression({ threshold: 1024 }));

// ── Custom security headers + CSRF guard ───────────────────────────────────
app.use(securityHeaders);
app.use(csrfGuard);

// ── CORS — explicit allowlist ────────────────────────────────────────────────
const CORS_ALLOWLIST = [
  'http://localhost:5173',
  'https://yashraool.github.io',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
];
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server (no origin) and listed origins
    if (!origin || CORS_ALLOWLIST.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Circuit-breaker / quota cap (all traffic) ──────────────────────────────
app.use(requestQuotaCap);

// ── Auth-specific rate limiter ─────────────────────────────────────────────
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api/auth/google', authRateLimiter);

// ── General API rate limiter ───────────────────────────────────────────────
app.use('/api/', apiRateLimiter);

// ── Body parsing (100 kb limit) ────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ── Input security middleware ──────────────────────────────────────────────
app.use(noSQLInjection);
app.use(sqlInjectionGuard);
app.use(xssSanitizer);
app.use(fileUploadGuard);

// ── Logging in development ─────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('dev'));
}

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    dbState: dbStates[require('mongoose').connection.readyState] || 'unknown',
    timestamp: new Date(),
  });
});

// ── Mount routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/wealth', wealthRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 API handler ─────────────────────────────────────────────────────────
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Serve React build in production ────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (_req, res) =>
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'))
  );
}

// ── Global error handler ────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

// ── Graceful shutdown (SIGTERM / SIGINT) ────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n[${signal}] Graceful shutdown initiated…`);
  server.close(() => {
    require('mongoose').connection.close(false, () => {
      console.log('✅ MongoDB connection closed. Exiting.');
      process.exit(0);
    });
  });
  // Force exit after 10 s if still pending
  setTimeout(() => { console.error('⚠️  Forced exit after timeout.'); process.exit(1); }, 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

module.exports = app;
