require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("./config/passport");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const doctorsRoutes = require("./routes/doctors");
const appointmentRoutes = require("./routes/appointments");
const adminRoutes = require("./routes/admin");
const cronRoutes = require("./routes/cron");
const doctorRoutes = require("./routes/doctor");

const app = express();

connectDB();

app.set("trust proxy", 1);
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

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
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorsRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/doctor", doctorRoutes);

app.get("/", (req, res) => res.send("Clinic API is running"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Global error handler — catches anything unhandled and returns a generic
// 500 message. Never leak stack traces in production responses.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === "production"
      ? "Something went wrong on our end."
      : (err.message || "Internal server error"),
  });
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
