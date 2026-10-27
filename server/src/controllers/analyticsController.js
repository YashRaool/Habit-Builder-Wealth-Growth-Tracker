const Transaction = require('../models/Transaction');
const Investment = require('../models/Investment');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/analytics/net-worth-history
 * Returns monthly net worth = cumulative income - cumulative expenses + current investments
 */
const getNetWorthHistory = asyncHandler(async (req, res) => {
  const months = Math.min(Math.max(1, Number(req.query.months) || 6), 24);
  const uid = req.user._id;

  // Calculate cutoff date
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  // Group transactions by YYYY-MM
  const transactions = await Transaction.find({
    userId: uid,
    date: { $gte: cutoff },
  });

  // Current total investments
  const investments = await Investment.find({ userId: uid });
  const totalInvestmentValue = investments.reduce((sum, inv) => sum + (Number(inv.value) || 0), 0);

  const incMap = {};
  const expMap = {};

  transactions.forEach((t) => {
    const d = new Date(t.date);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      incMap[mStr] = (incMap[mStr] || 0) + amt;
    } else if (t.type === 'expense') {
      expMap[mStr] = (expMap[mStr] || 0) + amt;
    }
  });

  const series = [];
  let cumulativeCashflow = 0;

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const inc = incMap[key] || 0;
    const exp = expMap[key] || 0;
    cumulativeCashflow += inc - exp;

    series.push({
      month: key,
      income: inc,
      expenses: exp,
      net_cashflow: inc - exp,
      net_worth: cumulativeCashflow + totalInvestmentValue,
    });
  }

  res.json(series);
});

/**
 * GET /api/analytics/breakdown
 * Returns investments by type, current month expenses by category, and 6-month savings rate
 */
const getBreakdown = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Investments grouped by type
  const investmentsGroup = await Investment.aggregate([
    { $match: { userId: uid } },
    { $group: { _id: '$type', total: { $sum: '$value' } } },
    { $sort: { total: -1 } },
  ]);

  const investments = investmentsGroup.map((g) => ({
    type: g._id,
    total: g.total,
  }));

  // 2. Expenses by category this month
  const expensesGroup = await Transaction.aggregate([
    {
      $match: {
        userId: uid,
        type: 'expense',
        date: { $gte: currentMonthStart },
      },
    },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);

  const expensesByCategory = expensesGroup.map((g) => ({
    category: g._id,
    total: g.total,
  }));

  // 3. Savings rate for each of last 6 months
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const transactions = await Transaction.find({
    userId: uid,
    date: { $gte: sixMonthsAgo },
  });

  const incMap = {};
  const expMap = {};

  transactions.forEach((t) => {
    const d = new Date(t.date);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      incMap[mStr] = (incMap[mStr] || 0) + amt;
    } else if (t.type === 'expense') {
      expMap[mStr] = (expMap[mStr] || 0) + amt;
    }
  });

  const savingsRate = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const inc = incMap[key] || 0;
    const exp = expMap[key] || 0;
    const rate = inc > 0 ? Number(((inc - exp) / inc * 100).toFixed(1)) : 0;

    savingsRate.push({
      month: key,
      rate,
      income: inc,
      expenses: exp,
    });
  }

  res.json({
    investments,
    expensesByCategory,
    savingsRate,
  });
});

module.exports = { getNetWorthHistory, getBreakdown };
