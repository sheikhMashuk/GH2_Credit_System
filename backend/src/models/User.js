const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['PRODUCER', 'VERIFIER'],
    default: 'PRODUCER'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
