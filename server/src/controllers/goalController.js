const SavingsGoal = require('../models/SavingsGoal');
const { asyncHandler } = require('../middleware/errorHandler');

const formatGoal = (g) => ({
  id: g._id.toString(),
  _id: g._id.toString(),
  name: g.title,
  title: g.title,
  target_amount: g.targetAmount || 0,
  targetAmount: g.targetAmount || 0,
  current_amount: g.currentAmount || 0,
  currentAmount: g.currentAmount || 0,
  target_date: g.deadline ? new Date(g.deadline).toISOString().slice(0, 10) : null,
  deadline: g.deadline || null,
  is_completed: Boolean(g.isCompleted),
  isCompleted: Boolean(g.isCompleted),
  created_at: g.createdAt,
  createdAt: g.createdAt,
});

/** GET /api/goals — returns raw array for Orange UI */
const getGoals = asyncHandler(async (req, res) => {
  const { status } = req.query; // 'active' | 'completed'
  const filter = { userId: req.user._id };
  if (status === 'active') filter.isCompleted = false;
  if (status === 'completed') filter.isCompleted = true;

  const goals = await SavingsGoal.find(filter).sort('createdAt');
  res.json(goals.map(formatGoal));
});

/** GET /api/goals/:id */
const getGoal = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  res.json(formatGoal(goal));
});

/** POST /api/goals */
const createGoal = asyncHandler(async (req, res) => {
  const title = (req.body.name || req.body.title || '').trim();
  const targetAmount = Number(req.body.target_amount ?? req.body.targetAmount);
  const currentAmount = Number(req.body.current_amount ?? req.body.currentAmount) || 0;
  const deadlineStr = req.body.target_date || req.body.deadline;

  if (!title || !targetAmount || targetAmount <= 0) {
    return res.status(400).json({ errors: ['Goal name and positive target amount are required'] });
  }

  const goal = await SavingsGoal.create({
    userId: req.user._id,
    title,
    targetAmount,
    currentAmount,
    deadline: deadlineStr ? new Date(deadlineStr) : null,
  });

  res.status(201).json(formatGoal(goal));
});

/** PUT /api/goals/:id */
const updateGoal = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name || req.body.title) {
    updates.title = (req.body.name || req.body.title).trim();
  }
  if (req.body.target_amount !== undefined || req.body.targetAmount !== undefined) {
    updates.targetAmount = Number(req.body.target_amount ?? req.body.targetAmount);
  }
  if (req.body.current_amount !== undefined || req.body.currentAmount !== undefined) {
    updates.currentAmount = Number(req.body.current_amount ?? req.body.currentAmount);
  }
  if (req.body.target_date !== undefined || req.body.deadline !== undefined) {
    const d = req.body.target_date || req.body.deadline;
    updates.deadline = d ? new Date(d) : null;
  }

  const goal = await SavingsGoal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  res.json(formatGoal(goal));
});

/** PATCH /api/goals/:id/deposit — add deposit to savings goal */
const deposit = asyncHandler(async (req, res) => {
  const amt = Number(req.body.amount);
  if (!amt || amt <= 0) {
    return res.status(400).json({ errors: ['Deposit amount must be positive'] });
  }

  const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  goal.currentAmount = Math.min((goal.currentAmount || 0) + amt, goal.targetAmount);
  goal.contributions.push({ amount: amt, date: new Date(), note: req.body.note || 'Deposit' });

  if (goal.currentAmount >= goal.targetAmount) {
    goal.isCompleted = true;
    goal.completedAt = new Date();
  }

  await goal.save();
  res.json(formatGoal(goal));
});

/** DELETE /api/goals/:id */
const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  res.status(204).end();
});

module.exports = {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deposit,
  deleteGoal,
};
