/**
 * Browser LocalStorage Offline/Static Fallback Store
 * Scoped strictly by user email / user ID to enforce multi-account data isolation.
 */

const SEED_USER = {
  _id: 'usr_demo_01',
  name: 'Alex Morgan',
  email: 'alex@finance.app',
  currency: 'USD',
  avatar: '',
  picture: '',
  role: 'user',
  bio: 'Building long-term wealth through daily financial discipline',
  monthlySavingsTarget: 2500,
  savingsRate: 25,
};

const SEED_HABITS = [
  {
    _id: 'hab_01',
    title: 'Daily $10 Investment Habit',
    icon: '💰',
    color: '#4f46e5',
    frequency: 'daily',
    targetAmount: 10,
    currentStreak: 12,
    longestStreak: 21,
    isActive: true,
    logs: [
      { date: new Date().toISOString(), completed: true },
      { date: new Date(Date.now() - 86400000).toISOString(), completed: true },
    ],
  },
  {
    _id: 'hab_02',
    title: 'Read 15 Mins Wealth News',
    icon: '📚',
    color: '#3b82f6',
    frequency: 'daily',
    targetAmount: 0,
    currentStreak: 8,
    longestStreak: 15,
    isActive: true,
    logs: [{ date: new Date().toISOString(), completed: true }],
  },
  {
    _id: 'hab_03',
    title: 'Review Weekly Expenses',
    icon: '📊',
    color: '#10b981',
    frequency: 'weekly',
    targetAmount: 0,
    currentStreak: 4,
    longestStreak: 8,
    isActive: true,
    logs: [],
  },
  {
    _id: 'hab_04',
    title: 'Zero Impulse Spending Day',
    icon: '🛡️',
    color: '#f59e0b',
    frequency: 'daily',
    targetAmount: 0,
    currentStreak: 5,
    longestStreak: 14,
    isActive: true,
    logs: [],
  },
];

const SEED_GOALS = [
  {
    _id: 'goal_01',
    title: 'High-Yield Emergency Fund',
    category: 'Emergency',
    targetAmount: 10000,
    currentAmount: 6500,
    deadline: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
    isCompleted: false,
    history: [
      { amount: 1500, date: new Date(Date.now() - 30 * 86400000).toISOString(), note: 'Monthly savings' },
      { amount: 1000, date: new Date(Date.now() - 5 * 86400000).toISOString(), note: 'Bonus deposit' },
    ],
  },
  {
    _id: 'goal_02',
    title: 'Index ETF Wealth Builder',
    category: 'Investment',
    targetAmount: 25000,
    currentAmount: 14200,
    deadline: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    isCompleted: false,
    history: [],
  },
  {
    _id: 'goal_03',
    title: 'Debt-Free Milestone',
    category: 'Debt Payoff',
    targetAmount: 5000,
    currentAmount: 5000,
    deadline: new Date().toISOString().slice(0, 10),
    isCompleted: true,
    history: [],
  },
];

const SEED_ASSETS = [
  {
    _id: 'ast_01',
    name: 'Vanguard Total World ETF',
    assetType: 'ETF',
    valuation: 14500,
    investedAmount: 12000,
    ticker: 'VT',
    quantity: 135,
  },
  {
    _id: 'ast_02',
    name: 'Apple Inc.',
    assetType: 'Stocks',
    valuation: 6800,
    investedAmount: 5000,
    ticker: 'AAPL',
    quantity: 38,
  },
  {
    _id: 'ast_03',
    name: 'High-Yield Savings Reserve',
    assetType: 'Cash & Savings',
    valuation: 8150,
    investedAmount: 8000,
    ticker: 'CASH',
    quantity: 1,
  },
  {
    _id: 'ast_04',
    name: 'Bitcoin Digital Reserve',
    assetType: 'Crypto',
    valuation: 4200,
    investedAmount: 3000,
    ticker: 'BTC',
    quantity: 0.065,
  },
];

