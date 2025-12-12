import mongoose from 'mongoose';

const answerCSVSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  // Store parsed CSV data
  data: [{
    row_id: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    }
  }],
  columns: [String] // Store all column names from CSV
});

// Create index on row_id for faster lookups
answerCSVSchema.index({ 'data.row_id': 1 });

export default mongoose.model('AnswerCSV', answerCSVSchema);
