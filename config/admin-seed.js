// Fixed super-admin seeding. Run once at startup (or via `npm run seed:admin`).
// The admin is immutable via UI/API — only env var changes can alter it.
// Credentials come from ADMIN_ID and ADMIN_PASSWORD_HASH in .env
//
// Usage: set ADMIN_ID=admin@clinic.local and ADMIN_PASSWORD_HASH=<bcrypt-hash>
// in .env. This script will upsert that user with role:"admin" and profileComplete:true.

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("./db");

const ADMIN_ID = process.env.ADMIN_ID;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

if (!ADMIN_ID || !ADMIN_PASSWORD_HASH) {
  console.log("⚠  ADMIN_ID or ADMIN_PASSWORD_HASH not set — skipping admin seed");
  process.exit(0);
}

async function seedAdmin() {
  await connectDB();

  // Upsert by email (ADMIN_ID)
  const admin = await User.findOneAndUpdate(
    { email: ADMIN_ID },
    {
      email: ADMIN_ID,
      name: "Super Admin",
      role: "admin",
      passwordHash: ADMIN_PASSWORD_HASH,
      profileComplete: true,
      mustChangePassword: false,
      failedLoginAttempts: 0,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`✅  Admin user ensured: ${admin.email} (${admin._id})`);
  await mongoose.connection.close();
}

seedAdmin().catch((err) => {
  console.error("Admin seed failed:", err);
  process.exit(1);
});