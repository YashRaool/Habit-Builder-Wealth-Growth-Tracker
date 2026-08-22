const Habit = require('../models/Habit');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendCreated, sendBadRequest, sendNotFound } = require('../utils/response');

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
  
  const expectedGap = frequency === 'weekly' ? 7 : frequency === 'monthly' ? 30 : 1;
  
  // Check if current streak is already broken today
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
    
    // Relaxed gap check for weekly/monthly
    const isConsecutive = frequency === 'daily' ? diffDays === 1 : 
                          frequency === 'weekly' ? (diffDays > 0 && diffDays <= 7) :
                          (diffDays > 0 && diffDays <= 31);

    if (isConsecutive) {
      currentRun++;
    } else {
      if (currentRun > maxRun) maxRun = currentRun;
      // If we break the chain and haven't recorded the current streak, save it
      if (!isCurrentBroken && i === currentRun) {
         // The chain broke here, so the first run was the current streak
      }
      currentRun = 1;
    }
    prev = curr;
  }
  
  if (currentRun > maxRun) maxRun = currentRun;

  // Re-calculate the actual current streak
  let currentStreak = 0;
  if (!isCurrentBroken) {
    currentStreak = 1;
    prev = firstLog;
    for (let i = 1; i < completed.length; i++) {
      const curr = new Date(completed[i]);
      curr.setHours(0,0,0,0);
      const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
      const isConsecutive = frequency === 'daily' ? diffDays === 1 : 
                            frequency === 'weekly' ? (diffDays > 0 && diffDays <= 7) :
                            (diffDays > 0 && diffDays <= 31);
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

/** GET /api/habits */
const getHabits = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  const filter = { userId: req.user._id };
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  const habits = await Habit.find(filter).sort('-createdAt');
  sendSuccess(res, { habits });
});

/** GET /api/habits/:id */
const getHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
  if (!habit) return sendNotFound(res, 'Habit not found.');
  sendSuccess(res, { habit });
});

/** POST /api/habits */
const createHabit = asyncHandler(async (req, res) => {
  const { title, frequency, targetAmount, reminderTime, color, icon } = req.body;
  if (!title) return sendBadRequest(res, 'Title is required.');
  const habit = await Habit.create({ userId: req.user._id, title, frequency, targetAmount, reminderTime, color, icon });
  sendCreated(res, { habit }, 'Habit created.');
});

/** PUT /api/habits/:id */
const updateHabit = asyncHandler(async (req, res) => {
  // Prevent mass assignment of sensitive/computed fields
  delete req.body.userId;
  delete req.body.currentStreak;
  delete req.body.longestStreak;
  delete req.body.logs;

  const habit = await Habit.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!habit) return sendNotFound(res, 'Habit not found.');
  sendSuccess(res, { habit }, 'Habit updated.');
});

/** DELETE /api/habits/:id */
const deleteHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!habit) return sendNotFound(res, 'Habit not found.');
  sendSuccess(res, {}, 'Habit deleted.');
});

/** POST /api/habits/:id/checkin — log today's check-in */
const checkIn = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
  if (!habit) return sendNotFound(res, 'Habit not found.');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingLog = habit.logs.find(
    (l) => new Date(l.date).toDateString() === today.toDateString()
  );

  if (existingLog) {
    existingLog.completed = !existingLog.completed; // toggle
  } else {
    habit.logs.push({ date: today, completed: true, note: req.body.note });
  }

  // Recalculate streak
  const { currentStreak, longestStreak } = recalcStreaks(habit.logs, habit.frequency);
  habit.currentStreak = currentStreak;
  if (longestStreak > habit.longestStreak) {
     habit.longestStreak = longestStreak;
  }
  // Wait, if longestStreak drops (e.g. they unchecked a day that was incorrectly checked), we SHOULD reduce it!
  // It shouldn't just be max of previous longest. It should be the true longest.
  habit.longestStreak = longestStreak;

  await habit.save();
  sendSuccess(res, { habit }, 'Check-in recorded.');
});

/** GET /api/habits/:id/history — last 30 log entries */
const getHistory = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
  if (!habit) return sendNotFound(res, 'Habit not found.');
  const history = [...habit.logs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 90);
  sendSuccess(res, { history });
});

module.exports = { getHabits, getHabit, createHabit, updateHabit, deleteHabit, checkIn, getHistory };
