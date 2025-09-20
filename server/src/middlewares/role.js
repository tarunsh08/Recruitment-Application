import AppError from "../utils/error.js";

export default (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new AppError("Access denied: insufficient permissions", 403);
  }
  next();
};
