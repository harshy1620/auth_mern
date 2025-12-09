const jwt = require("jsonwebtoken");
const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });
};

const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};
const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);
const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);
const computeRefreshTokenExpiry = () => {
  const v = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
  const match = v.match(/^(\d+)([smhd])?$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const n = parseInt(match[1], 10);
  const unit = match[2] || "d";
  let ms = 0;
  switch (unit) {
    case "s":
      ms = n * 1000;
      break;
    case "m":
      ms = n * 60 * 1000;
      break;
    case "h":
      ms = n * 60 * 60 * 1000;
      break;
    case "d":
      ms = n * 24 * 60 * 60 * 1000;
      break;
    default:
      ms = n * 24 * 60 * 60 * 1000;
  }
  return new Date(Date.now() + ms);
};

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  computeRefreshTokenExpiry,
};
