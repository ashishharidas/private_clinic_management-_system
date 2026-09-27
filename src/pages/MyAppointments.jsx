import { useEffect, useState } from "react";
import api from "../api/client";
import Navbar from "../components/Navbar";

export default function MyAppointments() {
  const [tab, setTab] = useState("upcoming"); // "upcoming" | "history"
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  function loadAll() {
    setLoading(true);
    Promise.all([api.get("/appointments/upcoming"), api.get("/appointments/history")])
      .then(([up, hist]) => {
        setUpcoming(up.data);
        setHistory(hist.data);
      })
      .finally(() => setLoading(false));
  }

  async function handleCancel(id) {
    const reason = window.prompt("Reason for cancelling (e.g. emergency, feeling better)?");
    if (reason === null) return; // user hit cancel on the prompt itself

    setCancellingId(id);
    try {
      await api.post(`/appointments/${id}/cancel`, { reason });
      loadAll();
    } catch {
      alert("Couldn't cancel — please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  const list = tab === "upcoming" ? upcoming : history;

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <h1>My appointments</h1>

        <div style={styles.tabs}>
          <button
            className={tab === "upcoming" ? "btn btn-primary" : "btn btn-outline"}
            onClick={() => setTab("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={tab === "history" ? "btn btn-primary" : "btn btn-outline"}
            onClick={() => setTab("history")}
          >
            History
          </button>
        </div>

        {loading && <div className="spinner" style={{ marginTop: 24 }} />}

        {!loading && list.length === 0 && (
          <div className="empty-state">
            <h3>{tab === "upcoming" ? "Nothing booked yet" : "No past visits"}</h3>
            <p>{tab === "upcoming" ? "Book a slot from the dashboard to see it here." : "Your visit history will show up here."}</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          {list.map((appt) => (
            <div key={appt._id} className="card" style={styles.row}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={{ margin: 0 }}>{appt.doctor?.name}</h3>
                  <span className={`badge badge-${appt.status}`}>{appt.status.replace("-", " ")}</span>
                </div>
                <p style={{ margin: "4px 0 0" }}>
                  {appt.doctor?.specialization} · {appt.doctor?.clinicName}
                </p>
                <p style={{ margin: "2px 0 0", fontWeight: 500, color: "var(--color-ink)" }}>
                  {formatDate(appt.date)} at {appt.startTime} · Token #{appt.tokenNumber}
                </p>
                {appt.consultationNotes && (
                  <p style={{ marginTop: 8, fontSize: "0.9rem" }}>
                    <strong>Doctor's notes:</strong> {appt.consultationNotes}
                  </p>
                )}
              </div>

              {tab === "upcoming" && appt.status === "booked" && (
                <button
                  className="btn btn-danger"
                  disabled={cancellingId === appt._id}
                  onClick={() => handleCancel(appt._id)}
                >
                  {cancellingId === appt._id ? "Cancelling…" : "Cancel"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

const styles = {
  tabs: { display: "flex", gap: 10, marginBottom: 8 },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
};
