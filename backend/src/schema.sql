-- WealthHabit schema
-- Run once to initialize the database


-- Users
CREATE TABLE IF NOT EXISTS users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  email        TEXT        UNIQUE NOT NULL,
  password_hash TEXT       NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Income records
CREATE TABLE IF NOT EXISTS income_records (
  id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source   TEXT        NOT NULL,
  amount   NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date     DATE        NOT NULL,
  note     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expense records
CREATE TABLE IF NOT EXISTS expense_records (
  id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT        NOT NULL,
  amount   NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date     DATE        NOT NULL,
  note     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  frequency      TEXT        NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily','weekly','monthly')),
  current_streak INT         NOT NULL DEFAULT 0,
  longest_streak INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habit logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id       UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID  NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date     DATE  NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (habit_id, date)
);

-- Savings goals
CREATE TABLE IF NOT EXISTS savings_goals (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  target_amount  NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date    DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Investments / assets
CREATE TABLE IF NOT EXISTS investments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('cash','investment','asset')),
  name       TEXT        NOT NULL,
  value      NUMERIC(12,2) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  message    TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_income_user    ON income_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_user   ON expense_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_habit_user     ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habitlog_habit ON habit_logs(habit_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_goal_user      ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_invest_user    ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
