const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendBadRequest, sendNotFound } = require('../utils/response');

/** GET /api/users/:id */
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendNotFound(res, 'User not found.');
  // Users can only view their own profile unless admin
  if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
    return sendNotFound(res, 'User not found.');
  }
  sendSuccess(res, { user });
});

/** PUT /api/users/:id — update name or currency */
const updateUser = asyncHandler(async (req, res) => {
  if (req.user._id.toString() !== req.params.id) {
    return sendNotFound(res, 'User not found.');
  }
  const { name, currency } = req.body;
  const updates = {};
  if (name) updates.name = name.trim();
  if (currency) updates.currency = currency.toUpperCase().slice(0, 3);

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  sendSuccess(res, { user }, 'Profile updated.');
});

/** PUT /api/users/:id/password */
const updatePassword = asyncHandler(async (req, res) => {
  if (req.user._id.toString() !== req.params.id) {
    return sendNotFound(res, 'User not found.');
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return sendBadRequest(res, 'Current and new password are required.');
  }
  if (newPassword.length < 8) {
    return sendBadRequest(res, 'New password must be at least 8 characters.');
  }

  const user = await User.findById(req.params.id).select('+passwordHash');
  if (!(await user.comparePassword(currentPassword))) {
    return sendBadRequest(res, 'Current password is incorrect.');
  }

  user.passwordHash = newPassword;
  await user.save();
  sendSuccess(res, {}, 'Password updated successfully.');
});

module.exports = { getUser, updateUser, updatePassword };
