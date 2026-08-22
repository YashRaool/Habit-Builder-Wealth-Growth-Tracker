const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    note: { type: String, maxlength: 200 },
  },
  { _id: false }
);

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Habit title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily',
    },
    targetAmount: {
      type: Number,
      min: 0,
      default: 0,
      comment: 'Optional financial target per check-in (e.g. save $5/day)',
    },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    reminderTime: {
      type: String,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Reminder time must be HH:MM format'],
    },
    isActive: { type: Boolean, default: true },
    logs: [habitLogSchema],
    color: { type: String, default: '#10b981' },
    icon: { type: String, default: '💰' },
  },
  { timestamps: true }
);

habitSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Habit', habitSchema);
