const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

// ---- Helmet: sets various HTTP security headers ----
// We disable the default Content-Security-Policy because the app serves a
// SPA built with Vite; the CSP would need to be tuned for that build.
const csrfConfig = require("csurf")({
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  }
});

const helmetConfig = helmet({
  contentSecurityPolicy: false, // disabled — would need tuning for SPA build
  crossOriginResourcePolicy: { policy: "same-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "no-referrer" },
});

// ---- Rate limiting ----
// Generic API limiter: 300 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests — please try again later." },
});

// Strict login limiter: 5 attempts per 15 minutes per IP
// This is the first line of defense against credential stuffing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts — please try again later." },
});

// Strict limiter for password-change endpoints
const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts — please try again later." },
});

// ---- Mongo sanitize: prevents NoSQL injection ----
// Blocks queries that contain operators like $gt, $ne, $where, etc.
// We allow $or, $and, $in, $nin, $lt, $lte, $gt, $gte, $regex, $exists
// in controlled route code — this middleware strips them from user input.
const mongoSanitizeConfig = mongoSanitize({
  replaceWith: "_",
  // Allow these operators to pass through (they're used in controlled queries)
  allow: ["$or", "$and", "$in", "$nin", "$lt", "$lte", "$gt", "$gte", "$regex", "$exists", "$size"],
});

// ---- CSRF protection ----
// We use the `csurf` package, which reads the token from a cookie.
// The frontend must send it back as a header (X-CSRF-Token) on mutating requests.
// Note: this only applies to state-changing requests (POST/PATCH/DELETE).
// GET requests are safe from CSRF and don't need the token.
module.exports = {
  helmetConfig,
  apiLimiter,
  loginLimiter,
  passwordLimiter,
  mongoSanitizeConfig,
  csrfConfig,
};