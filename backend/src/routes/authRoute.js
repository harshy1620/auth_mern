
const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/auth.controller");

router.post("/signup", authCtrl.signup);
router.post("/login", authCtrl.login);
router.post("/google", authCtrl.googleLogin);


router.post("/refresh_token", authCtrl.refreshToken);
router.post("/logout", authCtrl.logout);

module.exports = router;
