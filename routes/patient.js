const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const { ensureAuthenticated, requirePermission, requireOwnership } = require("../middleware/auth");
const { logAudit } = require("../utils/audit");

// All routes in this file require an authenticated patient

// ---- GET /api/patient/profile ----
// Returns the current user's profile (excluding passwordHash)
router.get("/profile", ensureAuthenticated, requirePermission("patient:read-profile"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Patient profile fetch error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// ---- PUT /api/patient/profile ----
// Updates patient profile fields
router.put("/profile", ensureAuthenticated, requirePermission("patient:read-profile"), async (req, res) => {
  try {
    const {
      name,
      phone,
      patientProfile,
    } = req.body;

    const allowedUpdates = {};

    if (name) allowedUpdates.name = name.trim();
    if (phone) allowedUpdates.phone = phone.trim();

    // Patient-specific profile fields
    if (patientProfile) {
      const {
        dateOfBirth,
        gender,
        bloodGroup,
        emergencyContact,
        medicalHistory,
        allergies,
        currentMedications,
      } = patientProfile;

      allowedUpdates.patientProfile = {};

      if (dateOfBirth) allowedUpdates.patientProfile.dateOfBirth = dateOfBirth;
      if (gender) allowedUpdates.patientProfile.gender = gender;
      if (bloodGroup) allowedUpdates.patientProfile.bloodGroup = bloodGroup;

      if (emergencyContact) {
        allowedUpdates.patientProfile.emergencyContact = {
          name: emergencyContact.name?.trim() || "",
          phone: emergencyContact.phone?.trim() || "",
          relationship: emergencyContact.relationship?.trim() || "",
        };
      }

      if (Array.isArray(medicalHistory)) {
        allowedUpdates.patientProfile.medicalHistory = medicalHistory
          .map((s) => s?.trim())
          .filter(Boolean);
      }
      if (Array.isArray(allergies)) {
        allowedUpdates.patientProfile.allergies = allergies.map((s) => s?.trim()).filter(Boolean);
      }
      if (Array.isArray(currentMedications)) {
        allowedUpdates.patientProfile.currentMedications = currentMedications
          .map((s) => s?.trim())
          .filter(Boolean);
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updated) return res.status(404).json({ message: "User not found" });

    // Audit
    await logAudit({
      user: req.user,
      action: "update-profile",
      targetType: "User",
      targetId: req.user._id,
      targetInfo: `Updated own profile`,
      req,
    });

    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    console.error("Patient profile update error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ---- GET /api/patient/appointments ----
// Returns upcoming and past appointments for the current patient
router.get("/appointments", ensureAuthenticated, requirePermission("patient:read-profile"), async (req, res) => {
  try {
    const { status } = req.query; // "upcoming" | "history" | undefined = all

    const filter = { patient: req.user._id };
    if (status === "upcoming") {
      const today = new Date().toISOString().split("T")[0];
      filter.date = { $gte: today };
      filter.status = "booked";
    } else if (status === "history") {
      filter.status = { $in: ["completed", "cancelled", "no-show"] };
    }

    const appointments = await Appointment.find(filter)
      .populate("doctor", "name specialization clinicName")
      .sort({ date: -1, startTime: -1 });

    res.json(appointments);
  } catch (err) {
    console.error("Patient appointments fetch error:", err);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

module.exports = router;