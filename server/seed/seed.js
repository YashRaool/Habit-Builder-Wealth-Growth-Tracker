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
const Investment = require('../src/models/Investment');
const Asset = require('../src/models/Asset');
const Feedback = require('../src/models/Feedback');
const { seedUserData } = require('../src/utils/seedUserData');

const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
};

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/financial_habit_tracker';
  await mongoose.connect(uri);
  console.log('🗄️ Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Transaction.deleteMany({}),
    Habit.deleteMany({}),
    SavingsGoal.deleteMany({}),
    Investment.deleteMany({}),
    Asset.deleteMany({}),
    Feedback.deleteMany({}),
  ]);
  console.log('🧹 Cleared existing data');

  // ── Users ─────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Password123!', 12);
  const userHash = await bcrypt.hash('Password123!', 12);

  const users = await User.insertMany([
    {
      name: 'Yash Raool',
      email: 'yashhraool9@gmail.com',
      passwordHash: adminHash,
      role: 'admin',
      currency: 'USD',
      isActive: true,
      createdAt: monthsAgo(6),
    },
    {
      name: 'Alex Johnson',
      email: 'alex.johnson@gmail.com',
      passwordHash: userHash,
      role: 'user',
      currency: 'USD',
      isActive: true,
      createdAt: monthsAgo(3),
    },
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
  console.log('👥 Users created (including Yash Raool, Alex Johnson & demo accounts)');

  // Seed rich demo data for every user
  for (const u of users) {
    await seedUserData(u._id);
  }
  console.log('📊 Seeded transactions, habits with 84-day history, goals, investments, and feedback for all accounts');

  console.log('\n🎉 Seed complete!');
  console.log('   yashhraool9@gmail.com  (Admin / Google)');
  console.log('   alex.johnson@gmail.com (User / Google)');
  console.log('   admin@finance.app / Password123!');
  console.log('   alex@finance.app  / Password123!');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
