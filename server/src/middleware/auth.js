const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendUnauthorized } = require('../utils/response');

/** Verifies JWT token and attaches the user to req.user */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendUnauthorized(res, 'No token provided. Please log in.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return sendUnauthorized(res, 'User no longer exists.');
    }

    if (!user.isActive) {
      return sendUnauthorized(res, 'This account has been deactivated. Contact support.');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Your session has expired. Please log in again.');
    }
    return sendUnauthorized(res, 'Invalid or expired token.');
  }
};

module.exports = { protect };

