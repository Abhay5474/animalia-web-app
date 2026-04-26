const mongoose = require('mongoose');

const injurySchema = new mongoose.Schema({
  imageUrl: {
    type: String, // We'll store static file path like '/uploads/abc.jpg'
    required: true
  },
  latitude: {
    type: String,
    required: true
  },
  longitude: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['high', 'medium', 'low', 'none', 'pending']
  },
  status: {
    type: String,
    default: 'reported' // reported, resolved
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Injury', injurySchema);
