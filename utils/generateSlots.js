// This turns a doctor's "working hours" into actual bookable Slot documents
// for the next 7 days. Run it daily via a cron job (or manually for now) so
// there's always a rolling 7-day booking window — matching your requirement
// "prebooking can be done one week prior".

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Doctor = require("../models/Doctor");
const Slot = require("../models/Slot");

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Converts "10:00" -> 600 (minutes since midnight), so we can do math easily
function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

async function generateSlotsForDoctor(doctor, daysAhead = 7) {
  const slotsToInsert = [];

  for (let i = 0; i < daysAhead; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);
    const dayName = DAY_NAMES[targetDate.getDay()];
    const dateStr = targetDate.toISOString().split("T")[0]; // "2026-09-28"

    // Skip if doctor is on leave that day
    const isOnLeave = doctor.onLeaveDates.some(
      (d) => d.toISOString().split("T")[0] === dateStr
    );
    if (isOnLeave) continue;

    // Find this doctor's working hours for this weekday (could be multiple shifts)
    const shifts = doctor.workingHours.filter((wh) => wh.day === dayName);

    for (const shift of shifts) {
      let current = timeToMinutes(shift.start);
      const end = timeToMinutes(shift.end);

      while (current + doctor.slotDurationMinutes <= end) {
        const startTime = minutesToTime(current);
        const endTime = minutesToTime(current + doctor.slotDurationMinutes);

        slotsToInsert.push({
          doctor: doctor._id,
          date: dateStr,
          startTime,
          endTime,
          status: "available",
        });

        current += doctor.slotDurationMinutes;
      }
    }
  }

  // insertMany with ordered:false + unique index means duplicates
  // (slots that already exist) just get skipped, not an error
  try {
    await Slot.insertMany(slotsToInsert, { ordered: false });
  } catch (err) {
    // duplicate key errors (11000) are expected here and are safe to ignore
    if (err.code !== 11000) throw err;
  }
}

async function run() {
  await connectDB();
  const doctors = await Doctor.find({ isActive: true });
  for (const doctor of doctors) {
    await generateSlotsForDoctor(doctor);
    console.log(`Generated slots for Dr. ${doctor.name}`);
  }
  mongoose.connection.close();
}

// Allows this file to be run directly (npm run seed:slots) OR imported elsewhere
if (require.main === module) {
  run();
}

module.exports = { generateSlotsForDoctor };
