// src/server.js
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoute");

const userRoutes = require("./routes/userRoute");

const app = express();
const PORT = process.env.PORT || 5000;

// connect to DB
connectDB(process.env.MONGO_URI);

// middlewares
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173",
  "https://auth-mern-frontend-wine.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
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
