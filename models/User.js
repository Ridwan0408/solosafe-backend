const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  emergencyContacts: [{
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }
  }],
  createdAt: { type: Date, default: Date.now },
  fcmToken: { type: String, default: null }, // Stores the phone's unique ID
  password: { type: String, required: function() { return !this.googleId; } }, // Optional if using Google
  googleId: { type: String, unique: true, sparse: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

// Hash password before saving to the database
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', UserSchema);