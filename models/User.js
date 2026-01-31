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

    // Profile Details
    avatar: { type: String, default: "" }, // URL to image
    about: { type: String, default: "Hey there! I am using Gigup." },
    phoneNumber: { type: String, default: "" },
    location: { type: String, default: "" },
    status: { type: String, default: "Available" },
    socialLinks: {
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },
    coverImage: { type: String, default: "" }, // URL to cover image
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
