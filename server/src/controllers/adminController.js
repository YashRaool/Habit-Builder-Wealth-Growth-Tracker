const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Habit = require('../models/Habit');
const SavingsGoal = require('../models/SavingsGoal');
const Feedback = require('../models/Feedback');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendNotFound, sendBadRequest } = require('../utils/response');

/** GET /api/admin/metrics — platform overview */
const getMetrics = asyncHandler(async (_req, res) => {
  const [totalUsers, totalTransactions, totalHabits, totalGoals, openFeedback] = await Promise.all([
    User.countDocuments(),
    Transaction.countDocuments(),
    Habit.countDocuments(),
    SavingsGoal.countDocuments(),
    Feedback.countDocuments({ status: 'open' }),
  ]);

  // New users this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

  sendSuccess(res, { totalUsers, totalTransactions, totalHabits, totalGoals, openFeedback, newUsersThisMonth });
});

/** GET /api/admin/users */
const getUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search && typeof search === 'string') {
    const safeSearch = search.trim();
    if (safeSearch) {
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ];
    }
  }

  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 20);
  const skip = (p - 1) * l;
  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(l),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { users },
    pagination: { total, page: p, limit: l, pages: Math.ceil(total / l) || 1 },
  });
});

/** PUT /api/admin/users/:id — change role or status */
const updateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body || {};
  const updates = {};
  if (role) {
    if (!['user', 'admin'].includes(role)) return sendBadRequest(res, 'Invalid user role.');
    updates.role = role;
  }
  if (isActive !== undefined) {
    updates.isActive = Boolean(isActive);
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!user) return sendNotFound(res, 'User not found.');
  sendSuccess(res, { user }, 'User status updated successfully.');
});

/** DELETE /api/admin/users/:id — delete a user and their data */
const deleteUser = asyncHandler(async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    return sendBadRequest(res, 'You cannot delete your own account.');
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return sendNotFound(res, 'User not found.');
  
  // Clean up user data
  await Promise.all([
    Transaction.deleteMany({ userId: user._id }),
    Habit.deleteMany({ userId: user._id }),
    SavingsGoal.deleteMany({ userId: user._id }),
    Feedback.deleteMany({ userId: user._id }),
  ]);

  sendSuccess(res, {}, 'User and associated data deleted successfully.');
});

/** GET /api/admin/feedback */
const getFeedback = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 20);
  const skip = (p - 1) * l;
  const [feedback, total] = await Promise.all([
    Feedback.find(filter).populate('userId', 'name email').sort('-createdAt').skip(skip).limit(l),
    Feedback.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { feedback },
    pagination: { total, page: p, limit: l, pages: Math.ceil(total / l) || 1 },
  });
});

/** PUT /api/admin/feedback/:id */
const updateFeedback = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body || {};
  if (!status) return sendBadRequest(res, 'Status is required.');

  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { status, ...(adminNote !== undefined && { adminNote: String(adminNote) }) },
    { new: true }
  ).populate('userId', 'name email');
  if (!feedback) return sendNotFound(res, 'Feedback not found.');
  sendSuccess(res, { feedback }, 'Feedback ticket updated successfully.');
});

/** POST /api/admin/feedback — users submit feedback */
const createFeedback = asyncHandler(async (req, res) => {
  const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!subject || !message) {
    return sendBadRequest(res, 'Subject and message are required.');
  }
  const feedback = await Feedback.create({
    userId: req.user._id,
    subject,
    message,
    status: 'open',
  });
  sendSuccess(res, { feedback }, 'Feedback submitted successfully. Thank you!', 201);
});

module.exports = { getMetrics, getUsers, updateUser, deleteUser, getFeedback, updateFeedback, createFeedback };
