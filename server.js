require("dotenv").config();

// Fail fast if required environment variables are missing
["SESSION_SECRET", "MONGO_URI", "CLIENT_URL"].forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("./config/passport");
const connectDB = require("./config/db");
const {
  helmetConfig,
  apiLimiter,
  loginLimiter,
  passwordLimiter,
  mongoSanitizeConfig,
  csrfConfig,
} = require("./middleware/security");

const authRoutes = require("./routes/auth");
const doctorsRoutes = require("./routes/doctors");
const appointmentRoutes = require("./routes/appointments");
const adminRoutes = require("./routes/admin");
const cronRoutes = require("./routes/cron");
const doctorRoutes = require("./routes/doctor");
const patientRoutes = require("./routes/patient");
const publicRoutes = require("./routes/public");
const staffRoutes = require("./routes/staff");

const app = express();

connectDB();

// Trust the reverse proxy (Render, Nginx) so secure cookies work correctly
// Cloudflare + Render means 2 proxies. Trust array or true is safer.
app.set("trust proxy", 2);

// Helmet: HTTP security headers
app.use(helmetConfig);

// CORS: only allow the configured frontend, with credentials
const clientUrl = process.env.CLIENT_URL.endsWith("/") ? process.env.CLIENT_URL.slice(0, -1) : process.env.CLIENT_URL;
app.use(cors({ origin: clientUrl, credentials: true }));

// JSON body parsing
app.use(express.json({ limit: "1mb" }));

// Rate limiting on all API routes
app.use("/api", apiLimiter);

// Strict rate limit on login and password-change endpoints
// (these are intentionally NOT repeated in routes/auth.js)
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/change-password", passwordLimiter);

// Mongo sanitize: prevent NoSQL injection on user-supplied query params
app.use(mongoSanitizeConfig);

// Sessions stored in MongoDB so logins survive a server restart
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: true, // Always true for cross-origin HTTPS
      sameSite: "none", // Must be none for cross-site (Render API <-> Vercel Frontend)
    },
  })
);

// Passport must come after session and before the routes
app.use(passport.initialize());
app.use(passport.session());

// CSRF Protection requires session 
app.use((req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }
  csrfConfig(req, res, next);
});

// Send CSRF token to frontend
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Route mounting
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorsRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/staff", staffRoutes);

app.get("/", (req, res) => res.send("Clinic API is running"));
app.get("/api/health", (req, res) => {
  req.session.ping = Date.now();
  req.session.save(() => res.json({ status: "ok", sessionID: req.sessionID }));
});

// Global error handler — catches anything unhandled and returns a generic
// 500 message. Never leak stack traces in production responses.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong on our end."
        : err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
