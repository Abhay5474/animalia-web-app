const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true 
  },
  description: {
    type: String
  },
  contactDetails: {
    type: String
  },
  status: {
    type: String,
    default: 'available' // available, adopted
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Adoption', adoptionSchema);
