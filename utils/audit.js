const AuditLog = require("../models/AuditLog");

/**
 * Log a sensitive action to the AuditLog collection.
 * @param {Object} opts
 * @param {Object} opts.user - req.user (the actor)
 * @param {string} opts.action - e.g. "login", "booking", "cancel", "update-profile"
 * @param {string} opts.targetType - e.g. "User", "Doctor", "Appointment"
 * @param {string|ObjectId} [opts.targetId] - target document id
 * @param {string} [opts.targetInfo] - human-readable summary
 * @param {Object} [opts.req] - express request (for ip/userAgent)
 * @param {boolean} [opts.success] - whether the action succeeded
 * @param {string} [opts.errorMessage] - error message if failed
 * @param {Object} [opts.metadata] - additional data
 */
async function logAudit({
  user,
  action,
  targetType,
  targetId,
  targetInfo,
  req,
  success = true,
  errorMessage,
  metadata,
}) {
  try {
    const log = new AuditLog({
      actor: user?._id || null,
      role: user?.role || "unknown",
      action,
      targetType,
      targetId,
      targetInfo,
      ip: req?.ip || req?.headers?.["x-forwarded-for"] || "unknown",
      userAgent: req?.headers?.["user-agent"] || "unknown",
      success,
      errorMessage,
      metadata,
    });
    await log.save();
  } catch (err) {
    // Never let audit logging break the main request
    console.error("Audit log error:", err.message);
  }
}

module.exports = { logAudit };