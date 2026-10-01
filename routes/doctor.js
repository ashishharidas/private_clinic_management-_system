const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const { ensureDoctor } = require("../middleware/auth");

// GET /api/doctor/queue?date=2026-10-01
// Returns the day's token queue for the logged-in doctor
router.get("/queue", ensureDoctor, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];

    // Find the Doctor document linked to this user
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not linked to your account" });
    }

    const appointments = await Appointment.find({
      doctor: doctor._id,
      date,
      status: { $in: ["booked", "completed", "no-show"] },
    })
      .populate("patient", "name phone")
      .sort({ startTime: 1 });

    res.json({ doctor: doctor.name, date, appointments });
  } catch (err) {
    console.error("Doctor queue error:", err);
    res.status(500).json({ message: "Failed to fetch queue" });
  }
});

// PATCH /api/doctor/appointments/:id/complete
// Mark a visit complete with consultation notes and prescription
router.patch("/appointments/:id/complete", ensureDoctor, async (req, res) => {
  try {
    const { consultationNotes, prescription } = req.body;

    // Find the appointment
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Verify this doctor owns the appointment
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || !appointment.doctor.equals(doctor._id)) {
      return res.status(403).json({ message: "Not your appointment" });
    }

    // Only allow completing "booked" appointments
    if (appointment.status !== "booked") {
      return res.status(400).json({ message: `Cannot complete appointment with status: ${appointment.status}` });
    }

    appointment.status = "completed";
    if (consultationNotes) appointment.consultationNotes = consultationNotes;
    if (prescription) appointment.prescription = prescription;
    await appointment.save();

    // Update slot status to completed (optional, for audit trail)
    await Appointment.populate(appointment, { path: "doctor", select: "name" });

    res.json({ message: "Visit marked complete", appointment });
  } catch (err) {
    console.error("Doctor complete error:", err);
    res.status(500).json({ message: "Failed to complete visit" });
  }
});

// PATCH /api/doctor/appointments/:id/no-show
// Mark a patient as no-show
router.patch("/appointments/:id/no-show", ensureDoctor, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Verify this doctor owns the appointment
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || !appointment.doctor.equals(doctor._id)) {
      return res.status(403).json({ message: "Not your appointment" });
    }

    // Only allow no-show for "booked" appointments
    if (appointment.status !== "booked") {
      return res.status(400).json({ message: `Cannot mark no-show for status: ${appointment.status}` });
    }

    appointment.status = "no-show";
    await appointment.save();

    // Free up the slot so someone else can book it
    await appointment.populate("slot");
    if (appointment.slot) {
      await appointment.slot.updateOne({ status: "available", appointment: null });
    }

    res.json({ message: "Marked as no-show", appointment });
  } catch (err) {
    console.error("Doctor no-show error:", err);
    res.status(500).json({ message: "Failed to mark no-show" });
  }
});

// GET /api/doctor/patients/:patientId/history
// Doctor can look up a specific patient's history
router.get("/patients/:patientId/history", ensureDoctor, async (req, res) => {
  try {
    // Verify doctor exists
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not linked" });
    }

    const appointments = await Appointment.find({
      doctor: doctor._id,
      patient: req.params.patientId,
    })
      .sort({ date: -1, startTime: -1 })
      .populate("patient", "name phone");

    res.json(appointments);
  } catch (err) {
    console.error("Doctor patient history error:", err);
    res.status(500).json({ message: "Failed to fetch patient history" });
  }
});

module.exports = router;