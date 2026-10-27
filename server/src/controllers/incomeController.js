const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');

const formatIncome = (t) => ({
  id: t._id.toString(),
  _id: t._id.toString(),
  source: t.category,
  category: t.category,
  amount: Number(t.amount) || 0,
  date: t.date ? t.date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  note: t.description || '',
  created_at: t.createdAt,
  createdAt: t.createdAt,
});

/** GET /api/income */
const getIncome = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const page = Math.max(1, Number(req.query.page) || 1);
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    Transaction.find({ userId: req.user._id, type: 'income' })
      .sort('-date -createdAt')
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments({ userId: req.user._id, type: 'income' }),
  ]);

  const rows = records.map(formatIncome);
  res.json({ data: rows, total });
});

/** POST /api/income */
const createIncome = asyncHandler(async (req, res) => {
  const { source, category, amount, date, note, description } = req.body || {};
  const cat = (source || category || 'Salary').trim();
  const amt = Number(amount);

  if (!cat || !amt || amt <= 0) {
    return res.status(400).json({ errors: ['Source and positive amount are required'] });
  }

  const transaction = await Transaction.create({
    userId: req.user._id,
    type: 'income',
    category: cat,
    amount: amt,
    date: date ? new Date(date) : new Date(),
    description: (note || description || '').trim(),
  });

  res.status(201).json(formatIncome(transaction));
});

/** PUT /api/income/:id */
const updateIncome = asyncHandler(async (req, res) => {
  const { source, category, amount, date, note, description } = req.body || {};
  const updates = {};
  if (source || category) updates.category = (source || category).trim();
  if (amount !== undefined) updates.amount = Number(amount);
  if (date !== undefined) updates.date = new Date(date);
  if (note !== undefined || description !== undefined) {
    updates.description = (note || description || '').trim();
  }

  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, type: 'income' },
    updates,
    { new: true, runValidators: true }
  );

  if (!transaction) return res.status(404).json({ error: 'Income record not found' });
  res.json(formatIncome(transaction));
});

/** DELETE /api/income/:id */
const deleteIncome = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
    type: 'income',
  });

  if (!transaction) return res.status(404).json({ error: 'Income record not found' });
  res.status(204).end();
});

module.exports = { getIncome, createIncome, updateIncome, deleteIncome };
