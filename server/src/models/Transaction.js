const mongoose = require('mongoose');

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Gift', 'Other Income'];
const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Housing', 'Transportation', 'Healthcare', 'Entertainment',
  'Shopping', 'Education', 'Utilities', 'Insurance', 'Travel', 'Personal Care', 'Other Expense',
];

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be positive'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for efficient user+date queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.INCOME_CATEGORIES = INCOME_CATEGORIES;
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
