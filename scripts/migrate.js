// Migration script: updates existing documents to the new schema.
// Run with: node scripts/migrate.js [--dry-run]
// Safe to run multiple times — it only adds fields that don't exist.

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const connectDB = require("../config/db");

const DRY_RUN = process.argv.includes("--dry-run");

async function migrateUsers() {
  console.log("Migrating users...");
  const users = await User.find({});
  let updated = 0;

  for (const user of users) {
    let changed = false;

    // Default role to "patient" for existing users
    if (!user.role) {
      if (!DRY_RUN) user.role = "patient";
      changed = true;
    }

    // Set default values for new fields
    if (user.mustChangePassword === undefined) {
      if (!DRY_RUN) user.mustChangePassword = true;
      changed = true;
    }
    if (user.failedLoginAttempts === undefined) {
      if (!DRY_RUN) user.failedLoginAttempts = 0;
      changed = true;
    }
    if (user.lockUntil === undefined) {
      if (!DRY_RUN) user.lockUntil = undefined;
      changed = true;
    }
    if (user.profileComplete === undefined) {
      if (!DRY_RUN) user.profileComplete = false;
      changed = true;
    }

    if (changed && !DRY_RUN) {
      await user.save({ validateBeforeSave: false });
    }
    updated++;
  }

  console.log(`  ${DRY_RUN ? "[DRY RUN] " : ""}Updated ${updated} users`);
}

async function migrateDoctors() {
  console.log("Migrating doctors...");
  const doctors = await Doctor.find({});
  let updated = 0;

  for (const doc of doctors) {
    let changed = false;

    if (doc.experienceYears === undefined) {
      if (!DRY_RUN) doc.experienceYears = 0;
      changed = true;
    }
    if (doc.fee === undefined) {
      if (!DRY_RUN) doc.fee = undefined;
      changed = true;
    }
    if (doc.bio === undefined) {
      if (!DRY_RUN) doc.bio = undefined;
      changed = true;
    }

    if (changed && !DRY_RUN) {
      await doc.save({ validateBeforeSave: false });
    }
    updated++;
  }

  console.log(`  ${DRY_RUN ? "[DRY RUN] " : ""}Updated ${updated} doctors`);
}

async function main() {
  await connectDB();
  await migrateUsers();
  await migrateDoctors();
  await mongoose.connection.close();
  console.log("Migration complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});