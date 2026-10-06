import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Dashboard() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/doctors")
      .then((res) => setDoctors(res.data))
      .catch(() => setError("Couldn't load doctors right now."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1>Choose a doctor</h1>
      <p>Pick who you'd like to see — availability covers the next 7 days.</p>

      {loading && <div className="spinner" style={{ marginTop: 24 }} />}
      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      {!loading && doctors.length === 0 && !error && (
        <div className="empty-state">
          <h3>No doctors listed yet</h3>
          <p>Check back soon, or contact the clinic directly.</p>
        </div>
      )}

      <div style={styles.grid}>
        {doctors.map((doc) => (
          <div key={doc._id} className="card" style={styles.card}>
            <h3 style={{ marginBottom: 4 }}>{doc.name}</h3>
            <p style={{ margin: 0, fontWeight: 500, color: "var(--color-primary)" }}>
              {doc.specialization}
            </p>
            <p style={{ fontSize: "0.9rem", marginTop: 4 }}>{doc.clinicName}</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 8 }}
              onClick={() => navigate(`/doctors/${doc._id}`)}
            >
              View slots
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 16,
    marginTop: 24,
  },
  card: { display: "flex", flexDirection: "column", gap: 4 },
};
