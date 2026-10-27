const Transaction = require('../models/Transaction');
const Habit = require('../models/Habit');
const SavingsGoal = require('../models/SavingsGoal');
const Investment = require('../models/Investment');
const Asset = require('../models/Asset');
const Feedback = require('../models/Feedback');

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};

const buildLogs = (daysBack, hitRate = 0.85) => {
  const logs = [];
  for (let i = daysBack; i >= 0; i--) {
    const completed = Math.random() < hitRate;
    logs.push({ date: daysAgo(i), completed });
  }
  return logs;
};

async function seedUserData(userId) {
  // Check if user already has transactions or habits
  const existingCount = await Transaction.countDocuments({ userId });
  if (existingCount > 0) return;

  // 1. Transactions (last 90 days across 3 months)
  const transactions = [
    // Month 3
    { userId, type: 'income', category: 'Salary', amount: 5200, date: daysAgo(90), description: 'Monthly salary' },
    { userId, type: 'income', category: 'Freelance', amount: 850, date: daysAgo(85), description: 'Consulting gig' },
    { userId, type: 'expense', category: 'Rent', amount: 1400, date: daysAgo(88), description: 'Apartment rent' },
    { userId, type: 'expense', category: 'Groceries', amount: 320, date: daysAgo(86), description: 'Supermarket' },
    { userId, type: 'expense', category: 'Dining Out', amount: 140, date: daysAgo(82), description: 'Weekend dinner' },
    { userId, type: 'expense', category: 'Utilities', amount: 110, date: daysAgo(80), description: 'Electric & internet' },
    { userId, type: 'expense', category: 'Subscriptions', amount: 45, date: daysAgo(78), description: 'Streaming & gym' },

    // Month 2
    { userId, type: 'income', category: 'Salary', amount: 5200, date: daysAgo(60), description: 'Monthly salary' },
    { userId, type: 'income', category: 'Bonus', amount: 1000, date: daysAgo(55), description: 'Quarterly bonus' },
    { userId, type: 'expense', category: 'Rent', amount: 1400, date: daysAgo(58), description: 'Apartment rent' },
    { userId, type: 'expense', category: 'Groceries', amount: 360, date: daysAgo(54), description: 'Weekly groceries' },
    { userId, type: 'expense', category: 'Transport', amount: 95, date: daysAgo(50), description: 'Fuel & transit' },
    { userId, type: 'expense', category: 'Entertainment', amount: 120, date: daysAgo(46), description: 'Concert tickets' },
    { userId, type: 'expense', category: 'Shopping', amount: 210, date: daysAgo(42), description: 'Clothing' },

    // Month 1 (current)
    { userId, type: 'income', category: 'Salary', amount: 5200, date: daysAgo(30), description: 'Monthly salary' },
    { userId, type: 'income', category: 'Side hustle', amount: 650, date: daysAgo(18), description: 'App development' },
    { userId, type: 'expense', category: 'Rent', amount: 1400, date: daysAgo(28), description: 'Apartment rent' },
    { userId, type: 'expense', category: 'Groceries', amount: 310, date: daysAgo(24), description: 'Weekly groceries' },
    { userId, type: 'expense', category: 'Dining Out', amount: 95, date: daysAgo(20), description: 'Brunch with friends' },
    { userId, type: 'expense', category: 'Utilities', amount: 115, date: daysAgo(16), description: 'Water & power' },
    { userId, type: 'expense', category: 'Healthcare', amount: 60, date: daysAgo(12), description: 'Dental checkup' },
    { userId, type: 'expense', category: 'Subscriptions', amount: 45, date: daysAgo(8), description: 'Software tools' },
    { userId, type: 'expense', category: 'Groceries', amount: 145, date: daysAgo(3), description: 'Mid-week top up' },
  ];
  await Transaction.insertMany(transactions);

  // 2. Habits (with 84 days of rich logs for HabitHeatmap and StreakGauge)
  const habits = [
    {
      userId,
      title: 'Review finances for 10 min',
      frequency: 'daily',
      targetAmount: 0,
      currentStreak: 12,
      longestStreak: 18,
      reminderTime: '20:00',
      isActive: true,
      color: '#F2793D',
      icon: '📊',
      logs: buildLogs(84, 0.85),
    },
    {
      userId,
      title: 'Save $10 daily',
      frequency: 'daily',
      targetAmount: 10,
      currentStreak: 8,
      longestStreak: 15,
      reminderTime: '08:00',
      isActive: true,
      color: '#2FA86C',
      icon: '💰',
      logs: buildLogs(84, 0.78),
    },
    {
      userId,
      title: 'No impulse spending',
      frequency: 'daily',
      targetAmount: 0,
      currentStreak: 5,
      longestStreak: 14,
      reminderTime: '21:00',
      isActive: true,
      color: '#f59e0b',
      icon: '🛑',
      logs: buildLogs(84, 0.72),
    },
    {
      userId,
      title: 'Weekly portfolio review',
      frequency: 'weekly',
      targetAmount: 0,
      currentStreak: 4,
      longestStreak: 8,
      reminderTime: '10:00',
      isActive: true,
      color: '#6366f1',
      icon: '📈',
      logs: buildLogs(84, 0.8),
    },
  ];
  await Habit.insertMany(habits);

  // 3. Savings Goals
  const goals = [
    {
      userId,
      title: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 6500,
      deadline: new Date(new Date().getFullYear() + 1, 2, 31),
      category: 'Emergency Fund',
      color: '#ef4444',
      icon: '🛡️',
      contributions: [
        { amount: 3000, date: monthsAgo(3), note: 'Initial savings' },
        { amount: 2000, date: monthsAgo(2), note: 'Monthly transfer' },
        { amount: 1500, date: daysAgo(14), note: 'Bonus contribution' },
      ],
    },
    {
      userId,
      title: 'Vacation to Japan',
      targetAmount: 4000,
      currentAmount: 2200,
      deadline: new Date(new Date().getFullYear() + 1, 6, 15),
      category: 'Travel',
      color: '#8b5cf6',
      icon: '✈️',
      contributions: [
        { amount: 1200, date: monthsAgo(2), note: 'Flight savings' },
        { amount: 1000, date: daysAgo(20), note: 'Hotel savings' },
      ],
    },
    {
      userId,
      title: 'New Laptop',
      targetAmount: 2000,
      currentAmount: 1500,
      deadline: new Date(new Date().getFullYear(), 11, 31),
      category: 'Electronics',
      color: '#0ea5e9',
      icon: '💻',
      contributions: [
        { amount: 1000, date: monthsAgo(2), note: 'Side gig income' },
        { amount: 500, date: daysAgo(10), note: 'Deposit' },
      ],
    },
  ];
  await SavingsGoal.insertMany(goals);

  // 4. Investments
  const investments = [
    { userId, type: 'investment', name: 'S&P 500 Index Fund (VOO)', value: 18500 },
    { userId, type: 'cash',       name: 'High-Yield Savings (4.5% APY)', value: 8500 },
    { userId, type: 'asset',      name: 'Real Estate / Physical Assets', value: 15000 },
  ];
  await Investment.insertMany(investments);

  // 5. Assets (for wealth router if called)
  const assets = [
    {
      userId,
      name: 'S&P 500 ETF (VOO)',
      assetType: 'ETF',
      valuation: 18500,
      investedAmount: 14000,
      ticker: 'VOO',
      quantity: 42.5,
    },
    {
      userId,
      name: 'High-Yield Savings',
      assetType: 'Cash & Savings',
      valuation: 8500,
      investedAmount: 8500,
    },
    {
      userId,
      name: 'Real Estate Equity',
      assetType: 'Real Estate',
      valuation: 15000,
      investedAmount: 12000,
    },
  ];
  await Asset.insertMany(assets);

  // 6. Feedback
  const feedback = [
    {
      userId,
      subject: 'Loving the app!',
      message: 'The streak gauge and 12-week heatmap visualization keeps me accountable every single day.',
      status: 'open',
    },
  ];
  await Feedback.insertMany(feedback);
}

module.exports = { seedUserData };
