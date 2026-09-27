const express = require("express");
const passport = require("passport");
const router = express.Router();

// Step 1: frontend redirects the browser here (not a fetch call — a real page redirect)
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Step 2: Google redirects back here after the user approves
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/login-failed` }),
  (req, res) => {
    // Login succeeded — send them back to the React app
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  }
);

// Check who's currently logged in (React calls this on app load)
router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ user: null });
  }
});

router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.json({ message: "Logged out" });
  });
});

module.exports = router;
