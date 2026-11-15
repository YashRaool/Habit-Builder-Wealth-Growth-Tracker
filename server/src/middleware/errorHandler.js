/** Global Express error handler — must have 4 params */
const errorHandler = (err, req, res, _next) => {
  // Log method+path+message only — never log sensitive values or full stack in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} —`, err.message, err.stack);
  } else {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${err.message}`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join('. ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({ success: false, message: `${field} already exists.` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired.' });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid value for field: ${err.path}` });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    // In production: generic message for 500s; never expose err.stack or raw DB errors
    message: statusCode === 500 && isProd ? 'Internal server error' : err.message,
  });
};

/** Wraps async route handlers to catch promise rejections */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = errorHandler;
module.exports.asyncHandler = asyncHandler;
