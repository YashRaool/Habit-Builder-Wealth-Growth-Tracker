const SavingsGoal = require('../models/SavingsGoal');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendCreated, sendBadRequest, sendNotFound } = require('../utils/response');

/** GET /api/goals */
const getGoals = asyncHandler(async (req, res) => {
  const { status } = req.query; // 'active' | 'completed'
  const filter = { userId: req.user._id };
  if (status === 'active') filter.isCompleted = false;
  if (status === 'completed') filter.isCompleted = true;
  const goals = await SavingsGoal.find(filter).sort('-createdAt');
  sendSuccess(res, { goals });
});

/** GET /api/goals/:id */
const getGoal = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!goal) return sendNotFound(res, 'Goal not found.');
  sendSuccess(res, { goal });
});

/** POST /api/goals */
const createGoal = asyncHandler(async (req, res) => {
  const { title, targetAmount, deadline, category, color, icon } = req.body;
  if (!title || !targetAmount) return sendBadRequest(res, 'Title and target amount are required.');
  const goal = await SavingsGoal.create({ userId: req.user._id, title, targetAmount, deadline, category, color, icon });
  sendCreated(res, { goal }, 'Goal created.');
});

/** PUT /api/goals/:id */
const updateGoal = asyncHandler(async (req, res) => {
  // Prevent mass assignment of sensitive/computed fields
  delete req.body.userId;
  delete req.body.currentAmount;
  delete req.body.isCompleted;
  delete req.body.completedAt;
  delete req.body.contributions;

  const goal = await SavingsGoal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!goal) return sendNotFound(res, 'Goal not found.');
  sendSuccess(res, { goal }, 'Goal updated.');
});

/** DELETE /api/goals/:id */
const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!goal) return sendNotFound(res, 'Goal not found.');
  sendSuccess(res, {}, 'Goal deleted.');
});

/** POST /api/goals/:id/contribute */
const contribute = asyncHandler(async (req, res) => {
  const { amount, note } = req.body;
  if (!amount || amount <= 0) return sendBadRequest(res, 'Contribution amount must be positive.');

  const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!goal) return sendNotFound(res, 'Goal not found.');
  if (goal.isCompleted) return sendBadRequest(res, 'This goal is already completed.');

  goal.contributions.push({ amount, note });
  goal.currentAmount = Math.min(goal.currentAmount + Number(amount), goal.targetAmount);
  await goal.save(); // pre-save hook checks completion

  sendSuccess(res, { goal }, 'Contribution added.');
});

module.exports = { getGoals, getGoal, createGoal, updateGoal, deleteGoal, contribute };
