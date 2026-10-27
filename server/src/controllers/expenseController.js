const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');

const formatExpense = (t) => ({
  id: t._id.toString(),
  _id: t._id.toString(),
  category: t.category,
  amount: Number(t.amount) || 0,
  date: t.date ? t.date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  note: t.description || '',
  created_at: t.createdAt,
  createdAt: t.createdAt,
});

/** GET /api/expenses */
const getExpenses = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const page = Math.max(1, Number(req.query.page) || 1);
  const skip = (page - 1) * limit;
  const filter = { userId: req.user._id, type: 'expense' };

  if (req.query.category && req.query.category !== 'All') {
    filter.category = req.query.category;
  }

  const [records, total] = await Promise.all([
    Transaction.find(filter)
      .sort('-date -createdAt')
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  const rows = records.map(formatExpense);
  res.json({ data: rows, total });
});

/** GET /api/expenses/summary — monthly category totals */
const getExpensesSummary = asyncHandler(async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const summary = await Transaction.aggregate([
    {
      $match: {
        userId: req.user._id,
        type: 'expense',
        date: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  res.json(summary.map((s) => ({ category: s._id, total: s.total })));
});

/** POST /api/expenses */
const createExpense = asyncHandler(async (req, res) => {
  const { category, amount, date, note, description } = req.body || {};
  const cat = (category || 'Other').trim();
  const amt = Number(amount);

  if (!cat || !amt || amt <= 0) {
    return res.status(400).json({ errors: ['Category and positive amount are required'] });
  }

  const transaction = await Transaction.create({
    userId: req.user._id,
    type: 'expense',
    category: cat,
    amount: amt,
    date: date ? new Date(date) : new Date(),
    description: (note || description || '').trim(),
  });

  res.status(201).json(formatExpense(transaction));
});

/** PUT /api/expenses/:id */
const updateExpense = asyncHandler(async (req, res) => {
  const { category, amount, date, note, description } = req.body || {};
  const updates = {};
  if (category) updates.category = category.trim();
  if (amount !== undefined) updates.amount = Number(amount);
  if (date !== undefined) updates.date = new Date(date);
  if (note !== undefined || description !== undefined) {
    updates.description = (note || description || '').trim();
  }

  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, type: 'expense' },
    updates,
    { new: true, runValidators: true }
  );

  if (!transaction) return res.status(404).json({ error: 'Expense record not found' });
  res.json(formatExpense(transaction));
});

/** DELETE /api/expenses/:id */
const deleteExpense = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
    type: 'expense',
  });

  if (!transaction) return res.status(404).json({ error: 'Expense record not found' });
  res.status(204).end();
});

module.exports = {
  getExpenses,
  getExpensesSummary,
  createExpense,
  updateExpense,
  deleteExpense,
};
