const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { ensureAdmin } = require("../middleware/auth");

// ---- GET /api/admin/doctors ----
// List all doctors (active and inactive)
router.get("/doctors", ensureAdmin, async (req, res) => {
  try {
    const doctors = await Doctor.find({})
      .sort({ name: 1 })
      .lean();
    res.json(doctors);
  } catch (err) {
    console.error("Admin doctors fetch error:", err);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
});

// ---- POST /api/admin/doctors ----
// Create a doctor (name, specialization, clinicName, workingHours, slotDurationMinutes)
router.post("/doctors", ensureAdmin, async (req, res) => {
  try {
    const {
      name,
      specialization,
      clinicName,
      workingHours,
      slotDurationMinutes,
    } = req.body;

    if (!name || !specialization || !clinicName) {
      return res.status(400).json({
        message: "Missing required fields: name, specialization, clinicName",
      });
    }

    const doctor = new Doctor({
      name,
      specialization,
      clinicName,
      workingHours: workingHours || [],
      slotDurationMinutes: slotDurationMinutes || 30,
      isActive: true,
    });

    await doctor.save();
    res.status(201).json(doctor);
  } catch (err) {
    console.error("Admin doctor creation error:", err);
    res.status(500).json({ message: "Failed to create doctor" });
  }
});

// ---- PATCH /api/admin/doctors/:id ----
// Edit a doctor's details or working hours
router.patch("/doctors/:id", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove _id from updates if present
    if (updates._id) delete updates._id;

    const doctor = await Doctor.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(doctor);
  } catch (err) {
    console.error("Admin doctor update error:", err);
    res.status(500).json({ message: "Failed to update doctor" });
  }
});

// ---- PATCH /api/admin/doctors/:id/deactivate ----
// Set isActive: false (don't hard-delete — preserves appointment history integrity)
router.patch("/doctors/:id/deactivate", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findByIdAndUpdate(id, { isActive: false }, {
      new: true,
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(doctor);
  } catch (err) {
    console.error("Admin doctor deactivate error:", err);
    res.status(500).json({ message: "Failed to deactivate doctor" });
  }
});

// ---- GET /api/admin/users ----
// List users, to find a Google-logged-in user by email
router.get("/users", ensureAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select("name email role googleId")
      .sort({ name: 1 })
      .lean();
    res.json(users);
  } catch (err) {
    console.error("Admin users fetch error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// ---- POST /api/admin/doctors/:id/link-user ----
// body: { email }, finds the User by email, sets their role to "doctor",
// and sets Doctor.user to that User's _id
router.patch("/doctors/:id/link-user", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find the User by email
    const user = await User.findOne({ email }).lean();

    if (!user) {
      return res.status(404).json({ message: "User with that email not found" });
    }

    // Check if a Doctor doc already exists for this user
    let doctor = await Doctor.findOne({ user: user._id }).lean();

    if (doctor) {
      return res.status(400).json({
        message: "This user already has a doctor profile linked",
      });
    }

    // Create a new Doctor doc linked to this User
    doctor = new Doctor({
      name: user.name,
      email: user.email,
      specialization: "General Practitioner", // default, can be edited later
      clinicName: "", // empty, can be edited later
      workingHours: [],
      slotDurationMinutes: 30,
      isActive: true,
      user: user._id, // link to User
    });

    await doctor.save();

    // Update the User's role to "doctor"
    await User.findByIdAndUpdate(user._id, { role: "doctor" });

    res.status(201).json({ doctor, user });
  } catch (err) {
    console.error("Admin link-user error:", err);
    res.status(500).json({ message: "Failed to link user to doctor" });
  }
});

module.exports = router;