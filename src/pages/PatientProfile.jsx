import { useState, useEffect } from "react";
import api from "../api/client";

export default function PatientProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await api.get("/patient/profile");
      setProfile(res.data);
    } catch {
      setMessage({ type: "error", text: "Couldn't load profile" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      // Convert checkbox arrays
      const patientProfile = {
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
        bloodGroup: data.bloodGroup || null,
        emergencyContact: {
          name: data.emergencyContactName || "",
          phone: data.emergencyContactPhone || "",
          relationship: data.emergencyContactRelationship || "",
        },
        medicalHistory: data.medicalHistory?.split(",").map(s => s.trim()).filter(Boolean) || [],
        allergies: data.allergies?.split(",").map(s => s.trim()).filter(Boolean) || [],
        currentMedications: data.currentMedications?.split(",").map(s => s.trim()).filter(Boolean) || [],
      };

      await api.put("/patient/profile", {
        name: data.name,
        phone: data.phone,
        patientProfile,
      });

      setMessage({ type: "success", text: "Profile updated" });
      loadProfile();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="spinner" style={{ marginTop: 24 }} />;

  return (
    <div>
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <h1>My Profile</h1>

        {message && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius)",
              marginBottom: 20,
              background: message.type === "error" ? "var(--color-danger-bg)" : "var(--color-success-bg)",
              color: message.type === "error" ? "var(--color-danger)" : "var(--color-success)",
              fontWeight: 500,
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={styles.grid}>
            <input
              name="name"
              defaultValue={profile?.name}
              placeholder="Full name"
              className="form-input"
              required
            />
            <input
              name="phone"
              defaultValue={profile?.phone}
              placeholder="Phone number"
              className="form-input"
            />
            <input
              name="dateOfBirth"
              type="date"
              defaultValue={profile?.patientProfile?.dateOfBirth?.split("T")[0] || ""}
              className="form-input"
            />
            <select name="gender" className="form-input" defaultValue={profile?.patientProfile?.gender || ""}>
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
            <select name="bloodGroup" className="form-input" defaultValue={profile?.patientProfile?.bloodGroup || ""}>
              <option value="">Blood group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <fieldset style={{ marginTop: 24, border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: 16 }}>
            <legend style={{ fontWeight: 600, padding: "0 8px" }}>Emergency Contact</legend>
            <div style={styles.grid}>
              <input
                name="emergencyContactName"
                defaultValue={profile?.patientProfile?.emergencyContact?.name || ""}
                placeholder="Name"
                className="form-input"
              />
              <input
                name="emergencyContactPhone"
                defaultValue={profile?.patientProfile?.emergencyContact?.phone || ""}
                placeholder="Phone"
                className="form-input"
              />
              <input
                name="emergencyContactRelationship"
                defaultValue={profile?.patientProfile?.emergencyContact?.relationship || ""}
                placeholder="Relationship"
                className="form-input"
              />
            </div>
          </fieldset>

          <fieldset style={{ marginTop: 16, border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: 16 }}>
            <legend style={{ fontWeight: 600, padding: "0 8px" }}>Medical Info (comma-separated)</legend>
            <textarea
              name="medicalHistory"
              defaultValue={profile?.patientProfile?.medicalHistory?.join(", ") || ""}
              placeholder="Medical history (e.g. Diabetes, Hypertension)"
              className="form-textarea"
            />
            <textarea
              name="allergies"
              defaultValue={profile?.patientProfile?.allergies?.join(", ") || ""}
              placeholder="Allergies (e.g. Penicillin, Peanuts)"
              className="form-textarea"
              style={{ marginTop: 12 }}
            />
            <textarea
              name="currentMedications"
              defaultValue={profile?.patientProfile?.currentMedications?.join(", ") || ""}
              placeholder="Current medications"
              className="form-textarea"
              style={{ marginTop: 12 }}
            />
          </fieldset>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 20 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginTop: 16,
  },
};