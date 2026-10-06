const passport = require("passport");
const { hasPermission } = require("../config/permissions");

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    // If the user must change their password, ONLY allow them access to /api/auth/change-password
    // Check if the current route is NOT the password change route
    const isPasswordChangeRoute = req.originalUrl === "/api/auth/change-password" || req.originalUrl === "/api/auth/logout" || req.originalUrl.includes("/api/auth/me");
    
    if (req.user.mustChangePassword && !isPasswordChangeRoute) {
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
