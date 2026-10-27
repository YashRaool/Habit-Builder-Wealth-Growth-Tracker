const Habit = require('../models/Habit');
const { asyncHandler } = require('../middleware/errorHandler');

const formatHabit = (h) => ({
  id: h._id.toString(),
  _id: h._id.toString(),
  name: h.title,
  title: h.title,
  frequency: h.frequency || 'daily',
  current_streak: h.currentStreak || 0,
  currentStreak: h.currentStreak || 0,
  longest_streak: h.longestStreak || 0,
  longestStreak: h.longestStreak || 0,
  target_amount: h.targetAmount || 0,
  targetAmount: h.targetAmount || 0,
  created_at: h.createdAt,
  createdAt: h.createdAt,
});

/** Recalculate current and longest streaks from logs */
const recalcStreaks = (logs, frequency) => {
  if (!logs || logs.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const completed = logs
    .filter((l) => l.completed)
    .map((l) => new Date(l.date))
    .sort((a, b) => b - a); // Newest first

  if (completed.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let currentRun = 1;
  let maxRun = 1;
  let isCurrentBroken = false;

  const expectedGap = frequency === 'weekly' ? 7 : frequency === 'monthly' ? 31 : 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstLog = new Date(completed[0]);
  firstLog.setHours(0, 0, 0, 0);
  const daysSinceLast = Math.round((today - firstLog) / (1000 * 60 * 60 * 24));

  if (daysSinceLast > expectedGap) {
    isCurrentBroken = true;
  }

  let prev = firstLog;
  for (let i = 1; i < completed.length; i++) {
    const curr = new Date(completed[i]);
    curr.setHours(0, 0, 0, 0);
    const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));

    const isConsecutive =
      frequency === 'daily'
        ? diffDays === 1
        : frequency === 'weekly'
        ? diffDays > 0 && diffDays <= 7
        : diffDays > 0 && diffDays <= 31;

    if (isConsecutive) {
      currentRun++;
    } else {
      if (currentRun > maxRun) maxRun = currentRun;
      currentRun = 1;
    }
    prev = curr;
  }
  if (currentRun > maxRun) maxRun = currentRun;

  let currentStreak = 0;
  if (!isCurrentBroken) {
    currentStreak = 1;
    prev = firstLog;
    for (let i = 1; i < completed.length; i++) {
      const curr = new Date(completed[i]);
      curr.setHours(0, 0, 0, 0);
      const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
      const isConsecutive =
        frequency === 'daily'
          ? diffDays === 1
          : frequency === 'weekly'
          ? diffDays > 0 && diffDays <= 7
          : diffDays > 0 && diffDays <= 31;
      if (isConsecutive) {
        currentStreak++;
        prev = curr;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak: maxRun };
};

/** GET /api/habits — returns raw array for Orange UI */
const getHabits = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  const filter = { userId: req.user._id };
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  const habits = await Habit.find(filter).sort('createdAt');
  res.json(habits.map(formatHabit));
});

/** GET /api/habits/:id */
const getHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  res.json(formatHabit(habit));
});

/** POST /api/habits */
const createHabit = asyncHandler(async (req, res) => {
  const title = (req.body.name || req.body.title || '').trim();
  const frequency = req.body.frequency || 'daily';
  const targetAmount = Number(req.body.target_amount || req.body.targetAmount) || 0;

  if (!title) return res.status(400).json({ errors: ['Habit name is required'] });
  if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
    return res.status(400).json({ errors: ['Frequency must be daily, weekly, or monthly'] });
  }

  const habit = await Habit.create({
    userId: req.user._id,
    title,
    frequency,
    targetAmount,
  });

  res.status(201).json(formatHabit(habit));
});

/** PUT /api/habits/:id */
const updateHabit = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name || req.body.title) {
    updates.title = (req.body.name || req.body.title).trim();
  }
  if (req.body.frequency) {
    updates.frequency = req.body.frequency;
  }
  if (req.body.target_amount !== undefined || req.body.targetAmount !== undefined) {
    updates.targetAmount = Number(req.body.target_amount ?? req.body.targetAmount) || 0;
  }

  const habit = await Habit.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  res.json(formatHabit(habit));
});

/** DELETE /api/habits/:id */
const deleteHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  res.status(204).end();
});

/** GET /api/habits/:id/logs — returns array of logs */
const getLogs = asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 84, 365);
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  const logs = (habit.logs || [])
    .filter((l) => new Date(l.date) >= cutoff)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((l) => ({
      habit_id: habit._id.toString(),
      date: new Date(l.date).toISOString().slice(0, 10),
      completed: Boolean(l.completed),
      note: l.note || '',
    }));

  res.json(logs);
});

/** POST /api/habits/:id/checkin — toggle today's check-in */
const checkIn = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const existingLog = habit.logs.find(
    (l) => new Date(l.date).toDateString() === today.toDateString()
  );

  let isCompleted = true;
  if (existingLog) {
    existingLog.completed = !existingLog.completed;
    isCompleted = existingLog.completed;
  } else {
    habit.logs.push({ date: today, completed: true, note: req.body.note || '' });
    isCompleted = true;
  }

  // Recalculate streak
  const { currentStreak, longestStreak } = recalcStreaks(habit.logs, habit.frequency);
  habit.currentStreak = currentStreak;
  habit.longestStreak = Math.max(habit.longestStreak, longestStreak);

  await habit.save();

  res.json({
    log: {
      habit_id: habit._id.toString(),
      date: todayStr,
      completed: isCompleted,
    },
    current_streak: habit.currentStreak,
    currentStreak: habit.currentStreak,
    longest_streak: habit.longestStreak,
    longestStreak: habit.longestStreak,
    habit: formatHabit(habit),
  });
});

module.exports = {
  getHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  getLogs,
  checkIn,
};
