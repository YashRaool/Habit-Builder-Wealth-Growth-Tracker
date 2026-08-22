const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [150, 'Subject cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open',
    },
    adminNote: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
