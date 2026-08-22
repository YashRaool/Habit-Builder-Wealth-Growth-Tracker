const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendCreated, sendBadRequest, sendUnauthorized } = require('../utils/response');

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/** Generate a signed JWT for a user */
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/** Sanitise and build the token+user response payload */
const authPayload = (user, token) => {
  const u = user.toJSON ? user.toJSON() : { ...user._doc };
  delete u.passwordHash;
  return { token, user: u };
};

/** POST /api/auth/register */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, currency } = req.body;

  // — field-level validation —
  if (!name || !email || !password) {
    return sendBadRequest(res, 'Name, email, and password are required.');
  }
  if (name.trim().length < 2) {
    return sendBadRequest(res, 'Name must be at least 2 characters.');
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

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return sendBadRequest(res, 'An account with this email already exists.');
  }

  const user = await User.create({
    name: name.trim(),
    email,
    passwordHash: password, // pre-save hook hashes it
    currency: currency || 'USD',
  });

  const token = signToken(user._id);
  sendCreated(res, authPayload(user, token), 'Account created successfully.');
});

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendBadRequest(res, 'Email and password are required.');
  }
  if (!EMAIL_RE.test(email)) {
    return sendBadRequest(res, 'Please provide a valid email address.');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    return sendUnauthorized(res, 'Invalid email or password.');
  }

  if (!user.isActive) {
    return sendUnauthorized(res, 'This account has been deactivated. Contact support.');
  }

  const token = signToken(user._id);
  sendSuccess(res, authPayload(user, token), 'Login successful.');
});

/** GET /api/auth/me */
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user }, 'User profile retrieved.');
});

/** PUT /api/auth/me — update own profile (name, currency) */
const updateMe = asyncHandler(async (req, res) => {
  const { name, currency } = req.body;
  const updates = {};
  if (name !== undefined) {
    if (name.trim().length < 2) return sendBadRequest(res, 'Name must be at least 2 characters.');
    updates.name = name.trim();
  }
  if (currency !== undefined) {
    updates.currency = currency.toUpperCase().slice(0, 3);
  }
  if (Object.keys(updates).length === 0) {
    return sendBadRequest(res, 'No fields to update.');
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  sendSuccess(res, { user }, 'Profile updated.');
});

/** PUT /api/auth/password — change own password */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return sendBadRequest(res, 'Current password and new password are required.');
  }
  if (newPassword.length < 8) {
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
  sendSuccess(res, {}, 'Password updated successfully.');
});

module.exports = { register, login, getMe, updateMe, updatePassword };
