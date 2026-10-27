const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Habit = require('../models/Habit');
const SavingsGoal = require('../models/SavingsGoal');
const Feedback = require('../models/Feedback');
const Investment = require('../models/Investment');
const { asyncHandler } = require('../middleware/errorHandler');

const formatUser = (u) => ({
  id: u._id.toString(),
  _id: u._id.toString(),
  name: u.name,
  email: u.email,
  role: u.role,
  created_at: u.createdAt,
  createdAt: u.createdAt,
});

const formatFeedback = (f) => ({
  id: f._id.toString(),
  _id: f._id.toString(),
  user_name: f.userId ? f.userId.name : 'Anonymous User',
  user_email: f.userId ? f.userId.email : '',
  message: f.message || f.subject || '',
  status: f.status || 'open',
  created_at: f.createdAt,
  createdAt: f.createdAt,
});

/** GET /api/admin/stats (and /metrics) */
const getStats = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalIncomeAgg,
    totalExpensesAgg,
    habits,
    goals,
    feedbackOpen,
    feedbackTotal,
  ] = await Promise.all([
    User.countDocuments(),
    Transaction.aggregate([
      { $match: { type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Habit.find({}),
    SavingsGoal.find({}),
    Feedback.countDocuments({ status: 'open' }),
    Feedback.countDocuments(),
  ]);

  const totalIncome = totalIncomeAgg[0]?.total || 0;
  const totalExpenses = totalExpensesAgg[0]?.total || 0;

  // Habit metrics
  let totalLogs = 0;
  let completedLogs = 0;
  habits.forEach((h) => {
    (h.logs || []).forEach((l) => {
      totalLogs++;
      if (l.completed) completedLogs++;
    });
  });
  const habitCompletionRate = totalLogs > 0 ? Number(((completedLogs / totalLogs) * 100).toFixed(1)) : 0;

  // Goals metrics
  let avgGoalCompletion = 0;
  if (goals.length > 0) {
    const totalPct = goals.reduce((sum, g) => {
      const tgt = Number(g.targetAmount) || 1;
      const cur = Number(g.currentAmount) || 0;
      return sum + Math.min(100, (cur / tgt) * 100);
    }, 0);
    avgGoalCompletion = Number((totalPct / goals.length).toFixed(1));
  }

  res.json({
    user_count: totalUsers,
    active_users: totalUsers,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    habit_count: habits.length,
    habit_completion_rate: habitCompletionRate,
    total_habit_logs: totalLogs,
    goal_count: goals.length,
    avg_goal_completion: avgGoalCompletion,
    feedback_open: feedbackOpen,
    feedback_total: feedbackTotal,
  });
});

/** GET /api/admin/users */
const getUsers = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const page = Math.max(1, Number(req.query.page) || 1);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const s = req.query.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ data: users.map(formatUser), total });
});

/** PATCH /api/admin/users/:id/role */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body || {};
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ errors: ['Role must be user or admin'] });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(formatUser(user));
});

/** DELETE /api/admin/users/:id */
const deleteUser = asyncHandler(async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    return res.status(400).json({ error: 'Cannot delete your own admin account' });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Cleanup user records
  await Promise.all([
    Transaction.deleteMany({ userId: user._id }),
    Habit.deleteMany({ userId: user._id }),
    SavingsGoal.deleteMany({ userId: user._id }),
    Investment.deleteMany({ userId: user._id }),
    Feedback.deleteMany({ userId: user._id }),
  ]);

  res.status(204).end();
});

/** GET /api/admin/feedback — returns raw array of feedback */
const getFeedback = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }

  const feedback = await Feedback.find(filter)
    .populate('userId', 'name email')
    .sort('-createdAt');

  res.json(feedback.map(formatFeedback));
});

/** PATCH /api/admin/feedback/:id */
const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!['open', 'resolved', 'in_progress'].includes(status)) {
    return res.status(400).json({ errors: ['Status must be open, resolved, or in_progress'] });
  }

  const fb = await Feedback.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate('userId', 'name email');

  if (!fb) return res.status(404).json({ error: 'Feedback not found' });
  res.json(formatFeedback(fb));
});

/** POST /api/admin/feedback — user feedback submission */
const createFeedback = asyncHandler(async (req, res) => {
  const message = (req.body.message || req.body.subject || '').trim();
  if (!message) {
    return res.status(400).json({ errors: ['Message is required'] });
  }

  const fb = await Feedback.create({
    userId: req.user._id,
    subject: message.slice(0, 50),
    message,
    status: 'open',
  });

  res.status(201).json(formatFeedback(fb));
});

module.exports = {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getFeedback,
  updateFeedbackStatus,
  createFeedback,
};
