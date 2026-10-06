const mongoose = require("mongoose");

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
    clinicName: { type: String }, // required during creation, can be empty; editable later
    slug: { type: String, unique: true, sparse: true }, // public URL slug: /dr/:slug
    bio: { type: String, maxlength: 2000 }, // public-facing description
    fee: { type: Number, min: 0 }, // consultation fee
    experienceYears: { type: Number, min: 0, default: 0 },
    workingHours: [workingHourSchema],
    slotDurationMinutes: { type: Number, default: 30 },
    onLeaveDates: [{ type: Date }],
    isActive: { type: Boolean, default: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // link to User account
  },
  { timestamps: true }
);

// Index for fast public search by slug
doctorSchema.index({ slug: 1 });

// Static: find a doctor's available slots for the next N days
doctorSchema.statics.findDoctorSlots = async function (doctorId, daysAhead = 7) {
  const Slot = mongoose.model("Slot");
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + daysAhead);

  return Slot.find({
    doctor: doctorId,
    date: { $gte: today.toISOString().split("T")[0], $lte: future.toISOString().split("T")[0] },
    status: "available",
  }).sort({ date: 1, startTime: 1 });
};

module.exports = mongoose.model("Doctor", doctorSchema);