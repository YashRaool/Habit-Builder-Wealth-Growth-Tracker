const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendCreated, sendBadRequest, sendUnauthorized } = require('../utils/response');

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const JWT_SECRET = process.env.JWT_SECRET || 'financial_habit_tracker_default_jwt_secret_key_safe_fallback_2026';

/** Generate a signed JWT for a user */
const signToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/** Sanitise and build the token+user response payload */
const authPayload = (user, token) => {
  const u = user.toJSON ? user.toJSON() : { ...user._doc };
  delete u.passwordHash;
  return { token, user: u };
};

/** POST /api/auth/register */
const register = async (req, res) => {
  try {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase().slice(0, 3) : 'USD';

    // — field-level validation —
    if (!name || !email || !password) {
      return sendBadRequest(res, 'Name, email, and password are required.');
    }
    if (name.length < 2) {
      return sendBadRequest(res, 'Name must be at least 2 characters.');
    }
    if (name.length > 60) {
      return sendBadRequest(res, 'Name cannot exceed 60 characters.');
    }
    if (!EMAIL_RE.test(email)) {
      return sendBadRequest(res, 'Please provide a valid email address.');
    }
    if (password.length < 8) {
      return sendBadRequest(res, 'Password must be at least 8 characters.');
    }
    if (!PASSWORD_RE.test(password)) {
      return sendBadRequest(res, 'Password must contain at least one uppercase letter, one lowercase letter, and one number.');
    }

    // Explicit duplicate email check
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      currency: currency || 'USD',
    });

    const token = signToken(user._id);
    return sendCreated(res, authPayload(user, token), 'Account created successfully.');
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors || {}).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') || 'Validation error.' });
    }
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Registration failed due to a server error. Please try again.' });
  }
};

/** POST /api/auth/login */
const login = async (req, res) => {
  try {
    const body = req.body || {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return sendBadRequest(res, 'Email and password are required.');
    }
    if (!EMAIL_RE.test(email)) {
      return sendBadRequest(res, 'Please provide a valid email address.');
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) {
      return sendUnauthorized(res, 'Invalid email or password.');
    }

    if (!user.isActive) {
      return sendUnauthorized(res, 'This account has been deactivated. Contact support.');
    }

    const token = signToken(user._id);
    return sendSuccess(res, authPayload(user, token), 'Login successful.');
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed due to a server error. Please try again.' });
  }
};

/** GET /api/auth/me */
const getMe = async (req, res) => {
  try {
    return sendSuccess(res, { user: req.user }, 'User profile retrieved.');
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
};

/** PUT /api/auth/me — update own profile (name, currency) */
const updateMe = async (req, res) => {
  try {
    const { name, currency } = req.body || {};
    const updates = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return sendBadRequest(res, 'Name must be at least 2 characters.');
      }
      updates.name = name.trim();
    }
    if (currency !== undefined) {
      if (typeof currency === 'string') {
        updates.currency = currency.toUpperCase().slice(0, 3);
      }
    }
    if (Object.keys(updates).length === 0) {
      return sendBadRequest(res, 'No fields to update.');
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    return sendSuccess(res, { user }, 'Profile updated.');
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

/** PUT /api/auth/password — change own password */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return sendBadRequest(res, 'Current password and new password are required.');
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return sendBadRequest(res, 'New password must be at least 8 characters.');
    }
    if (!PASSWORD_RE.test(newPassword)) {
      return sendBadRequest(res, 'New password must contain at least one uppercase letter, one lowercase letter, and one number.');
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await user.comparePassword(currentPassword))) {
      return sendBadRequest(res, 'Current password is incorrect.');
    }

    user.passwordHash = newPassword;
    await user.save();
    return sendSuccess(res, {}, 'Password updated successfully.');
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
};

module.exports = { register, login, getMe, updateMe, updatePassword };
