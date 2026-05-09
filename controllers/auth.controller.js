const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const toPublicUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.otp;
  delete userObj.otpExpire;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;
  delete userObj.otpAttempts;
  delete userObj.otpBlockedUntil;
  delete userObj.lastOtpRequestedAt;
  return userObj;
};

const createToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = createToken(user._id);
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }

    const user = await User.findOne({ email });
    const invalidAuthMessage = "Invalid email or password";
    if (!user || !user.password) {
      return res.status(400).json({ message: invalidAuthMessage });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: invalidAuthMessage });
    }

    const token = createToken(user._id);
    res.json({
      message: "Login successful",
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};

exports.socialLogin = async (req, res) => {
  try {
    const { provider, socialId, username, email } = req.body;

    if (!provider || !socialId || !username || !email) {
      return res.status(400).json({ message: "Missing data for social login" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        username,
        email,
        password: "",
        socialProvider: provider,
        socialId,
      });
    }

    const token = createToken(user._id);
    res.json({
      message: "Social login successful",
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Social login failed" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "If account exists, OTP has been sent" });
    }

    const now = Date.now();
    if (user.otpBlockedUntil && user.otpBlockedUntil.getTime() > now) {
      return res.status(429).json({ message: "Too many attempts. Try again later." });
    }

    if (user.lastOtpRequestedAt && now - user.lastOtpRequestedAt.getTime() < 60 * 1000) {
      return res.status(429).json({ message: "Please wait before requesting another OTP." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    user.otp = otpHash;
    user.otpExpire = now + 10 * 60 * 1000;
    user.otpAttempts = 0;
    user.otpBlockedUntil = undefined;
    user.lastOtpRequestedAt = now;
    await user.save();

    await sendEmail({
      to: email,
      subject: "Gigup Password Reset OTP",
      html: `
        <h2>Password Reset OTP</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      `,
    });

    res.status(200).json({ message: "If account exists, OTP has been sent" });
  } catch (error) {
    res.status(500).json({ message: "Failed to process forgot password request" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otpExpire || user.otpExpire.getTime() <= Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (user.otpBlockedUntil && user.otpBlockedUntil.getTime() > Date.now()) {
      return res.status(429).json({ message: "Too many attempts. Try again later." });
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== user.otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.otpBlockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    user.otp = undefined;
    user.otpExpire = undefined;
    user.otpAttempts = 0;
    user.otpBlockedUntil = undefined;
    await user.save();

    res.json({ message: "OTP verified", resetToken });
  } catch (error) {
    res.status(500).json({ message: "OTP verification failed" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const resetToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Password Reset Successful",
      html: `
        <h2>Password Changed Successfully</h2>
        <p>Your Gigup account password has been reset.</p>
        <p>If this was not you, contact support immediately.</p>
      `,
    });

    res.json({ message: "Password reset successful, confirmation email sent" });
  } catch (error) {
    res.status(500).json({ message: "Password reset failed" });
  }
};
