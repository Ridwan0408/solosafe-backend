const mongoose = require('mongoose');
//const crypto = require('crypto');

const TripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  accommodation: { type: String},
  checkInFrequency: { type: Number, default: 1440 }, 
  nextCheckIn: { type: Date },
  //isSafe: { type: Boolean, default: true },
  status: { type: String, enum: ['Safe', 'Missed Check-in', 'SOS', 'Completed', 'active'], default: 'active' },
  lastCheckIn: { type: Date, default: Date.now },
  //shareToken: { type: String, unique: true }, // For view-only access
  lastKnownLocation: {
  lat: Number,
  lng: Number,
  updatedAt: Date
},
  emergencyContacts: [{
        name: String,
        email: String, // MVP focuses on Email alerts [cite: 143]
        phone: String
    }]
});

// Generate a secure random token before saving a new trip
// TripSchema.pre('save', function(next) {
//   if (!this.shareToken) {
//     this.shareToken = crypto.randomBytes(16).toString('hex');
//   }
//   next();
// });

module.exports = mongoose.model('Trip', TripSchema);