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
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    const payload = { id: user._id.toString(), role: user.role };
    const accessToken = createAccessToken(payload);
    await createAndStoreRefreshToken(payload, res);

    return res.status(201).json({ accessToken, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
   const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ message: "User not found please signup" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const payload = { id: user._id.toString(), role: user.role };
    const accessToken = createAccessToken(payload);
    await createAndStoreRefreshToken(payload, res);

    return res.json({ accessToken, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
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
exports.googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "No id token" });

    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, sub: googleId, name } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name, googleId });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const jwtPayload = { id: user._id.toString(), role: user.role };
    const accessToken = createAccessToken(jwtPayload);
    await createAndStoreRefreshToken(jwtPayload, res);

    return res.json({ accessToken, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Google Sign-in error:", err);
    return res.status(500).json({ message: "Google sign-in failed" });
  }
};
