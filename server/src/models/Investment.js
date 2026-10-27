const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['cash', 'investment', 'asset'],
      required: true,
      default: 'investment',
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

investmentSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Investment', investmentSchema);
