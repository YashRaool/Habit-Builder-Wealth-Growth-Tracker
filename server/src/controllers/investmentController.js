const Investment = require('../models/Investment');
const { asyncHandler } = require('../middleware/errorHandler');

const formatInvestment = (inv) => ({
  id: inv._id.toString(),
  _id: inv._id.toString(),
  type: inv.type,
  name: inv.name,
  value: Number(inv.value) || 0,
  created_at: inv.createdAt,
  createdAt: inv.createdAt,
});

/** GET /api/investments */
const getInvestments = asyncHandler(async (req, res) => {
  const records = await Investment.find({ userId: req.user._id }).sort('type name');
  const rows = records.map(formatInvestment);

  const summary = rows.reduce(
    (acc, item) => {
      if (item.type === 'cash') acc.cash_total += item.value;
      else if (item.type === 'investment') acc.investment_total += item.value;
      else if (item.type === 'asset') acc.asset_total += item.value;
      acc.net_worth += item.value;
      return acc;
    },
    { cash_total: 0, investment_total: 0, asset_total: 0, net_worth: 0 }
  );

  res.json({ data: rows, summary });
});

/** POST /api/investments */
const createInvestment = asyncHandler(async (req, res) => {
  const { type, name, value } = req.body || {};
  if (!type || !name || value === undefined || Number(value) < 0) {
    return res.status(400).json({ errors: ['Type, name, and valid value are required'] });
  }

  const allowedTypes = ['cash', 'investment', 'asset'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ errors: ['Type must be cash, investment, or asset'] });
  }

  const investment = await Investment.create({
    userId: req.user._id,
    type,
    name: name.trim(),
    value: Number(value),
  });

  res.status(201).json(formatInvestment(investment));
});

/** PUT /api/investments/:id */
const updateInvestment = asyncHandler(async (req, res) => {
  const { type, name, value } = req.body || {};
  const updates = {};
  if (type) updates.type = type;
  if (name) updates.name = name.trim();
  if (value !== undefined) updates.value = Number(value);

  const investment = await Investment.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!investment) return res.status(404).json({ error: 'Investment not found' });
  res.json(formatInvestment(investment));
});

/** DELETE /api/investments/:id */
const deleteInvestment = asyncHandler(async (req, res) => {
  const investment = await Investment.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!investment) return res.status(404).json({ error: 'Investment not found' });
  res.status(204).end();
});

module.exports = {
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
};
