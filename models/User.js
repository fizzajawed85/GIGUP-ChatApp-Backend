const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },

    // social login
    socialProvider: { type: String },
    socialId: { type: String },

    // forgot / reset password
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    // OTP for verification
    otp: { type: String },
    otpExpire: { type: Date },

  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
