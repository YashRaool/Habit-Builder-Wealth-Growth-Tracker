// mockBackend.js
// Provides a mock backend using localStorage so the app works on GitHub Pages without a real backend.

const MOCK_DELAY = 300;

function getStore() {
  const store = localStorage.getItem('wh-mock-store');
  if (store) return JSON.parse(store);
  
  const defaultStore = {
    users: [
      { id: '1', name: 'Alex', email: 'alex@wealthhabit.dev', password: 'Password123!', role: 'user', created_at: new Date().toISOString() },
      { id: '2', name: 'Maya', email: 'maya@wealthhabit.dev', password: 'Password123!', role: 'user', created_at: new Date().toISOString() },
      { id: '3', name: 'Admin', email: 'admin@wealthhabit.dev', password: 'Admin123!', role: 'admin', created_at: new Date().toISOString() }
    ],
    income: [],
    expenses: [],
    habits: [],
    goals: [],
    investments: [],
    feedback: []
  };
  localStorage.setItem('wh-mock-store', JSON.stringify(defaultStore));
  return defaultStore;
}

function saveStore(store) {
  localStorage.setItem('wh-mock-store', JSON.stringify(store));
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

const originalFetch = window.fetch;

window.fetch = async function(input, init) {
  const url = typeof input === 'string' ? input : input.url;
  const method = (init && init.method) || 'GET';
  
  if (!url.startsWith('/api')) {
    return originalFetch(input, init);
  }
  
  await new Promise(r => setTimeout(r, MOCK_DELAY));
  
  const store = getStore();
  let body = {};
  if (init && init.body) {
    try { body = JSON.parse(init.body); } catch(e) {}
  }
  
  const authHeader = init?.headers?.Authorization || init?.headers?.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : null;
  const currentUser = token ? store.users.find(u => u.email === token) : null; // Token is just email for mock
  
  const route = url.split('?')[0].replace('/api', '');
  
  function response(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // --- Auth ---
  if (route === '/auth/login' && method === 'POST') {
    const user = store.users.find(u => u.email === body.email && u.password === body.password);
    if (!user) return response({ error: 'Invalid credentials' }, 401);
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return response({ token: user.email, user: safeUser });
  }
  
  if (route === '/auth/register' && method === 'POST') {
    if (store.users.find(u => u.email === body.email)) return response({ error: 'Email exists' }, 400);
    const newUser = { id: generateId(), name: body.name, email: body.email, password: body.password, role: 'user', created_at: new Date().toISOString() };
    store.users.push(newUser);
    saveStore(store);
    const safeUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
    return response({ token: newUser.email, user: safeUser });
  }
  
  if (route === '/auth/me' && method === 'GET') {
    if (!currentUser) return response({ error: 'Unauthorized' }, 401);
    const safeUser = { id: currentUser.id, name: currentUser.name, email: currentUser.email, role: currentUser.role };
    return response({ user: safeUser });
  }
  
  // --- Income ---
  if (route === '/income') {
    if (method === 'GET') return response(store.income);
    if (method === 'POST') {
      const newIncome = { id: generateId(), ...body, created_at: new Date().toISOString() };
      store.income.push(newIncome);
      saveStore(store);
      return response(newIncome, 201);
    }
  }
  if (route.startsWith('/income/') && method === 'DELETE') {
    const id = route.split('/')[2];
    store.income = store.income.filter(i => i.id !== id);
    saveStore(store);
    return response({ message: 'Deleted' });
  }
  
  // --- Expenses ---
  if (route === '/expenses') {
    if (method === 'GET') return response(store.expenses);
    if (method === 'POST') {
      const newExpense = { id: generateId(), ...body, created_at: new Date().toISOString() };
      store.expenses.push(newExpense);
      saveStore(store);
      return response(newExpense, 201);
    }
  }
  if (route === '/expenses/summary' && method === 'GET') {
    // Just return expenses grouped by category
    const summary = store.expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
      return acc;
    }, {});
    return response(Object.entries(summary).map(([category, total]) => ({ category, total })));
  }
  if (route.startsWith('/expenses/') && method === 'DELETE') {
    const id = route.split('/')[2];
    store.expenses = store.expenses.filter(i => i.id !== id);
    saveStore(store);
    return response({ message: 'Deleted' });
  }

  // --- Habits ---
  if (route === '/habits') {
    if (method === 'GET') return response(store.habits);
    if (method === 'POST') {
      const newHabit = { id: generateId(), ...body, streak: 0, history: {}, created_at: new Date().toISOString() };
      store.habits.push(newHabit);
      saveStore(store);
      return response(newHabit, 201);
    }
  }
  if (route.match(/^\/habits\/[a-zA-Z0-9_-]+\/checkin$/) && method === 'POST') {
    const id = route.split('/')[2];
    const habit = store.habits.find(h => h.id === id);
    if (habit) {
      const today = new Date().toISOString().split('T')[0];
      habit.history = habit.history || {};
      if (!habit.history[today]) {
        habit.history[today] = true;
        habit.streak = (habit.streak || 0) + 1;
        saveStore(store);
      }
      return response(habit);
    }
  }
  if (route.startsWith('/habits/') && method === 'DELETE') {
    const id = route.split('/')[2];
    store.habits = store.habits.filter(i => i.id !== id);
    saveStore(store);
    return response({ message: 'Deleted' });
  }

  // --- Goals ---
  if (route === '/goals') {
    if (method === 'GET') return response(store.goals);
    if (method === 'POST') {
      const newGoal = { id: generateId(), ...body, current_amount: 0, created_at: new Date().toISOString() };
      store.goals.push(newGoal);
      saveStore(store);
      return response(newGoal, 201);
    }
  }
  if (route.match(/^\/goals\/[a-zA-Z0-9_-]+\/deposit$/) && method === 'PATCH') {
    const id = route.split('/')[2];
    const goal = store.goals.find(g => g.id === id);
    if (goal) {
      goal.current_amount = Number(goal.current_amount || 0) + Number(body.amount);
      saveStore(store);
      return response(goal);
    }
  }
  if (route.startsWith('/goals/') && method === 'DELETE') {
    const id = route.split('/')[2];
    store.goals = store.goals.filter(i => i.id !== id);
    saveStore(store);
    return response({ message: 'Deleted' });
  }

  // --- Investments ---
  if (route === '/investments') {
    if (method === 'GET') return response(store.investments);
    if (method === 'POST') {
      const newInv = { id: generateId(), ...body, created_at: new Date().toISOString() };
      store.investments.push(newInv);
      saveStore(store);
      return response(newInv, 201);
    }
  }
  if (route.startsWith('/investments/') && method === 'DELETE') {
    const id = route.split('/')[2];
    store.investments = store.investments.filter(i => i.id !== id);
    saveStore(store);
    return response({ message: 'Deleted' });
  }

  // --- Feedback ---
  if (route === '/feedback') {
    if (method === 'GET') return response(store.feedback);
    if (method === 'POST') {
      const newFeedback = { id: generateId(), user_name: currentUser?.name || 'Anonymous', user_email: currentUser?.email, message: body.message, status: 'open', created_at: new Date().toISOString() };
      store.feedback.push(newFeedback);
      saveStore(store);
      return response(newFeedback, 201);
    }
  }

  // --- Admin ---
  if (route === '/admin/stats' && method === 'GET') {
    return response({
      user_count: store.users.length,
      active_users: store.users.length,
      habit_completion_rate: 75,
      total_habit_logs: 42,
      avg_goal_completion: 45,
      goal_count: store.goals.length,
      feedback_open: store.feedback.filter(f => f.status === 'open').length,
      feedback_total: store.feedback.length
    });
  }
  if (route === '/admin/users' && method === 'GET') {
    return response(store.users);
  }
  if (route === '/admin/feedback' && method === 'GET') {
    return response(store.feedback);
  }
  if (route === '/admin/feedback' && method === 'PATCH') {
    const f = store.feedback.find(x => x.id === body.id);
    if (f) { f.status = body.status; saveStore(store); }
    return response(f || {});
  }

  // --- Analytics ---
  if (route === '/analytics/net-worth-history' && method === 'GET') {
    return response([
      { month: 'Jan', net_worth: 1000 },
      { month: 'Feb', net_worth: 1500 },
      { month: 'Mar', net_worth: 2200 },
      { month: 'Apr', net_worth: 3000 },
      { month: 'May', net_worth: 3800 },
      { month: 'Jun', net_worth: 4500 }
    ]);
  }
  if (route === '/analytics/breakdown' && method === 'GET') {
    return response({
      savingsRate: [{ month: 'Current', rate: 25, income: 5000, expenses: 3750 }],
      investments: [{ total: store.investments.reduce((a, b) => a + Number(b.amount || 0), 0) }],
      expensesByCategory: Object.entries(store.expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
        return acc;
      }, {})).map(([category, total]) => ({ category, total }))
    });
  }

  return response({ error: 'Mock Route Not Found' }, 404);
};
