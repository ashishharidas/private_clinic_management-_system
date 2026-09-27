const mongoose = require("mongoose");

// workingHours: array like [{ day: "Monday", start: "10:00", end: "13:00" }, ...]
// this lets each doctor have a different schedule per weekday
const workingHourSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: true,
    },
    start: { type: String, required: true }, // "10:00" 24hr format
    end: { type: String, required: true },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    clinicName: { type: String, required: true },
    workingHours: [workingHourSchema],
    slotDurationMinutes: { type: Number, default: 30 },
    onLeaveDates: [{ type: Date }], // days doctor has blocked off
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
