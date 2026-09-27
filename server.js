require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("./config/passport");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const doctorRoutes = require("./routes/doctors");
const appointmentRoutes = require("./routes/appointments");

const app = express();

connectDB();

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
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);

app.get("/", (req, res) => res.send("Clinic API is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