const SEED_TRANSACTIONS = [
  { _id: 'tx_01', type: 'income', category: 'Salary', amount: 4800, description: 'Primary salary direct deposit', date: new Date().toISOString().slice(0, 10) },
  { _id: 'tx_02', type: 'expense', category: 'Housing', amount: 1450, description: 'Monthly rent payment', date: new Date().toISOString().slice(0, 10) },
  { _id: 'tx_03', type: 'expense', category: 'Food & Dining', amount: 420, description: 'Weekly groceries & organics', date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10) },
  { _id: 'tx_04', type: 'income', category: 'Freelance', amount: 850, description: 'UI/UX consulting client', date: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10) },
  { _id: 'tx_05', type: 'expense', category: 'Utilities', amount: 160, description: 'Fiber internet & energy', date: new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10) },
  { _id: 'tx_06', type: 'expense', category: 'Transportation', amount: 95, description: 'EV fast charging & metro', date: new Date(Date.now() - 11 * 86400000).toISOString().slice(0, 10) },
  { _id: 'tx_07', type: 'income', category: 'Investment', amount: 240, description: 'Quarterly dividend distribution', date: new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10) },
  { _id: 'tx_08', type: 'expense', category: 'Entertainment', amount: 65, description: 'Streaming subscriptions', date: new Date(Date.now() - 16 * 86400000).toISOString().slice(0, 10) },
  { _id: 'tx_09', type: 'expense', category: 'Healthcare', amount: 120, description: 'Gym membership & wellness', date: new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10) },
  { _id: 'tx_10', type: 'income', category: 'Salary', amount: 4800, description: 'Prior month salary', date: new Date(Date.now() - 32 * 86400000).toISOString().slice(0, 10) },
  { _id: 'tx_11', type: 'expense', category: 'Housing', amount: 1450, description: 'Prior month rent', date: new Date(Date.now() - 32 * 86400000).toISOString().slice(0, 10) },
  { _id: 'tx_12', type: 'expense', category: 'Food & Dining', amount: 480, description: 'Prior month groceries', date: new Date(Date.now() - 35 * 86400000).toISOString().slice(0, 10) },
];

