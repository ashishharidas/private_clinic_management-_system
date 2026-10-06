const passport = require("passport");
const { hasPermission } = require("../config/permissions");
const { verifyToken } = require("../utils/token");
const User = require("../models/User");

async function ensureAuthenticated(req, res, next) {
  let user = null;
  let isAuth = false;

  if (req.isAuthenticated && req.isAuthenticated()) {
    user = req.user;
    isAuth = true;
  } else {
    // Fallback to Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        try {
          user = await User.findById(decoded.id);
          if (user) {
            req.user = user;
            req.isAuthenticated = () => true;
            isAuth = true;
          }
        } catch (err) {
          console.error("Token user fetch err", err);
        }
      }
    }
  }

  if (isAuth && user) {
    const isPasswordChangeRoute = req.originalUrl === "/api/auth/change-password" || req.originalUrl === "/api/auth/logout" || req.originalUrl.includes("/api/auth/me");
    if (user.mustChangePassword && !isPasswordChangeRoute) {
      return res.status(403).json({ 
        message: "You must change your password before accessing the system.", 
        mustChangePassword: true 
      });
    }
    return next();
  }

  res.status(401).json({ message: "Unauthorized. Please log in." });
}

function ensureRole(roles) {
  return (req, res, next) => {
    // We already checked ensureAuthenticated before this usually, but safety check:
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (roles.includes(req.user.role)) {
      return next();
    }
    res.status(403).json({ message: "Forbidden: insufficient role" });
  };
}

function ensureAdmin(req, res, next) {
  return ensureRole(["admin"])(req, res, next);
}

function ensureDoctor(req, res, next) {
  return ensureRole(["doctor"])(req, res, next);
}

function requirePermission(action) {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (hasPermission(req.user.role, action)) {
      return next();
    }
    res.status(403).json({ message: "Forbidden: insufficient permissions" });
  };
}

// Ensure the user owns the resource or is an admin
function requireOwnership(resourceUserIdGetter) {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role === "admin") {
      return next();
    }
    
    const resourceUserId = resourceUserIdGetter(req);
    if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden: resource ownership required" });
    }
    
    next();
  };
}

module.exports = {
  ensureAuthenticated,
  ensureRole,
  ensureAdmin,
  ensureDoctor,
  requirePermission,
  requireOwnership
};
