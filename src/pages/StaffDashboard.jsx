import { useState, useEffect } from "react";
import api from "../api/client";

export default function StaffDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/staff/stats");
      setStats(res.data);
    } catch (err) {
      setError("Couldn't load staff dashboard.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="spinner" style={{ marginTop: 24 }} />;

  return (
    <div>
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <h1>Staff Panel</h1>
        <p>View-only dashboard for staff and manager roles.</p>

        {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

        {stats && (
          <div style={styles.grid}>
            <div className="card">
              <h3 style={{ marginBottom: 4, color: "var(--color-primary-dark)" }}>{stats.totalDoctors}</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-ink-soft)" }}>Total Doctors</p>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 4, color: "var(--color-primary-dark)" }}>{stats.activeDoctors}</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-ink-soft)" }}>Active Doctors</p>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 4, color: "var(--color-primary-dark)" }}>{stats.totalPatients}</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-ink-soft)" }}>Patients</p>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 4, color: "var(--color-primary-dark)" }}>{stats.totalAppointments}</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-ink-soft)" }}>Total Appointments</p>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 4, color: "var(--color-primary-dark)" }}>{stats.todayAppointments}</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-ink-soft)" }}>Today's Appointments</p>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 4, color: "var(--color-primary-dark)" }}>{stats.weekAppointments}</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-ink-soft)" }}>Week Appointments</p>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: "1.2rem" }}>Recent Activity</h2>
          <div className="card" style={{ marginTop: 12 }}>
            <p style={{ margin: 0, color: "var(--color-ink-soft)" }}>
              Staff can view all appointments (read-only). Contact an admin for write access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 16,
    marginTop: 16,
  },
};