const express = require("express");
const router = express.Router();
const Slot = require("../models/Slot");
const Appointment = require("../models/Appointment");
const { ensureAuthenticated } = require("../middleware/auth");

// ---- BOOK A SLOT ----
router.post("/book", ensureAuthenticated, async (req, res) => {
  const { slotId } = req.body;
  const patientId = req.user._id;

  try {
    // 1. Fetch slot info for validation (non-atomic read)
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    // 2. Defensive check: reject past slots
    const slotDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
    if (slotDateTime < new Date()) {
      return res.status(400).json({ message: "Cannot book a slot in the past." });
    }

    // 3. Check for conflicting booking (same doctor, same date, overlapping time)
    const conflict = await Appointment.findOne({
      patient: patientId,
      doctor: slot.doctor,
      date: slot.date,
      status: "booked",
      $or: [
        // Exact same start time = duplicate booking
        { startTime: slot.startTime },
        // Time range overlap: existing appointment overlaps with this slot
        {
          startTime: { $lt: slot.endTime },
          endTime: { $gt: slot.startTime },
        },
      ],
    });

    if (conflict) {
      return res.status(409).json({
        message: "You already have an appointment with this doctor at this time.",
      });
    }

    // 4. THE ATOMIC STEP: find a slot that is still "available" and flip it to
    // "booked" in ONE database operation. If two requests race for the same
    // slot, only the first one finds status:"available" — the second gets null.
    const bookedSlot = await Slot.findOneAndUpdate(
      { _id: slotId, status: "available" },
      { status: "booked" },
      { new: true }
    );

    if (!bookedSlot) {
      return res.status(409).json({ message: "Sorry, this slot was just booked by someone else." });
    }

    // Work out today's token number for this doctor (count existing bookings that day + 1)
    const bookingsToday = await Appointment.countDocuments({
      doctor: bookedSlot.doctor,
      date: bookedSlot.date,
      status: { $ne: "cancelled" },
    });
    const tokenNumber = bookingsToday + 1;

    const appointment = await Appointment.create({
      patient: patientId,
      doctor: bookedSlot.doctor,
      slot: bookedSlot._id,
      tokenNumber,
      date: bookedSlot.date,
      startTime: bookedSlot.startTime,
      endTime: bookedSlot.endTime, // store for overlap detection
      status: "booked",
    });

    bookedSlot.appointment = appointment._id;
    await bookedSlot.save();

    res.status(201).json({ appointment, tokenNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Booking failed", error: err.message });
  }
});

// ---- CANCEL AN APPOINTMENT ----
router.post("/:id/cancel", ensureAuthenticated, async (req, res) => {
  const { reason } = req.body;

  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (!appointment.patient.equals(req.user._id)) {
      return res.status(403).json({ message: "Not your appointment" });
    }
    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    appointment.status = "cancelled";
    appointment.cancelReason = reason || "Not specified";
    await appointment.save();

    // Free up the slot again so someone else can book it
    await Slot.findByIdAndUpdate(appointment.slot, {
      status: "available",
      appointment: null,
    });

    res.json({ message: "Appointment cancelled", appointment });
  } catch (err) {
    res.status(500).json({ message: "Cancellation failed", error: err.message });
  }
});

// ---- MY APPOINTMENT HISTORY ----
router.get("/history", ensureAuthenticated, async (req, res) => {
  const appointments = await Appointment.find({ patient: req.user._id })
    .populate("doctor", "name specialization clinicName")
    .sort({ date: -1, startTime: -1 });

  res.json(appointments);
});

// ---- MY UPCOMING APPOINTMENTS ----
router.get("/upcoming", ensureAuthenticated, async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const appointments = await Appointment.find({
    patient: req.user._id,
    date: { $gte: today },
    status: "booked",
  })
    .populate("doctor", "name specialization clinicName")
    .sort({ date: 1, startTime: 1 });

  res.json(appointments);
});

module.exports = router;
