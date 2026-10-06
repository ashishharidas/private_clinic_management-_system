import { Link } from 'react-router-dom';
import { useState, useEffect } from "react";
import api from "../api/client";

export default function PublicDoctorSearch() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useState({ query: "", specialty: "" });

  useEffect(() => {
    searchDoctors();
  }, [searchParams.query, searchParams.specialty]);

  async function searchDoctors() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/public/doctors/search", {
        params: searchParams,
      });
      setDoctors(res.data);
    } catch (err) {
      setError("Couldn't search doctors");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearchParams({ query: e.target.query.value, specialty: e.target.specialty.value });
  }

  function handleClear() {
    setSearchParams({ query: "", specialty: "" });
  }

  

  return (
    <div>
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <h1>Find a Doctor</h1>
        <p>Search by name, specialty, or clinic</p>

        <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
          <div style={styles.searchRow}>
            <input
              name="query"
              value={searchParams.query}
              onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
              placeholder="Doctor name or clinic"
              className="form-input"
            />
            <input
              name="specialty"
              value={searchParams.specialty}
              onChange={(e) => setSearchParams({ ...searchParams, specialty: e.target.value })}
              placeholder="Specialty (e.g. Cardiologist)"
              className="form-input"
            />
            <button type="submit" className="btn btn-primary">Search</button>
            <button type="button" className="btn btn-outline" onClick={handleClear}>
              Clear
            </button>
          </div>
        </form>

        {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

        {loading && <div className="spinner" style={{ marginTop: 24 }} />}

        {!loading && doctors.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-state-icon">👨‍⚕️</div>
            <h3>No doctors found</h3>
            <p>Try a different search or check back later.</p>
          </div>
        )}

        {!loading && doctors.length > 0 && (
          <div style={styles.grid}>
            {doctors.map((doc) => (
              <div key={doc.slug} className="card" style={styles.card}>
                <Link to={`/public/doctors/${doc.slug || doc._id}`}>
                  <h3 style={{ marginBottom: 4 }}>{doc.name}</h3>
                  <p style={{ margin: 0, fontWeight: 500, color: "var(--color-primary)" }}>
                    {doc.specialization}
                  </p>
                  {doc.clinicName && <p style={{ fontSize: "0.9rem", marginTop: 4 }}>{doc.clinicName}</p>}
                  <div style={{ marginTop: 8, fontSize: "0.9rem", color: "var(--color-ink-soft)" }}>
                    {doc.workingHours?.map((w) => `${w.day} ${w.start}–${w.end}`).join(", ") || "Schedule varies"}
                  </div>
                  <p style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--color-ink)" }}>
                    {doc.fee ? `Consultation fee: $${doc.fee}` : ""}
                    {doc.experienceYears && ` • ${doc.experienceYears} years experience`}
                  </p>
                </Link>
                <button
                  className="btn btn-outline"
                  style={{ marginTop: 8 }}
                  onClick={() => window.location.href = "/login"}
                >
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


const styles = {
  searchRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
};