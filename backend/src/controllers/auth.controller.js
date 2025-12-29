// src/controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const User = require("../models/User.model");
const RefreshTokenModel = require("../models/RefreshToken.model");
const { createAccessToken, createRefreshToken, verifyRefreshToken, computeRefreshTokenExpiry } = require("../utils/token.util");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// helper: set httpOnly cookie for refresh token
const sendRefreshTokenCookie = (res, token, expiresAt) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    path: "/auth/refresh_token",
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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

    // Find user by email
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: "Invalid email or password." });
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
        password: null,
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

