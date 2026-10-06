const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true, enum: ["patient", "doctor", "admin", "staff", "manager"] },

    // What action was performed
    action: { type: String, required: true }, // e.g., "create", "update", "delete", "login", "booking", "cancel", "complete"

    // Target resource
    targetType: { type: String, required: true }, // "User", "Doctor", "Appointment", "Slot", "Auth"
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetInfo: { type: String }, // human-readable summary (e.g., "Appointment #123 for Dr. Smith")

    // Request context
    ip: { type: String },
    userAgent: { type: String },

    // Additional metadata
    metadata: { type: mongoose.Schema.Types.Mixed }, // flexible extra data

    // Result
    success: { type: Boolean, default: true },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

// Indexes for common queries
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 }); // general recency

module.exports = mongoose.model("AuditLog", auditLogSchema);