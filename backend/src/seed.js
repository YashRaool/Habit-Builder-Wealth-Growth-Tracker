/**
 * Seed script — run with:
 *   node src/seed.js
 *
 * Creates:
 *  - 3 users (1 admin, 2 regular)
 *  - 6 months of income + expense history
 *  - 2 habits with streak logs
 *  - 1 savings goal
 *  - Investment portfolio
 *  - 3 feedback items
 */

import bcrypt from 'bcryptjs';
import db from './db.js';

const SALT = 10;

/* ─── Helpers ─── */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function randomBetween(min, max) {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

/* ─── Users ─── */
const USERS = [
  { name: 'Alex Rivera',   email: 'alex@wealthhabit.dev',  password: 'Password123!', role: 'user'  },
  { name: 'Maya Chen',     email: 'maya@wealthhabit.dev',  password: 'Password123!', role: 'user'  },
  { name: 'Admin User',    email: 'admin@wealthhabit.dev', password: 'Admin123!',    role: 'admin' },
];

/* ─── Income templates ─── */
const INCOME_SOURCES = [
  { source: 'Salary',          baseAmount: 4800 },
  { source: 'Freelance design', baseAmount: 600  },
  { source: 'Side hustle',      baseAmount: 300  },
];

/* ─── Expense categories ─── */
const EXPENSE_CATEGORIES = [
  { category: 'Rent',           baseAmount: 1400, variance: 0    },
  { category: 'Groceries',      baseAmount: 320,  variance: 60   },
  { category: 'Dining Out',     baseAmount: 180,  variance: 80   },
  { category: 'Transport',      baseAmount: 110,  variance: 30   },
  { category: 'Subscriptions',  baseAmount: 65,   variance: 0    },
  { category: 'Entertainment',  baseAmount: 90,   variance: 50   },
  { category: 'Healthcare',     baseAmount: 40,   variance: 80   },
  { category: 'Shopping',       baseAmount: 150,  variance: 100  },
  { category: 'Utilities',      baseAmount: 85,   variance: 20   },
  { category: 'Savings Transfer', baseAmount: 500, variance: 100 },
];

async function seed() {
  const client = db;

  try {
    await client.query('BEGIN');

    /* ── 1. Wipe existing seed data ── */
    await client.query('DELETE FROM feedback');
    await client.query('DELETE FROM habit_logs');
    await client.query('DELETE FROM habits');
    await client.query('DELETE FROM savings_goals');
    await client.query('DELETE FROM investments');
    await client.query('DELETE FROM expense_records');
    await client.query('DELETE FROM income_records');
    await client.query("DELETE FROM users WHERE email LIKE '%@wealthhabit.dev'");

    /* ── 2. Create users ── */
    const userIds = {};
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, SALT);
      const { rows: [row] } = await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [u.name, u.email, hash, u.role]
      );
      userIds[u.email] = row.id;
      console.log(`✓ User: ${u.name} (${u.role})`);
    }

    const alexId = userIds['alex@wealthhabit.dev'];
    const mayaId = userIds['maya@wealthhabit.dev'];

    /* ── 3. Income — 6 months for Alex ── */
    for (let month = 5; month >= 0; month--) {
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() - month);

      for (const src of INCOME_SOURCES) {
        // Only some months get freelance/side hustle
        if (src.source !== 'Salary' && Math.random() < 0.4) continue;

        const amount = src.baseAmount + randomBetween(-src.baseAmount * 0.05, src.baseAmount * 0.05);
        const day = src.source === 'Salary' ? 1 : Math.floor(Math.random() * 25) + 1;
        const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), day)
          .toISOString().slice(0, 10);

        await client.query(
          `INSERT INTO income_records (user_id, source, amount, date, note)
           VALUES ($1,$2,$3,$4,$5)`,
          [alexId, src.source, amount, date,
           src.source === 'Salary' ? 'Monthly salary deposit' : null]
        );
      }
    }
    console.log('✓ Income records (Alex — 6 months)');

    /* ── 4. Expenses — 6 months for Alex ── */
    for (let month = 5; month >= 0; month--) {
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() - month);

      for (const cat of EXPENSE_CATEGORIES) {
        // Skip some variable expenses randomly
        if (cat.variance > 0 && Math.random() < 0.15) continue;

        const amount = Math.max(
          10,
          cat.baseAmount + randomBetween(-cat.variance, cat.variance)
        );
        const day  = Math.floor(Math.random() * 27) + 1;
        const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), day)
          .toISOString().slice(0, 10);

        await client.query(
          `INSERT INTO expense_records (user_id, category, amount, date, note)
           VALUES ($1,$2,$3,$4,$5)`,
          [alexId, cat.category, amount, date, null]
        );
      }
    }
    console.log('✓ Expense records (Alex — 6 months)');

    /* ── 5. Maya — 3 months lighter history ── */
    const mayaIncome = [
      { source: 'Salary',       amount: 3900, note: 'Monthly salary' },
      { source: 'Tutoring',     amount: 400,  note: null },
    ];
    const mayaExpenses = [
      { category: 'Rent',        amount: 1100 },
      { category: 'Groceries',   amount: 280  },
      { category: 'Transport',   amount: 95   },
      { category: 'Subscriptions', amount: 55 },
      { category: 'Dining Out',  amount: 140  },
      { category: 'Shopping',    amount: 120  },
    ];
    for (let month = 2; month >= 0; month--) {
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() - month);
      for (const inc of mayaIncome) {
        const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1).toISOString().slice(0, 10);
        await client.query(
          'INSERT INTO income_records (user_id, source, amount, date, note) VALUES ($1,$2,$3,$4,$5)',
          [mayaId, inc.source, inc.amount, date, inc.note]
        );
      }
      for (const exp of mayaExpenses) {
        const day  = Math.floor(Math.random() * 25) + 1;
        const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), day).toISOString().slice(0, 10);
        await client.query(
          'INSERT INTO expense_records (user_id, category, amount, date, note) VALUES ($1,$2,$3,$4,$5)',
          [mayaId, exp.category, exp.amount + randomBetween(-20, 20), date, null]
        );
      }
    }
    console.log('✓ Income + Expense records (Maya — 3 months)');

    /* ── 6. Habits for Alex ── */
    const habits = [
      {
        name: 'Review finances for 10 min',
        frequency: 'daily',
        current_streak: 14,
        longest_streak: 21,
        daysCompleted: 20, // out of last 30
      },
      {
        name: 'Transfer to savings',
        frequency: 'weekly',
        current_streak: 6,
        longest_streak: 10,
        daysCompleted: 8,
      },
    ];

    for (const h of habits) {
      const { rows: [habit] } = await client.query(
        `INSERT INTO habits (user_id, name, frequency, current_streak, longest_streak)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [alexId, h.name, h.frequency, h.current_streak, h.longest_streak]
      );

      // Build realistic log — completed most recent days consecutively, then gaps
      let completedCount = 0;
      for (let i = 0; i < 30; i++) {
        const isRecent = i < h.current_streak; // streak days = always completed
        const completed = isRecent
          ? true
          : completedCount < h.daysCompleted && Math.random() > 0.45;

        if (completed) completedCount++;

        await client.query(
          `INSERT INTO habit_logs (habit_id, date, completed)
           VALUES ($1,$2,$3)
           ON CONFLICT (habit_id, date) DO NOTHING`,
          [habit.id, daysAgo(i), completed]
        );
      }
      console.log(`✓ Habit: "${h.name}" + 30 days of logs`);
    }

    /* ── 7. Savings Goal ── */
    await client.query(
      `INSERT INTO savings_goals
         (user_id, name, target_amount, current_amount, target_date)
       VALUES ($1,$2,$3,$4,$5)`,
      [alexId, 'Emergency Fund (3 months)', 15000, 9250, '2026-12-31']
    );
    await client.query(
      `INSERT INTO savings_goals
         (user_id, name, target_amount, current_amount, target_date)
       VALUES ($1,$2,$3,$4,$5)`,
      [mayaId, 'Laptop upgrade', 2000, 750, '2026-10-01']
    );
    console.log('✓ Savings goals');

    /* ── 8. Investments (Alex) ── */
    const investments = [
      { type: 'cash',       name: 'Checking Account',       value: 3800  },
      { type: 'cash',       name: 'High-Yield Savings',     value: 9250  },
      { type: 'investment', name: 'S&P 500 Index Fund',     value: 12400 },
      { type: 'investment', name: 'Tech ETF (QQQ)',          value: 4600  },
      { type: 'investment', name: 'Company 401k',            value: 8900  },
      { type: 'asset',      name: 'Laptop & Equipment',      value: 1800  },
      { type: 'asset',      name: 'Car (estimated value)',   value: 9500  },
    ];
    for (const inv of investments) {
      await client.query(
        'INSERT INTO investments (user_id, type, name, value) VALUES ($1,$2,$3,$4)',
        [alexId, inv.type, inv.name, inv.value]
      );
    }
    console.log('✓ Investment portfolio (Alex — net worth ~$50,250)');

    /* ── 9. Feedback ── */
    const feedbackItems = [
      { userId: alexId, message: 'Love the streak gauge! Would be great to set custom habit goals.', status: 'open' },
      { userId: mayaId, message: 'Can you add a bill reminder feature? That would be super helpful.', status: 'open' },
      { userId: alexId, message: 'The expense chart is really clear. Great work!', status: 'resolved' },
    ];
    for (const fb of feedbackItems) {
      await client.query(
        `INSERT INTO feedback (user_id, message, status) VALUES ($1,$2,$3)`,
        [fb.userId, fb.message, fb.status]
      );
    }
    console.log('✓ Feedback items');

    await client.query('COMMIT');
    console.log('\n🌱 Seed complete!');
    console.log('\nDemo credentials:');
    console.log('  alex@wealthhabit.dev  / Password123!');
    console.log('  maya@wealthhabit.dev  / Password123!');
    console.log('  admin@wealthhabit.dev / Admin123!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed, rolled back:', err.message);
    process.exit(1);
  }
}

seed();
