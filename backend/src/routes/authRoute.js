
const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/auth.controller");
const { loginLimiter ,forgotPasswordLimiter} = require("../middlewares/rateLimit.middleware");

router.post("/signup", authCtrl.signup);
router.post("/login", loginLimiter, authCtrl.login);
router.post("/google", authCtrl.googleLogin);


router.post("/refresh_token", authCtrl.refreshToken);
router.post("/logout", authCtrl.logout);

router.post("/forgot-password", forgotPasswordLimiter, authCtrl.forgotPassword);
router.post("/reset-password", authCtrl.resetPassword);


module.exports = router;
