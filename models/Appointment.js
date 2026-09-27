const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
    tokenNumber: { type: Number, required: true }, // e.g. Token #5 for that doctor that day
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["booked", "completed", "cancelled", "no-show"],
      default: "booked",
    },
    cancelReason: { type: String },
    consultationNotes: { type: String }, // doctor fills this in after visit
    prescription: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
