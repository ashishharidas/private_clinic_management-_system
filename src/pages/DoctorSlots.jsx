import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";

export default function DoctorSlots() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null); // slot currently being booked (for a per-button spinner)
  const [message, setMessage] = useState(null); // { type: "error"|"success", text }

  useEffect(() => {
    loadSlots();
  }, [doctorId]);

  function loadSlots() {
    setLoading(true);
    api
      .get(`/doctors/${doctorId}/slots`)
      .then((res) => setSlots(res.data))
      .catch(() => setMessage({ type: "error", text: "Couldn't load slots." }))
      .finally(() => setLoading(false));
  }

  // Group slots by date so we can show a clear day-by-day layout, like BookMyShow's date tabs
  const slotsByDate = slots.reduce((acc, slot) => {
    acc[slot.date] = acc[slot.date] || [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  async function handleBook(slotId) {
    setBookingId(slotId);
    setMessage(null);
    try {
      const res = await api.post("/appointments/book", { slotId });
      setMessage({
        type: "success",
        text: `Booked! Your token number is #${res.data.tokenNumber}.`,
      });
      // Remove the now-booked slot from view and refresh from server to stay accurate
      loadSlots();
    } catch (err) {
      if (err.response?.status === 409) {
        // This is the race-condition case — someone else grabbed it first
        setMessage({ type: "error", text: err.response.data.message });
        loadSlots(); // refresh so the taken slot disappears
      } else if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setMessage({ type: "error", text: "Something went wrong. Try again." });
      }
    } finally {
      setBookingId(null);
    }
  }

  return (
    <div>
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <button className="btn btn-outline" onClick={() => navigate("/dashboard")} style={{ marginBottom: 20 }}>
          ← Back to doctors
        </button>

        <h1>Available slots</h1>
        <p>Each visit is a 30-minute slot. Tap a time to hold it.</p>

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

        {!loading && Object.keys(slotsByDate).length === 0 && (
          <div className="empty-state">
            <h3>No open slots this week</h3>
            <p>This doctor has no availability in the next 7 days.</p>
          </div>
        )}

        {Object.entries(slotsByDate).map(([date, daySlots]) => (
          <div key={date} style={{ marginBottom: 28 }}>
            <h3>{formatDate(date)}</h3>
            <div style={styles.slotGrid}>
              {daySlots.map((slot) => (
                <button
                  key={slot._id}
                  className="btn btn-outline"
                  disabled={bookingId === slot._id}
                  onClick={() => handleBook(slot._id)}
                  style={{ minWidth: 90 }}
                >
                  {bookingId === slot._id ? <span className="spinner" style={{ width: 16, height: 16 }} /> : slot.startTime}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

const styles = {
  slotGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
};
