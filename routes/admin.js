const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { ensureAdmin } = require("../middleware/auth");
const { generateUniqueSlug } = require("../utils/slug");
const { logAudit } = require("../utils/audit");

// ---- GET /api/admin/doctors ----
router.get("/doctors", ensureAdmin, async (req, res) => {
  try {
    const doctors = await Doctor.find({}).sort({ name: 1 }).lean();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
});

// ---- POST /api/admin/doctors ----
router.post("/doctors", ensureAdmin, async (req, res) => {
  try {
    const { name, specialization, clinicName, workingHours, slotDurationMinutes, bio, fee, experienceYears } = req.body;
    if (!name || !specialization || !clinicName) {
      return res.status(400).json({ message: "Missing required fields: name, specialization, clinicName" });
    }
    const slug = await generateUniqueSlug(name);
    const doctor = new Doctor({
      name, specialization, clinicName, slug,
      workingHours: workingHours || [],
      slotDurationMinutes: slotDurationMinutes || 30,
      bio, fee, experienceYears, isActive: true,
    });
    await doctor.save();
    await logAudit({ user: req.user, action: "create-doctor", targetType: "Doctor", targetId: doctor._id, targetInfo: `Created doctor: ${doctor.name}`, req });
    res.status(201).json(doctor);
  } catch (err) {
    res.status(500).json({ message: "Failed to create doctor" });
  }
});

// ---- PATCH /api/admin/doctors/:id ----
router.patch("/doctors/:id", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates._id) delete updates._id;
    if (updates.name) updates.slug = await generateUniqueSlug(updates.name, id);
    
    // Security schema protection against mass assignment on core fields is handled partly by schema,
    // but typically we'd extract only allowed fields. For now, it's admin so we trust the payload structure 
    // unless strictly enforcing.
    if (updates.user) delete updates.user;

    const doctor = await Doctor.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    await logAudit({ user: req.user, action: "update-doctor", targetType: "Doctor", targetId: doctor._id, targetInfo: `Updated doctor: ${doctor.name}`, req });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: "Failed to update doctor" });
  }
});

// ---- PATCH /api/admin/doctors/:id/deactivate ----
router.patch("/doctors/:id/deactivate", ensureAdmin, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    await logAudit({ user: req.user, action: "deactivate-doctor", targetType: "Doctor", targetId: doctor._id, targetInfo: `Deactivated doctor: ${doctor.name}`, req });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: "Failed to deactivate doctor" });
  }
});

// ---- GET /api/admin/users ----
router.get("/users", ensureAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select("name email role googleId").sort({ name: 1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// ---- GET /api/admin/staff ----
router.get("/staff", ensureAdmin, async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ["staff", "manager"] } }).select("name email role staffRole createdAt").sort({ name: 1 }).lean();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch staff" });
  }
});

// ---- PATCH /api/admin/staff/:id/role ----
router.patch("/staff/:id/role", ensureAdmin, async (req, res) => {
  try {
    const { role, staffRole } = req.body;
    if (role && !["staff", "manager"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    const updates = {};
    if (role) updates.role = role;
    if (staffRole !== undefined) updates.staffRole = staffRole;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "Staff member not found" });

    await logAudit({ user: req.user, action: "update-staff-role", targetType: "User", targetId: user._id, targetInfo: `Updated role for ${user.email} to ${user.role}`, req });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update staff role" });
  }
});

// ---- PATCH /api/admin/doctors/:id/link-user ----
router.patch("/doctors/:id/link-user", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ message: "User with that email not found" });

    // Ensure the Doctor profile actually exists before we link
    const doctorObj = await Doctor.findById(id);
    if (!doctorObj) return res.status(404).json({ message: "Doctor profile not found" });

    // Check if user is already linked to another doctor
    let existingLinkedDoctor = await Doctor.findOne({ user: user._id }).lean();
    if (existingLinkedDoctor && existingLinkedDoctor._id.toString() !== id) {
      return res.status(400).json({ message: "This user already has a different doctor profile linked" });
    }

    doctorObj.user = user._id; // link to User
    await doctorObj.save();

    await User.findByIdAndUpdate(user._id, { role: "doctor" });

    await logAudit({
      user: req.user,
      action: "link-user-to-doctor",
      targetType: "Doctor",
      targetId: doctorObj._id,
      targetInfo: `Linked user ${user.email} to doctor profile`,
      req,
    });

    res.status(200).json({ doctor: doctorObj, user });
  } catch (err) {
    res.status(500).json({ message: "Failed to link user to doctor" });
  }
});

// ---- GET /api/admin/audit-logs ----
router.get("/audit-logs", ensureAdmin, async (req, res) => {
  try {
    const AuditLog = require("../models/AuditLog");
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100).populate("actor", "name email").lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

module.exports = router;
