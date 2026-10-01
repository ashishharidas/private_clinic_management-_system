import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import Navbar from "../components/Navbar";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [queue, setQueue] = useState([]);
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadQueue();
  }, [date]);

  async function loadQueue() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get(`/doctor/queue?date=${date}`);
      setDoctorName(res.data.doctor);
      setQueue(res.data.appointments);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else if (err.response?.status === 403) {
        setMessage({ type: "error", text: err.response.data.message });
      } else {
        setMessage({ type: "error", text: "Couldn't load queue." });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(appt) {
    if (!appt.patient) return;
    const notes = window.prompt(`Consultation notes for ${appt.patient.name}:`);
    if (notes === null) return; // user cancelled

    const prescription = window.prompt("Prescription (optional):");

    setProcessingId(appt._id);
    setMessage(null);
    try {
      await api.patch(`/doctor/appointments/${appt._id}/complete`, {
        consultationNotes: notes || "",
        prescription: prescription || "",
      });
      setMessage({ type: "success", text: `Visit completed for ${appt.patient.name}.` });
      loadQueue();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to complete visit." });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleNoShow(appt) {
    if (!confirm(`Mark ${appt.patient?.name} as no-show? This frees up the slot.`)) return;

    setProcessingId(appt._id);
    setMessage(null);
    try {
      await api.patch(`/doctor/appointments/${appt._id}/no-show`);
      setMessage({ type: "success", text: `${appt.patient?.name} marked as no-show. Slot freed.` });
      loadQueue();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to mark no-show." });
    } finally {
      setProcessingId(null);
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1>Doctor Dashboard</h1>
            <p>Dr. {doctorName} — {formatDate(date)}</p>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid var(--color-border)" }}
          />
        </div>

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

        {loading && <div className="spinner" style={{ marginTop: 24 }} />}

        {!loading && queue.length === 0 && (
          <div className="empty-state">
            <h3>No appointments today</h3>
            <p>All clear for this date.</p>
          </div>
        )}

        {!loading && queue.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {queue.map((appt) => (
              <div key={appt._id} className="card" style={styles.row}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span className="badge badge-booked" style={styles.token}>Token #{appt.tokenNumber}</span>
                    <h3 style={{ margin: 0 }}>{appt.patient?.name || "Unknown"}</h3>
                    {appt.patient?.phone && <span style={{ color: "var(--color-ink-soft)", fontSize: "0.9rem" }}>{appt.patient.phone}</span>}
                    <span className={`badge badge-${appt.status}`}>{appt.status.replace("-", " ")}</span>
                  </div>
                  <p style={{ margin: "4px 0 0", color: "var(--color-ink-soft)" }}>
                    {appt.startTime} – {appt.endTime}
                  </p>
                  {appt.consultationNotes && (
                    <p style={{ marginTop: 8, fontSize: "0.9rem" }}>
                      <strong>Notes:</strong> {appt.consultationNotes}
                    </p>
                  )}
                  {appt.prescription && (
                    <p style={{ marginTop: 4, fontSize: "0.9rem" }}>
                      <strong>Prescription:</strong> {appt.prescription}
                    </p>
                  )}
                </div>

                <div style={styles.actions}>
                  {appt.status === "booked" && (
                    <>
                      <button
                        className="btn btn-primary"
                        disabled={processingId === appt._id}
                        onClick={() => handleComplete(appt)}
                      >
                        {processingId === appt._id ? "Completing…" : "Complete Visit"}
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={processingId === appt._id}
                        onClick={() => handleNoShow(appt)}
                      >
                        {processingId === appt._id ? "Processing…" : "No-Show"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  token: { fontSize: "0.8rem", padding: "3px 8px" },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
};