const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  latitude: {
    type: String
  },
  longitude: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Clinic', clinicSchema);
