// src/middlewares/role.middleware.js
module.exports = (allowedRoles = []) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(403).json({ message: "No role found" });
  if (!allowedRoles.includes(role)) return res.status(403).json({ message: "Forbidden" });
  next();
};
