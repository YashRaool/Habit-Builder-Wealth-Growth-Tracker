const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendCreated, sendBadRequest, sendNotFound, sendPaginated } = require('../utils/response');

/** GET /api/transactions — paginated, filtered, sorted */
const getTransactions = asyncHandler(async (req, res) => {
  const { type, category, startDate, endDate, search, page = 1, limit = 20, sort = '-date' } = req.query;

  const filter = { userId: req.user._id };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  if (search) {
    filter.$or = [
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Transaction.countDocuments(filter),
  ]);

  sendPaginated(res, transactions, total, page, limit);
});

/** GET /api/transactions/summary — monthly totals */
const getSummary = asyncHandler(async (req, res) => {
  const { months = 6 } = req.query;
  const since = new Date();
  since.setMonth(since.getMonth() - Number(months));

  const pipeline = [
    { $match: { userId: req.user._id, date: { $gte: since } } },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ];

  const raw = await Transaction.aggregate(pipeline);

  // Pivot into { month, income, expense } array
  const map = {};
  for (const r of raw) {
    const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
    if (!map[key]) map[key] = { month: key, income: 0, expense: 0 };
    map[key][r._id.type] = r.total;
  }

  sendSuccess(res, { summary: Object.values(map) });
});

/** GET /api/transactions/:id */
const getTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
  if (!tx) return sendNotFound(res, 'Transaction not found.');
  sendSuccess(res, { transaction: tx });
});

/** POST /api/transactions */
const createTransaction = asyncHandler(async (req, res) => {
  const { type, category, amount, date, description, isRecurring } = req.body;
  if (!type || !category || !amount) {
    return sendBadRequest(res, 'Type, category, and amount are required.');
  }
  const tx = await Transaction.create({
    userId: req.user._id, type, category, amount, date, description, isRecurring,
  });
  sendCreated(res, { transaction: tx }, 'Transaction added.');
});

/** PUT /api/transactions/:id */
const updateTransaction = asyncHandler(async (req, res) => {
  const { type, category, amount, date, description, isRecurring } = req.body;
  const updates = { type, category, amount, date, description, isRecurring };
  Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

  const tx = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  );
  if (!tx) return sendNotFound(res, 'Transaction not found.');
  sendSuccess(res, { transaction: tx }, 'Transaction updated.');
});

/** DELETE /api/transactions/:id */
const deleteTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!tx) return sendNotFound(res, 'Transaction not found.');
  sendSuccess(res, {}, 'Transaction deleted.');
});

module.exports = { getTransactions, getSummary, getTransaction, createTransaction, updateTransaction, deleteTransaction };
