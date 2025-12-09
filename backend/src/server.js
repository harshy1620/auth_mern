// src/server.js
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// connect to DB
connectDB(process.env.MONGO_URI);

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// health check
app.get("/", (req, res) => res.send("Auth backend running"));

// start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
