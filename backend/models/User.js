import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  uploadLimit: {
    type: Number,
    default: null // null means use global default
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for getting submission count
userSchema.virtual('submissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'userId'
});

export default mongoose.model('User', userSchema);
