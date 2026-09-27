const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    photo: { type: String },
    phone: { type: String },
    role: { type: String, enum: ["patient", "doctor", "admin"], default: "patient" },
  },
  { timestamps: true } // adds createdAt/updatedAt automatically
);

module.exports = mongoose.model("User", userSchema);
