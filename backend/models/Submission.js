import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  rowsTotal: {
    type: Number,
    required: true
  },
  matches: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    required: true
  },
  precision: {
    type: Number,
    required: true
  },
  recall: {
    type: Number,
    required: true
  },
  f1: {
    type: Number,
    required: true
  },
  // Store preview of rows with predictions
  fileDataPreview: [{
    row_id: String,
    predicted: String,
    actual: String,
    match: Boolean
  }],
  status: {
    type: String,
    default: 'done'
  },
  attemptNumber: {
    type: Number,
    required: true
  },
  // Additional info about comparison
  rowsInCanonical: Number,
  rowsInSubmission: Number,
  rowsCompared: Number,
  extraRows: Number,
  missingRows: Number
});

// Index for faster queries
submissionSchema.index({ userId: 1, attemptNumber: -1 });
submissionSchema.index({ accuracy: -1, f1: -1 });

export default mongoose.model('Submission', submissionSchema);
