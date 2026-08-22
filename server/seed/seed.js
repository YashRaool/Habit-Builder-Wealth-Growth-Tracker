/**
 * Seed script — populates the database with realistic demo data.
 * Run: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');
const Habit = require('../src/models/Habit');
const SavingsGoal = require('../src/models/SavingsGoal');
const Asset = require('../src/models/Asset');
const Feedback = require('../src/models/Feedback');

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

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🗄️  Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Transaction.deleteMany({}),
    Habit.deleteMany({}),
    SavingsGoal.deleteMany({}),
    Asset.deleteMany({}),
    Feedback.deleteMany({}),
  ]);
  console.log('🧹 Cleared existing data');

  // ── Users ─────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Password123!', 12);
  const userHash = await bcrypt.hash('Password123!', 12);

  const [admin, alex] = await User.insertMany([
    {
      name: 'Admin User',
      email: 'admin@finance.app',
      passwordHash: adminHash,
      role: 'admin',
      currency: 'USD',
      isActive: true,
      createdAt: monthsAgo(6),
    },
    {
      name: 'Alex Johnson',
      email: 'alex@finance.app',
      passwordHash: userHash,
      role: 'user',
      currency: 'USD',
      isActive: true,
      createdAt: monthsAgo(3),
    },
  ]);
  console.log('👥 Users created');

  // ── Transactions (Alex — 90 days of realistic data) ──────────────────────
  const transactions = [
    // Month 3 ago (income)
    { userId: alex._id, type: 'income', category: 'Salary', amount: 5200, date: daysAgo(90), description: 'Monthly salary - June', isRecurring: true },
    { userId: alex._id, type: 'income', category: 'Freelance', amount: 850, date: daysAgo(85), description: 'Web design project', isRecurring: false },
    // Month 3 expenses
    { userId: alex._id, type: 'expense', category: 'Housing', amount: 1400, date: daysAgo(88), description: 'Rent - June', isRecurring: true },
    { userId: alex._id, type: 'expense', category: 'Utilities', amount: 120, date: daysAgo(87), description: 'Electricity & water', isRecurring: true },
    { userId: alex._id, type: 'expense', category: 'Food & Dining', amount: 68, date: daysAgo(86), description: 'Weekly groceries', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Transportation', amount: 55, date: daysAgo(84), description: 'Monthly bus pass', isRecurring: true },
    { userId: alex._id, type: 'expense', category: 'Entertainment', amount: 35, date: daysAgo(83), description: 'Netflix + Spotify', isRecurring: true },
    { userId: alex._id, type: 'expense', category: 'Food & Dining', amount: 42, date: daysAgo(80), description: 'Restaurant dinner', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Healthcare', amount: 90, date: daysAgo(78), description: 'Doctor visit co-pay', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Shopping', amount: 130, date: daysAgo(76), description: 'Clothing purchase', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Food & Dining', amount: 72, date: daysAgo(74), description: 'Grocery run', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Personal Care', amount: 45, date: daysAgo(72), description: 'Haircut + grooming', isRecurring: false },

    // Month 2 ago (income)
    { userId: alex._id, type: 'income', category: 'Salary', amount: 5200, date: daysAgo(60), description: 'Monthly salary - July', isRecurring: true },
    { userId: alex._id, type: 'income', category: 'Investment', amount: 320, date: daysAgo(58), description: 'Dividend payout - SCHD', isRecurring: false },
    { userId: alex._id, type: 'income', category: 'Bonus', amount: 1000, date: daysAgo(55), description: 'Q2 performance bonus', isRecurring: false },
    // Month 2 expenses
    { userId: alex._id, type: 'expense', category: 'Housing', amount: 1400, date: daysAgo(59), description: 'Rent - July', isRecurring: true },
    { userId: alex._id, type: 'expense', category: 'Utilities', amount: 135, date: daysAgo(57), description: 'Electricity spike (AC)', isRecurring: true },
    { userId: alex._id, type: 'expense', category: 'Food & Dining', amount: 65, date: daysAgo(56), description: 'Weekly groceries', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Travel', amount: 480, date: daysAgo(53), description: 'Weekend trip flights', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Travel', amount: 210, date: daysAgo(51), description: 'Hotel - 2 nights', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Food & Dining', amount: 95, date: daysAgo(49), description: 'Groceries + dining out', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Education', amount: 49, date: daysAgo(47), description: 'Udemy courses subscription', isRecurring: true },
    { userId: alex._id, type: 'expense', category: 'Entertainment', amount: 28, date: daysAgo(45), description: 'Movie tickets', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Transportation', amount: 85, date: daysAgo(43), description: 'Gas refill', isRecurring: false },

    // Month 1 ago (income)
    { userId: alex._id, type: 'income', category: 'Salary', amount: 5200, date: daysAgo(30), description: 'Monthly salary - August', isRecurring: true },
    { userId: alex._id, type: 'income', category: 'Freelance', amount: 1200, date: daysAgo(25), description: 'Mobile app consulting', isRecurring: false },
    // Month 1 expenses
    { userId: alex._id, type: 'expense', category: 'Housing', amount: 1400, date: daysAgo(29), description: 'Rent - August', isRecurring: true },
    { userId: alex._id, type: 'expense', category: 'Utilities', amount: 118, date: daysAgo(28), description: 'Electricity & water', isRecurring: true },
    { userId: alex._id, type: 'expense', category: 'Food & Dining', amount: 78, date: daysAgo(27), description: 'Weekly groceries', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Insurance', amount: 145, date: daysAgo(26), description: 'Health insurance premium', isRecurring: true },
    { userId: alex._id, type: 'expense', category: 'Shopping', amount: 220, date: daysAgo(24), description: 'New laptop accessories', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Food & Dining', amount: 55, date: daysAgo(22), description: 'Weekly groceries', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Transportation', amount: 55, date: daysAgo(21), description: 'Monthly bus pass', isRecurring: true },
    { userId: alex._id, type: 'expense', category: 'Healthcare', amount: 35, date: daysAgo(19), description: 'Pharmacy - vitamins', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Entertainment', amount: 35, date: daysAgo(17), description: 'Netflix + Spotify', isRecurring: true },
    { userId: alex._id, type: 'expense', category: 'Food & Dining', amount: 88, date: daysAgo(14), description: 'Grocery + weekend brunch', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Personal Care', amount: 60, date: daysAgo(12), description: 'Haircut + skincare', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Education', amount: 49, date: daysAgo(10), description: 'Udemy subscription', isRecurring: true },
    { userId: alex._id, type: 'income', category: 'Investment', amount: 280, date: daysAgo(7), description: 'ETF dividend', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Food & Dining', amount: 62, date: daysAgo(5), description: 'Weekly groceries', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Shopping', amount: 95, date: daysAgo(3), description: 'Books and stationery', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Transportation', amount: 22, date: daysAgo(2), description: 'Uber rides', isRecurring: false },
    { userId: alex._id, type: 'expense', category: 'Food & Dining', amount: 48, date: daysAgo(1), description: 'Dinner out', isRecurring: false },
  ];

  await Transaction.insertMany(transactions);
  console.log(`💳 ${transactions.length} transactions created`);

  // ── Habits ────────────────────────────────────────────────────────────────
  const buildLogs = (daysBack, hitRate = 0.8) => {
    const logs = [];
    for (let i = daysBack; i >= 0; i--) {
      const completed = Math.random() < hitRate;
      logs.push({ date: daysAgo(i), completed });
    }
    return logs;
  };

  const habits = [
    {
      userId: alex._id,
      title: 'Save $10 daily',
      frequency: 'daily',
      targetAmount: 10,
      currentStreak: 12,
      longestStreak: 18,
      reminderTime: '08:00',
      isActive: true,
      color: '#10b981',
      icon: '💰',
      logs: buildLogs(60, 0.85),
    },
    {
      userId: alex._id,
      title: 'Review budget',
      frequency: 'weekly',
      targetAmount: 0,
      currentStreak: 6,
      longestStreak: 8,
      reminderTime: '19:00',
      isActive: true,
      color: '#6366f1',
      icon: '📊',
      logs: buildLogs(60, 0.75),
    },
    {
      userId: alex._id,
      title: 'No impulse spending',
      frequency: 'daily',
      targetAmount: 0,
      currentStreak: 5,
      longestStreak: 14,
      reminderTime: '21:00',
      isActive: true,
      color: '#f59e0b',
      icon: '🛑',
      logs: buildLogs(60, 0.7),
    },
    {
      userId: alex._id,
      title: 'Invest $50/week',
      frequency: 'weekly',
      targetAmount: 50,
      currentStreak: 4,
      longestStreak: 10,
      reminderTime: '10:00',
      isActive: true,
      color: '#3b82f6',
      icon: '📈',
      logs: buildLogs(60, 0.8),
    },
  ];

  await Habit.insertMany(habits);
  console.log('✅ 4 habits created');

  // ── Savings Goals ─────────────────────────────────────────────────────────
  const goals = [
    {
      userId: alex._id,
      title: 'Emergency Fund (6 months)',
      targetAmount: 18000,
      currentAmount: 11200,
      deadline: new Date(new Date().getFullYear() + 1, 2, 31),
      category: 'Emergency Fund',
      color: '#ef4444',
      icon: '🛡️',
      contributions: [
        { amount: 5000, date: monthsAgo(3), note: 'Initial deposit' },
        { amount: 3000, date: monthsAgo(2), note: 'Monthly contribution' },
        { amount: 2000, date: monthsAgo(1), note: 'Monthly contribution' },
        { amount: 1200, date: daysAgo(15), note: 'Extra savings' },
      ],
    },
    {
      userId: alex._id,
      title: 'Europe Vacation',
      targetAmount: 5000,
      currentAmount: 2150,
      deadline: new Date(new Date().getFullYear() + 1, 5, 30),
      category: 'Travel',
      color: '#8b5cf6',
      icon: '✈️',
      contributions: [
        { amount: 1000, date: monthsAgo(2), note: 'Starting fund' },
        { amount: 750, date: monthsAgo(1), note: 'Monthly saving' },
        { amount: 400, date: daysAgo(20), note: 'Bonus allocation' },
      ],
    },
    {
      userId: alex._id,
      title: 'MacBook Pro Upgrade',
      targetAmount: 2500,
      currentAmount: 1800,
      deadline: new Date(new Date().getFullYear(), 11, 31),
      category: 'Electronics',
      color: '#0ea5e9',
      icon: '💻',
      contributions: [
        { amount: 800, date: monthsAgo(2), note: 'Initial save' },
        { amount: 600, date: monthsAgo(1), note: 'Monthly' },
        { amount: 400, date: daysAgo(10), note: 'Freelance earnings' },
      ],
    },
  ];

  await SavingsGoal.insertMany(goals);
  console.log('🎯 3 savings goals created');

  // ── Assets ────────────────────────────────────────────────────────────────
  const buildHistory = (currentVal, monthsBack, volatility = 0.05) => {
    const history = [];
    for (let i = monthsBack; i >= 0; i--) {
      const factor = 1 + (Math.random() - 0.5) * volatility * 2;
      const baseVal = currentVal * (1 - (i * 0.015));
      history.push({ date: monthsAgo(i), valuation: Math.round(baseVal * factor * 100) / 100 });
    }
    return history;
  };

  const assets = [
    {
      userId: alex._id,
      name: 'S&P 500 ETF (VOO)',
      assetType: 'ETF',
      valuation: 18500,
      investedAmount: 14000,
      ticker: 'VOO',
      quantity: 42.5,
      lastUpdated: new Date(),
      notes: 'Core long-term holding',
      history: buildHistory(18500, 12, 0.08),
    },
    {
      userId: alex._id,
      name: 'Bitcoin',
      assetType: 'Crypto',
      valuation: 8200,
      investedAmount: 6500,
      ticker: 'BTC',
      quantity: 0.12,
      lastUpdated: new Date(),
      notes: 'High risk allocation — max 15% of portfolio',
      history: buildHistory(8200, 12, 0.2),
    },
    {
      userId: alex._id,
      name: 'High-Yield Savings',
      assetType: 'Cash & Savings',
      valuation: 11200,
      investedAmount: 11200,
      lastUpdated: new Date(),
      notes: 'Emergency fund — Ally Bank 4.5% APY',
      history: buildHistory(11200, 12, 0.01),
    },
    {
      userId: alex._id,
      name: 'Dividend Growth Fund (SCHD)',
      assetType: 'ETF',
      valuation: 6800,
      investedAmount: 5500,
      ticker: 'SCHD',
      quantity: 95,
      lastUpdated: new Date(),
      notes: 'Dividend income stream',
      history: buildHistory(6800, 12, 0.06),
    },
  ];

  await Asset.insertMany(assets);
  console.log('📈 4 assets created');

  // ── Feedback ──────────────────────────────────────────────────────────────
  await Feedback.insertMany([
    { userId: alex._id, subject: 'Great app!', message: 'Love the habit tracking feature. Would love dark mode!', status: 'open' },
    { userId: admin._id, subject: 'CSV export', message: 'Please add CSV export for transactions.', status: 'in_progress', adminNote: 'Planned for v1.2' },
  ]);
  console.log('💬 Feedback submitted');

  console.log('\n🎉 Seed complete!');
  console.log('   admin@finance.app / Password123!');
  console.log('   alex@finance.app  / Password123!');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
