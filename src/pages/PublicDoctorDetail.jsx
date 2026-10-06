import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import Modal from "../components/primitives/Modal";

export default function PublicDoctorDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingSlot, setBookingSlot] = useState(null); // The slot to be booked
  const [message, setMessage] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    loadDoctor();
  }, [slug]);

  async function loadDoctor() {
    setLoading(true);
    setError("");
    setMessage(null);
    try {
      const res = await api.get(`/public/doctors/${slug}`);
      setDoctor(res.data.doctor);
      setSlots(res.data.upcomingSlots || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Doctor not found");
      } else {
        setError("Couldn't load doctor details");
      }
      setDoctor(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleBook() {
    if (!bookingSlot) return;

    setIsBooking(true);
    setMessage(null);
    try {
      const res = await api.post("/appointments/book", { slotId: bookingSlot._id });
      setMessage({
        type: "success",
        text: `Booked! Your token number is #${res.data.tokenNumber}.`,
      });
      setBookingSlot(null);
      // Refresh slots after booking
      loadDoctor();
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else if (err.response?.status === 409) {
        setMessage({
          type: "error",
          text: err.response.data.message,
        });
        setBookingSlot(null);
        loadDoctor(); // Refresh to remove taken slot
      } else {
        setMessage({
          type: "error",
          text: "Something went wrong. Try again.",
        });
        setBookingSlot(null);
      }
    } finally {
      setIsBooking(false);
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  }

  if (loading) return <div className="spinner" style={{ marginTop: 24 }} />;

  if (!doctor) {
    return (
      <div>
        <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <h3>Doctor not found</h3>
            <p>{error || "The doctor you're looking for doesn't exist or is no longer available."}</p>
            <button className="btn btn-outline" onClick={() => navigate("/public/doctors/search")}>
              Browse Doctors
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1>{doctor.name}</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-outline"
              onClick={() => navigate("/public/doctors/search")}
            >
              ← Back to search
            </button>
            <button
              className="btn btn-primary"
              onClick={() => window.location.href = "/login"}
            >
              Book Appointment
            </button>
          </div>
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

        {/* Booking Confirmation Modal */}
        <Modal
          open={!!bookingSlot}
          onClose={() => setBookingSlot(null)}
          title="Confirm Appointment"
          footer={
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setBookingSlot(null)} disabled={isBooking}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleBook} disabled={isBooking}>
                {isBooking ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          }
        >
          <p>
            You are booking a <strong>{doctor?.slotDurationMinutes} minute</strong> slot with <strong>{doctor?.name}</strong>{" "}
            on {bookingSlot ? formatDate(bookingSlot.date) : ""} at <strong>{bookingSlot?.startTime}</strong>.
          </p>
        </Modal>

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            {doctor.photo && (
              <img
                src={doctor.photo}
                alt={`${doctor.name} photo`}
                style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }}
              />
            )}
            <div>
              <p style={{ margin: "4px 0", fontWeight: 500, color: "var(--color-primary)" }}>
                {doctor.specialization}
              </p>
              {doctor.clinicName && (
                <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "var(--color-ink)" }}>
                  {doctor.clinicName}
                </p>
              )}
              {doctor.bio && (
                <p style={{ marginTop: 12, lineHeight: 1.5, color: "var(--color-ink-soft)" }}>
                  {doctor.bio}
                </p>
              )}
              <div style={{ marginTop: 12, fontSize: "0.9rem", color: "var(--color-ink-soft)" }}>
                <strong>Experience:</strong> {doctor.experienceYears || 0} years
              </div>
              <div style={{ marginTop: 8, fontSize: "0.9rem", color: "var(--color-ink-soft)" }}>
                <strong>Slot duration:</strong> {doctor.slotDurationMinutes} minutes
              </div>
              {doctor.fee && (
                <div style={{ marginTop: 8, fontSize: "0.9rem", color: "var(--color-ink)" }}>
                  <strong>Consultation fee:</strong> ${doctor.fee}
                </div>
              )}
            </div>
          </div>
        </div>

        <h2>Available Slots</h2>
        <p>Each visit is a {doctor.slotDurationMinutes}-minute slot. Tap a time to hold it.</p>

        {loading && <div className="spinner" style={{ marginTop: 24 }} />}

        {!loading && slots.length === 0 && (
          <div className="empty-state" style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="empty-state-icon">📅</div>
            <h3>No open slots this week</h3>
            <p>This doctor has no availability in the next 7 days.</p>
          </div>
        )}

        {!loading && slots.length > 0 && (
          <>
            {Object.entries(
              slots.reduce((acc, slot) => {
                acc[slot.date] = acc[slot.date] || [];
                acc[slot.date].push(slot);
                return acc;
              }, {})
            ).map(([date, daySlots]) => (
              <div key={date} style={{ marginBottom: 28 }}>
                <h3>{formatDate(date)}</h3>
                <div style={styles.slotGrid}>
                  {daySlots.map((slot) => (
                    <button
                      key={slot._id}
                      className="btn btn-outline"
                      onClick={() => setBookingSlot(slot)}
                      style={{ minWidth: 90 }}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  slotGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
};