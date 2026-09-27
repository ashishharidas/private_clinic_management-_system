const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const Slot = require("../models/Slot");

// List all doctors (patients browse this)
router.get("/", async (req, res) => {
  const doctors = await Doctor.find({ isActive: true }).select("-onLeaveDates");
  res.json(doctors);
});

// Get one doctor's available slots for the next 7 days
router.get("/:doctorId/slots", async (req, res) => {
  const { doctorId } = req.params;

  const today = new Date();
  const weekLater = new Date();
  weekLater.setDate(today.getDate() + 7);

  const slots = await Slot.find({
    doctor: doctorId,
    date: { $gte: today.toISOString().split("T")[0], $lte: weekLater.toISOString().split("T")[0] },
    status: "available", // only show bookable ones
  }).sort({ date: 1, startTime: 1 });

  res.json(slots);
});

module.exports = router;
