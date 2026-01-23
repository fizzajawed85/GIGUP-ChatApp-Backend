const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  socialLogin,
  forgotPassword,
  verifyOtp,
  resetPassword
} = require('../controllers/auth.controller');

// Register
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);

// Social Login
router.post('/social-login', socialLogin);

// Forgot password (send OTP)
router.post('/forgot-password', forgotPassword);

// Verify OTP
router.post('/verify-otp', verifyOtp);

// Reset password
router.post('/reset-password/:token', resetPassword);

module.exports = router;
