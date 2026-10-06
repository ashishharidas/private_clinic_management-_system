const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("../config/passport");
const User = require("../models/User");
const { ensureAuthenticated } = require("../middleware/auth");

// NOTE: loginLimiter and passwordLimiter are already applied in server.js
// (app.use("/api/auth/login", ...) and app.use("/api/auth/change-password", ...)),
// so they are NOT applied again here. Applying both would count each request twice.

const router = express.Router();

// ---- Google OAuth ----

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login-failed`,
  }),
  (req, res) => {
    // Login succeeded — send them back to the React app
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  }
);

// ---- /auth/me — check current user ----
// Called on app load from AuthContext. Returns the user object or 401.
router.get("/me", ensureAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

// ---- Local login: doctor / admin login via credentials ----
// body: { email, password }
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      // Generic error message — do not reveal whether email exists
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        message: "Account temporarily locked due to too many failed attempts.",
      });
    }

    // Verify password
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      // Increment failed attempts and lock out after 3 failures
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 3) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
      }
      await user.save({ validateBeforeSave: false });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Password OK — reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    // For admin seeded from env vars, mark profile complete
    if (user.role === "admin" && !user.profileComplete) {
      user.profileComplete = true;
    }
    await user.save({ validateBeforeSave: false });

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ message: "Session regeneration failed" });
      req.logIn(user, (err2) => {
        if (err2) return res.status(500).json({ message: "Login failed" });
        res.json({ user, needsChangePassword: user.mustChangePassword });
      });
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

// ---- Logout ----
router.post("/logout", ensureAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    req.session.destroy((err2) => {
      if (err2) return res.status(500).json({ message: "Session destroy failed" });
      res.json({ message: "Logged out" });
    });
  });
});

// ---- Change password ----
// Must be reachable when mustChangePassword === true, so it does NOT use
// requireNotMustChangePassword.
// body: { currentPassword, newPassword }
router.post("/change-password", ensureAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const user = req.user;

    // Verify current password
    const isMatch = await user.isValidPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const saltRounds = 12;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    user.mustChangePassword = false;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
});

// ---- Password verification for sensitive operations ----
router.post("/verify-password", ensureAuthenticated, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    const user = req.user;
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }
    res.json({ valid: true });
  } catch (err) {
    console.error("Password verify error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});

module.exports = router;
