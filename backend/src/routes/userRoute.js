// src/routes/user.routes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const User = require("../models/User.model");

// get current user
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json({ user });
});

// admin list all
router.get("/all", auth, role(["admin"]), async (req, res) => {
  const users = await User.find().select("-password");
  res.json({ users });
});

// admin change role
router.patch("/role/:id", auth, role(["admin"]), async (req, res) => {
  const { role: newRole } = req.body;
  if (!["user","admin"].includes(newRole)) return res.status(400).json({ message: "Invalid role" });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.role = newRole;
  await user.save();
  res.json({ message: "Role updated", user: { id: user._id, email: user.email, role: user.role } });
});

module.exports = router;
