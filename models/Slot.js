const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: String, required: true }, // "2026-09-28" — string keeps comparisons simple
    startTime: { type: String, required: true }, // "10:00"
    endTime: { type: String, required: true }, // "10:30"
    status: {
      type: String,
      enum: ["available", "booked", "cancelled"],
      default: "available",
    },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
  },
  { timestamps: true }
);

// THIS is the key line for preventing double-booking:
// no two slot documents can exist with the same doctor+date+startTime.
// Combined with findOneAndUpdate (atomic), this makes race conditions impossible.
slotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model("Slot", slotSchema);
