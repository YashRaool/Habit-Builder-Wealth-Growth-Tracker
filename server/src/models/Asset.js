const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    assetType: {
      type: String,
      enum: ['Stocks', 'Crypto', 'Real Estate', 'Cash & Savings', 'Bonds', 'Mutual Funds', 'ETF', 'Commodity', 'Other'],
      required: [true, 'Asset type is required'],
    },
    valuation: {
      type: Number,
      required: [true, 'Current valuation is required'],
      min: 0,
    },
    investedAmount: {
      type: Number,
      required: [true, 'Invested amount is required'],
      min: 0,
    },
    ticker: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
    },
    quantity: {
      type: Number,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: 300,
    },
    // Historical snapshots for net-worth chart
    history: [
      {
        date: { type: Date, required: true },
        valuation: { type: Number, required: true },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

/** Virtual: total return percentage */
assetSchema.virtual('returnPct').get(function () {
  if (!this.investedAmount) return 0;
  return (((this.valuation - this.investedAmount) / this.investedAmount) * 100).toFixed(2);
});

assetSchema.set('toJSON', { virtuals: true });
assetSchema.index({ userId: 1, assetType: 1 });

module.exports = mongoose.model('Asset', assetSchema);
