// src/controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const User = require("../models/User.model");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const RefreshTokenModel = require("../models/RefreshToken.model");
const { createAccessToken, createRefreshToken, verifyRefreshToken, computeRefreshTokenExpiry } = require("../utils/token.util");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// helper: set httpOnly cookie for refresh token
const sendRefreshTokenCookie = (res, token, expiresAt) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    path: "/auth/refresh_token",
    secure: true,       
    sameSite: "none",   
    expires: expiresAt
  });
};

// helper: create & store refresh token in DB, then set cookie
const createAndStoreRefreshToken = async (userPayload, res) => {
  const refreshToken = createRefreshToken(userPayload);
  const expiresAt = computeRefreshTokenExpiry();

  // store raw token in DB (simple approach)
  await RefreshTokenModel.create({
    token: refreshToken,
    user: userPayload.id,
    expiresAt
  });

  sendRefreshTokenCookie(res, refreshToken, expiresAt);
  return refreshToken;
};

//Email helper
const sendResetEmail = async (email, resetUrl) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Auth App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
};


// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    // Validate email format (basic regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists." });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    // Generate tokens
    const payload = { id: user._id.toString(), role: user.role };
    const accessToken = createAccessToken(payload);
    await createAndStoreRefreshToken(payload, res);

    // Respond with user data and tokens
    return res.status(201).json({
      message: "Signup successful.",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Validate email format (basic regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

   // 3 Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    //  Handle Google-only users
    if (!user.password) {
      return res.status(400).json({
        message: "This account was created using Google. Please sign in with Google.",
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Generate tokens
    const payload = { id: user._id.toString(), role: user.role };
    const accessToken = createAccessToken(payload);
    await createAndStoreRefreshToken(payload, res);

    // Respond with user data and tokens
    return res.json({
      message: "Login successful.",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
  }
};

// REFRESH TOKEN — rotate refresh tokens stored in DB
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    // verify signature & payload
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      // mark revoked in DB if present (best-effort)
      await RefreshTokenModel.findOneAndUpdate({ token }, { revoked: true }).catch(()=>{});
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // find stored token and ensure not revoked
    const stored = await RefreshTokenModel.findOne({ token, user: payload.id, revoked: false });
    if (!stored) return res.status(401).json({ message: "Refresh token not recognized or revoked" });

    // revoke old token (rotation)
    stored.revoked = true;
    await stored.save();

    // ensure user exists
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const newPayload = { id: user._id.toString(), role: user.role };
    const accessToken = createAccessToken(newPayload);
    await createAndStoreRefreshToken(newPayload, res);

    return res.json({ accessToken, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// LOGOUT — revoke refresh token
exports.logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await RefreshTokenModel.findOneAndUpdate({ token }, { revoked: true }).catch(()=>{});
    }
    res.clearCookie("refreshToken", { path: "/auth/refresh_token" });
    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GOOGLE SIGN-IN (frontend sends idToken)
exports.googleLogin = async (req, res) => {
  console.log("Backend GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);

  try {
   if (!req.body) {
      return res.status(400).json({ message: "Request body missing" });
    }

    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID token missing" });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId: payload.sub,
        role: "user",
      });
    }

    const jwtPayload = {
      id: user._id.toString(),
      role: user.role,
    };

    const accessToken = createAccessToken(jwtPayload);
    await createAndStoreRefreshToken(jwtPayload, res);

    return res.json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(500).json({ message: "Google login failed" });
  }
};

// POST /auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    // SECURITY: do NOT reveal if email exists
    if (!user) {
      return res.json({ message: "If email exists, reset link sent" });
    }

    // Google users cannot reset password
    if (user.googleId) {
      return res
        .status(400)
        .json({ message: "Google users cannot reset password" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    //  Hash token before saving
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    //  Save to DB
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    // Send email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendResetEmail(user.email, resetUrl);

    return res.json({ message: "password reset link has been sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// POST /auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and password required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // Hash token to match DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Revoke all refresh tokens (security)
    await RefreshTokenModel.updateMany(
      { user: user._id },
      { revoked: true }
    );

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
