const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const Slot = require("../models/Slot");

// ---- GET /api/public/doctors/search ----
// Public search: patients can browse doctors without logging in.
// Query params: ?q= (name/specialization) &specialty= (fuzzy)
router.get("/doctors/search", async (req, res) => {
  try {
    const { q, specialty } = req.query;

    const query = { isActive: true };

    // Name / clinic search (substring, case-insensitive)
    if (q?.trim()) {
      const pattern = new RegExp(q.trim(), "i");
      query.$or = [
        { name: pattern },
        { specialization: pattern },
        { clinicName: pattern },
      ];
    }

    // Specialty match (fuzzy)
    if (specialty?.trim()) {
      const pattern = new RegExp(specialty.trim(), "i");
      query.$or = query.$or || [];
      query.$or.push({ specialization: pattern });
    }

    const doctors = await Doctor.find(query)
      .select("name specialization clinicName bio fee experienceYears workingHours slotDurationMinutes -_id")
      .sort({ name: 1 });

    res.json(doctors);
  } catch (err) {
    console.error("Public search error:", err);
    res.status(500).json({ message: "Failed to search doctors" });
  }
});

// ---- GET /api/public/doctors/:slug ----
// Public detail page: /api/public/doctors/:slug
// Shows full doctor info + upcoming available slots (no auth required)
// NOTE: booking still requires login — the GET just exposes browseable data.
router.get("/doctors/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const doctor = await Doctor.findOne({ slug }).select("-onLeaveDates");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Public-facing response (no internal fields)
    const publicDoctor = {
      _id: doctor._id,
      name: doctor.name,
      slug: doctor.slug,
      specialization: doctor.specialization,
      clinicName: doctor.clinicName,
      bio: doctor.bio,
      fee: doctor.fee,
      experienceYears: doctor.experienceYears,
      slotDurationMinutes: doctor.slotDurationMinutes,
      workingHours: doctor.workingHours,
      isActive: doctor.isActive,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
    };

    // Also return the next 3 days of available slots for the frontend
    const slotsRes = await Doctor.findDoctorSlots(doctor._id, 3);

    res.json({
      doctor: publicDoctor,
      upcomingSlots: slotsRes,
    });
  } catch (err) {
    console.error("Public doctor detail error:", err);
    res.status(500).json({ message: "Failed to fetch doctor" });
  }
});

module.exports = router;