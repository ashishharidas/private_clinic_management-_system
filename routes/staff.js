const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { ensureAuthenticated, requirePermission } = require("../middleware/auth");
const ensureStaffOrHigher = requirePermission("staff:read-appointments");

// All routes here require staff, manager, or admin role

// ---- GET /api/staff/appointments ----
// Read-only: list all appointments with filters (date, doctor, status, patient)
router.get("/appointments", ensureStaffOrHigher, async (req, res) => {
  try {
    const { date, doctorId, status, patientId, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (date) filter.date = date;
    if (doctorId) filter.doctor = doctorId;
    if (status) filter.status = status;
    if (patientId) filter.patient = patientId;

    const appointments = await Appointment.find(filter)
      .populate("doctor", "name specialization clinicName")
      .populate("patient", "name email phone")
      .sort({ date: -1, startTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    const total = await Appointment.countDocuments(filter);

    res.json({ appointments, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (err) {
    console.error("Staff appointments error:", err);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

// ---- GET /api/staff/doctors ----
// Read-only: list all doctors (active + inactive)
router.get("/doctors", ensureStaffOrHigher, async (req, res) => {
  try {
    const doctors = await Doctor.find({})
      .select("-onLeaveDates")
      .sort({ name: 1 });
    res.json(doctors);
  } catch (err) {
    console.error("Staff doctors error:", err);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
});

// ---- GET /api/staff/queue?date=&doctorId= ----
// Read-only: view today's queue for any doctor
router.get("/queue", ensureStaffOrHigher, async (req, res) => {
  try {
    const { date, doctorId } = req.query;
    const queryDate = date || new Date().toISOString().split("T")[0];

    const filter = { date: queryDate, status: { $in: ["booked", "completed", "no-show"] } };
    if (doctorId) filter.doctor = doctorId;

    const appointments = await Appointment.find(filter)
      .populate("doctor", "name specialization")
      .populate("patient", "name phone")
      .sort({ startTime: 1 });

    // Group by doctor for display
    const grouped = appointments.reduce((acc, appt) => {
      const docName = appt.doctor?.name || "Unknown Doctor";
      acc[docName] = acc[docName] || [];
      acc[docName].push(appt);
      return acc;
    }, {});

    res.json({ date: queryDate, grouped });
  } catch (err) {
    console.error("Staff queue error:", err);
    res.status(500).json({ message: "Failed to fetch queue" });
  }
});

// ---- GET /api/staff/audit-logs ----
// Read audit logs (manager + admin only)
router.get("/audit-logs", ensureStaffOrHigher, requirePermission("manager:read-audit"), async (req, res) => {
  try {
    const { action, targetType, actor, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    if (actor) filter.actor = actor;

    const logs = await AuditLog.find(filter)
      .populate("actor", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    const total = await AuditLog.countDocuments(filter);

    res.json({ logs, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (err) {
    console.error("Audit logs error:", err);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

// ---- GET /api/staff/stats ----
// Dashboard stats for staff/manager/admin
router.get("/stats", ensureStaffOrHigher, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const [
      totalDoctors,
      activeDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      weekAppointments,
      completedToday,
      cancelledToday,
      noShowToday,
    ] = await Promise.all([
      Doctor.countDocuments({}),
      Doctor.countDocuments({ isActive: true }),
      User.countDocuments({ role: "patient" }),
      Appointment.countDocuments({}),
      Appointment.countDocuments({ date: today }),
      Appointment.countDocuments({ date: { $gte: weekStartStr } }),
      Appointment.countDocuments({ date: today, status: "completed" }),
      Appointment.countDocuments({ date: today, status: "cancelled" }),
      Appointment.countDocuments({ date: today, status: "no-show" }),
    ]);

    res.json({
      totalDoctors,
      activeDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      weekAppointments,
      completedToday,
      cancelledToday,
      noShowToday,
    });
  } catch (err) {
    console.error("Staff stats error:", err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

module.exports = router;