/** Retrieve active user from stored session */
function getActiveUser(overrideUser) {
  if (overrideUser) return overrideUser;
  try {
    const raw = localStorage.getItem('fht_user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/** Check if the active user is the demo account alex@finance.app */
function isDemoUser(user) {
  const u = getActiveUser(user);
  return Boolean(u?.email && u.email.toLowerCase() === 'alex@finance.app');
}

/** Build strictly namespaced localStorage key per user */
function getUserKey(resource, user) {
  const u = getActiveUser(user);
  const identifier = (u?.email || u?._id || u?.id || 'guest').toLowerCase();
  return `wh_data_${identifier}_${resource}`;
}

/** Retrieve user-namespaced resource store with $0 / empty defaults for non-demo users */
function getUserData(resource, user) {
  const u = getActiveUser(user);
  const key = getUserKey(resource, u);
  const isDemo = isDemoUser(u);

  // Strictly isolate seed data only to alex@finance.app
  let defaultVal = [];
  if (isDemo) {
    if (resource === 'habits') defaultVal = SEED_HABITS;
    else if (resource === 'goals') defaultVal = SEED_GOALS;
    else if (resource === 'transactions') defaultVal = SEED_TRANSACTIONS;
    else if (resource === 'assets') defaultVal = SEED_ASSETS;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

/** Write user-namespaced resource store */
function setUserData(resource, val, user) {
  const key = getUserKey(resource, user);
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
}

function computeSummary(txs) {
  const monthsMap = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    monthsMap[key] = { month: key, income: 0, expense: 0, count: 0 };
  }

  (txs || []).forEach((t) => {
    const key = (t.date || '').slice(0, 7);
    if (monthsMap[key]) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') monthsMap[key].income += amt;
      else monthsMap[key].expense += amt;
      monthsMap[key].count += 1;
    }
  });

  return Object.values(monthsMap);
}

function computeNetWorth(assets) {
  const list = assets || [];
  const totalValuation = list.reduce((s, a) => s + (Number(a.valuation) || 0), 0);
  const totalInvested = list.reduce((s, a) => s + (Number(a.investedAmount) || 0), 0);
  const totalReturn = totalInvested > 0 ? ((totalValuation - totalInvested) / totalInvested) * 100 : 0;

  const byType = {};
  list.forEach((a) => {
    const t = a.assetType || 'Other';
    byType[t] = (byType[t] || 0) + (Number(a.valuation) || 0);
  });

  return {
    totalValuation,
    totalInvested,
    totalReturn,
    assets: list,
    byType,
  };
}

export async function handleOfflineRequest(config) {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  let body = {};
  try {
    body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
  } catch {
    body = {};
  }

  const currentUser = getActiveUser();

  // 1. Auth routes
  if (url.includes('/auth/me')) {
    if (currentUser) return { user: currentUser };
    if (isDemoUser()) return { user: SEED_USER };
    return { user: null };
  }

  if (url.includes('/auth/google')) {
    let gUser = null;
    if (body.token) {
      try {
        const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${body.token}` },
        });
        if (gRes.ok) {
          const gProfile = await gRes.json();
          gUser = {
            _id: 'usr_g_' + (gProfile.sub || Date.now()),
            name: gProfile.name || gProfile.given_name || 'Google User',
            email: gProfile.email,
            picture: gProfile.picture || '',
            avatar: gProfile.picture || '',
            googleId: gProfile.sub || 'google_auth',
            currency: 'USD',
            role: 'user',
            bio: '',
            monthlySavingsTarget: 0,
            savingsRate: 0,
          };
        }
      } catch (err) {
        console.warn('Direct Google userinfo lookup failed:', err);
      }
    }
    if (!gUser) {
      gUser = {
        _id: 'usr_g_' + Date.now(),
        name: body.name || 'Google User',
        email: body.email || 'google.user@example.com',
        googleId: 'google_local_demo',
        currency: 'USD',
        role: 'user',
        bio: '',
        monthlySavingsTarget: 0,
        savingsRate: 0,
      };
    }
    localStorage.setItem('fht_user', JSON.stringify(gUser));
    return { token: 'mock_jwt_' + Date.now(), user: gUser };
  }

  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    const isAlex = body.email?.toLowerCase() === 'alex@finance.app';
    const user = isAlex
      ? SEED_USER
      : {
          _id: 'usr_' + Date.now(),
          name: body.name || (body.email ? body.email.split('@')[0] : 'User'),
          email: body.email || 'user@example.com',
          currency: body.currency || 'USD',
          role: 'user',
          monthlySavingsTarget: 0,
          savingsRate: 0,
        };
    localStorage.setItem('fht_user', JSON.stringify(user));
    return { token: 'mock_jwt_' + Date.now(), user };
  }

  if (url.includes('/auth/profile') || (url.includes('/auth/me') && method === 'put')) {
    const user = { ...(currentUser || {}), ...body };
    localStorage.setItem('fht_user', JSON.stringify(user));
    return { user };
  }

  // 2. Habits routes
  if (url.includes('/habits')) {
    let habits = getUserData('habits', currentUser);

    if (url.includes('/checkin')) {
      const id = url.split('/habits/')[1]?.split('/')[0];
      const today = new Date().toDateString();
      habits = habits.map((h) => {
        if (h._id === id) {
          const logs = h.logs || [];
          const checked = logs.some((l) => new Date(l.date).toDateString() === today && l.completed);
          const newStreak = checked ? Math.max((h.currentStreak || 1) - 1, 0) : (h.currentStreak || 0) + 1;
          const updatedLogs = checked
            ? logs.filter((l) => new Date(l.date).toDateString() !== today)
            : [...logs, { date: new Date().toISOString(), completed: true }];
          return {
            ...h,
            currentStreak: newStreak,
            longestStreak: Math.max(h.longestStreak || 0, newStreak),
            logs: updatedLogs,
          };
        }
        return h;
      });
      setUserData('habits', habits, currentUser);
      return { habit: habits.find((h) => h._id === id) };
    }

    if (method === 'post') {
      const newHabit = {
        _id: 'hab_' + Date.now(),
        title: body.title || 'New Habit',
        icon: body.icon || '🎯',
        color: body.color || '#4f46e5',
        frequency: body.frequency || 'daily',
        targetAmount: Number(body.targetAmount) || 0,
        currentStreak: 0,
        longestStreak: 0,
        isActive: true,
        logs: [],
        ...body,
      };
      habits.unshift(newHabit);
      setUserData('habits', habits, currentUser);
      return { habit: newHabit };
    }

    if (method === 'put') {
      const id = url.split('/habits/')[1];
      habits = habits.map((h) => (h._id === id ? { ...h, ...body } : h));
      setUserData('habits', habits, currentUser);
      return { habit: habits.find((h) => h._id === id) };
    }

    if (method === 'delete') {
      const id = url.split('/habits/')[1];
      habits = habits.filter((h) => h._id !== id);
      setUserData('habits', habits, currentUser);
      return {};
    }

    return { habits };
  }

  // 3. Goals routes
  if (url.includes('/goals')) {
    let goals = getUserData('goals', currentUser);

    if (url.includes('/contribute')) {
      const id = url.split('/goals/')[1]?.split('/')[0];
      const amt = Number(body.amount) || 0;
      goals = goals.map((g) => {
        if (g._id === id) {
          const newCurrent = Math.min((g.currentAmount || 0) + amt, g.targetAmount || 0);
          const history = g.history || [];
          return {
            ...g,
            currentAmount: newCurrent,
            isCompleted: newCurrent >= (g.targetAmount || 0),
            history: [{ amount: amt, date: new Date().toISOString(), note: body.note || 'Contribution' }, ...history],
          };
        }
        return g;
      });
      setUserData('goals', goals, currentUser);
      return { goal: goals.find((g) => g._id === id) };
    }

    if (method === 'post') {
      const newGoal = {
        _id: 'goal_' + Date.now(),
        title: body.title || 'New Goal',
        category: body.category || 'General',
        targetAmount: Number(body.targetAmount) || 1000,
        currentAmount: Number(body.currentAmount) || 0,
        deadline: body.deadline || new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
        isCompleted: false,
        history: [],
        ...body,
      };
      goals.unshift(newGoal);
      setUserData('goals', goals, currentUser);
      return { goal: newGoal };
    }

    if (method === 'put') {
      const id = url.split('/goals/')[1];
      goals = goals.map((g) => (g._id === id ? { ...g, ...body } : g));
      setUserData('goals', goals, currentUser);
      return { goal: goals.find((g) => g._id === id) };
    }

    if (method === 'delete') {
      const id = url.split('/goals/')[1];
      goals = goals.filter((g) => g._id !== id);
      setUserData('goals', goals, currentUser);
      return {};
    }

    return { goals };
  }

  // 4. Transactions routes
  if (url.includes('/transactions')) {
    let txs = getUserData('transactions', currentUser);

    if (url.includes('/summary')) {
      return { summary: computeSummary(txs) };
    }

    if (method === 'post') {
      const newTx = {
        _id: 'tx_' + Date.now(),
        type: body.type || 'expense',
        category: body.category || 'Other',
        amount: Number(body.amount) || 0,
        description: body.description || '',
        date: body.date || new Date().toISOString().slice(0, 10),
        isRecurring: Boolean(body.isRecurring),
        ...body,
      };
      txs.unshift(newTx);
      setUserData('transactions', txs, currentUser);
      return { transaction: newTx };
    }

    if (method === 'put') {
      const id = url.split('/transactions/')[1];
      txs = txs.map((t) => (t._id === id ? { ...t, ...body } : t));
      setUserData('transactions', txs, currentUser);
      return { transaction: txs.find((t) => t._id === id) };
    }

    if (method === 'delete') {
      const id = url.split('/transactions/')[1];
      txs = txs.filter((t) => t._id !== id);
      setUserData('transactions', txs, currentUser);
      return {};
    }

    return {
      transactions: txs,
      pagination: {
        total: txs.length,
        page: 1,
        pages: 1,
        limit: 50,
      },
    };
  }

  // 5. Wealth routes
  if (url.includes('/wealth')) {
    let assets = getUserData('assets', currentUser);

    if (url.includes('/net-worth')) {
      return computeNetWorth(assets);
    }

    if (url.includes('/history')) {
      const txs = getUserData('transactions', currentUser);
      const summary = computeSummary(txs);
      const baseVal = assets.reduce((s, a) => s + (Number(a.valuation) || 0), 0);
      const history = summary.map((s, idx) => ({
        month: s.month,
        netWorth: Math.max(0, baseVal - (summary.length - 1 - idx) * 1200),
      }));
      return { history };
    }

    if (method === 'post') {
      const newAsset = {
        _id: 'ast_' + Date.now(),
        name: body.name || 'New Asset',
        assetType: body.assetType || 'Stocks / Funds',
        valuation: Number(body.valuation) || 0,
        investedAmount: Number(body.investedAmount) || 0,
        ticker: body.ticker || '',
        quantity: Number(body.quantity) || 1,
        ...body,
      };
      assets.unshift(newAsset);
      setUserData('assets', assets, currentUser);
      return { asset: newAsset };
    }

    if (method === 'put') {
      const id = url.split('/wealth/assets/')[1];
      assets = assets.map((a) => (a._id === id ? { ...a, ...body } : a));
      setUserData('assets', assets, currentUser);
      return { asset: assets.find((a) => a._id === id) };
    }

    if (method === 'delete') {
      const id = url.split('/wealth/assets/')[1];
      assets = assets.filter((a) => a._id !== id);
      setUserData('assets', assets, currentUser);
      return {};
    }

    return { assets };
  }

  // 6. Admin fallback
  if (url.includes('/admin')) {
    const habits = getUserData('habits', currentUser);
    const goals = getUserData('goals', currentUser);
    const txs = getUserData('transactions', currentUser);
    return {
      metrics: {
        users: 1,
        habits: habits.length,
        goals: goals.length,
        transactions: txs.length,
      },
      users: [currentUser || SEED_USER],
      feedback: [],
    };
  }

  return {};
}
