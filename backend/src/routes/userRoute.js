const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const {
  getCurrentUser,
  getAllUsers,
  updateUserRole
} = require("../controllers/user.controller");


// PRIVATE: USER OR ADMIN
router.get("/me", auth, getCurrentUser);

// PRIVATE: ADMIN ONLY
router.get("/all", auth, role(["admin"]), getAllUsers);

// PRIVATE: ADMIN ONLY
router.patch("/role/:id", auth, role(["admin"]), updateUserRole);

module.exports = router;
