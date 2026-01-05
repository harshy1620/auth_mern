// src/controllers/user.controller.js
const User = require("../models/User.model");

/* ---------------- GET CURRENT USER ---------------- */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- GET ALL USERS (ADMIN) ---------------- */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.json({ users });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- UPDATE USER ROLE (ADMIN) ---------------- */
exports.updateUserRole = async (req, res) => {
  console.log(req,"reqqqqq")
  console.log(res,"resss")
  try {
    const { role: newRole } = req.body;
    const allowedRoles = ["user", "admin"];

    if (!allowedRoles.includes(newRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (String(req.user.id) === String(req.params.id)) {
      return res
        .status(400)
        .json({ message: "You cannot change your own role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = newRole;
    await user.save();

    return res.json({
      message: "Role updated successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("updateUserRole error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

