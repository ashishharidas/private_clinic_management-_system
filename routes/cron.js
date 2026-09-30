const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const { generateSlotsForDoctor } = require("../utils/generateSlots");

// Shared secret — Vercel Cron sends this in a header so the public can't trigger it.
// Set CRON_SECRET in your Vercel dashboard (Environment Variables).
function checkSecret(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured → allow (dev convenience)
  const header = req.headers["x-cron-secret"];
  const query = req.query.secret;
  return header === secret || query === secret;
}

// GET /api/cron/generate-slots
// Regenerates the 7-day rolling slot window for every active doctor.
// Idempotent — the unique index on Slot prevents duplicates.
router.get("/cron/generate-slots", async (req, res) => {
  if (!checkSecret(req)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const doctors = await Doctor.find({ isActive: true });
    let totalSlots = 0;

    for (const doctor of doctors) {
      const before = await Doctor.db.collection("slots").countDocuments({
        doctor: doctor._id,
      });
      await generateSlotsForDoctor(doctor, 7);
      const after = await Doctor.db.collection("slots").countDocuments({
        doctor: doctor._id,
      });
      totalSlots += after - before;
    }

    res.json({
      message: "Slot generation complete",
      doctorsProcessed: doctors.length,
      newSlots: totalSlots,
    });
  } catch (err) {
    console.error("Cron generate-slots error:", err);
    res.status(500).json({ message: "Slot generation failed" });
  }
});

module.exports = router;
