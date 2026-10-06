import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ChangePassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await api.post("/auth/change-password", form);
      setMessage("Password changed successfully");
      setForm({ currentPassword: "", newPassword: "" });
      if (user.role === "admin") { navigate("/admin"); } else if (user.role === "doctor") { navigate("/doctor/dashboard"); } else if (user.role === "staff" || user.role === "manager") { navigate("/staff"); } else { navigate("/dashboard"); };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;
  if (!user.mustChangePassword) {
    if (user.role === "admin") { navigate("/admin"); } else if (user.role === "doctor") { navigate("/doctor/dashboard"); } else if (user.role === "staff" || user.role === "manager") { navigate("/staff"); } else { navigate("/dashboard"); };
    return null;
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Change Password</h1>
        <p style={styles.sub}>
          Please change your password before accessing the dashboard.
        </p>
        {error && <p style={{ color: "var(--color-danger)", marginBottom: 12 }}>{error}</p>}
        {message && <p style={{ color: "var(--color-success)", marginBottom: 12 }}>{message}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
              Current Password
            </label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
              style={styles.input}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
              New Password
            </label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
              minLength={8}
              style={styles.input}
            />
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-ink-soft)", marginBottom: 16 }}>
            Your new password must be at least 8 characters long.
          </p>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? "Changing…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    maxWidth: 400,
    textAlign: "left",
    background: "var(--color-surface)",
    padding: 32,
    borderRadius: "var(--radius)",
    border: "1px solid var(--color-border)",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: 16,
    textAlign: "center",
  },
  sub: {
    fontSize: "1rem",
    color: "var(--color-ink-soft)",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-body)",
    fontSize: "0.95rem",
  },
};