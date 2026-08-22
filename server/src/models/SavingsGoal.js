const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, default: Date.now },
    note: { type: String, maxlength: 200 },
  },
  { _id: false }
);

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target must be at least 1'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deadline: {
      type: Date,
    },
    category: {
      type: String,
      enum: ['Emergency Fund', 'Travel', 'Home', 'Education', 'Vehicle', 'Retirement', 'Electronics', 'Wedding', 'Other'],
      default: 'Other',
    },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    contributions: [contributionSchema],
    color: { type: String, default: '#10b981' },
    icon: { type: String, default: '🎯' },
  },
  { timestamps: true }
);

/** Auto-mark goal as completed when currentAmount reaches targetAmount */
savingsGoalSchema.pre('save', function (next) {
  if (this.currentAmount >= this.targetAmount && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
  next();
});

savingsGoalSchema.index({ userId: 1, isCompleted: 1 });

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
