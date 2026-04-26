const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String, // 'user' or 'org'
    required: true,
    default: 'user'
  },
  rescuePoints: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
