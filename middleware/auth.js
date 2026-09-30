function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Please log in first" });
}

function ensureDoctor(req, res, next) {
  if (req.isAuthenticated() && req.user.role === "doctor") {
    return next();
  }
  res.status(403).json({ message: "Doctor access required" });
}

function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}

module.exports = { ensureAuthenticated, ensureDoctor, ensureAdmin };
