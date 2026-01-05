const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function () {
      // password is required ONLY if googleId is NOT present
      return !this.googleId;
    },
  },
  role: { type: String, default: "user", enum: ["user", "admin"] },
  googleId: { type: String },
   resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("User", UserSchema);
