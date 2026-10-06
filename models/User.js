const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    name: { type: String, required: true, trim: true },
    photo: { type: String },
    phone: { type: String },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin", "staff", "manager"],
      default: "patient",
    },
    staffRole: {
      type: String,
      enum: ["receptionist", "pharmacist", "assistant"],
      default: null,
    },
    mustChangePassword: { type: Boolean, default: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    profileComplete: { type: Boolean, default: false },
    patientProfile: {
      dateOfBirth: { type: Date },
      gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
      bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
      emergencyContact: {
        name: { type: String },
        phone: { type: String },
        relationship: { type: String },
      },
      medicalHistory: [{ type: String }],
      allergies: [{ type: String }],
      currentMedications: [{ type: String }],
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ role: 1 });

// Instance: compare a candidate password with this user's hash
userSchema.methods.isValidPassword = async function (candidate) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidate, this.passwordHash);
};

// Static: hash a plaintext password
userSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, 12);
};

module.exports = mongoose.model("User", userSchema);