import { useEffect, useState } from "react";
import api from "../api/client";
import Navbar from "../components/Navbar";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminDashboard() {
  const [tab, setTab] = useState("doctors");
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(""); // Add error state

  // ─── Create Doctor form ───
  const [createForm, setCreateForm] = useState({
    name: "",
    specialization: "",
    clinicName: "",
    slotDurationMinutes: 30,
    workingHours: [],
  });

  // ─── Edit form ───
  const [editingDoctor, setEditingDoctor] = useState(null);

  // ─── Link user form ───
  const [linkForm, setLinkForm] = useState({ doctorId: "", email: "" });

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    setLoading(true);
    try {
      const res = await api.get("/admin/doctors");
      setDoctors(res.data);
      // Pre-populate link-form doctor dropdown
      setLinkForm((f) => ({ ...f, doctorId: res.data[0]?._id || "" }));
    } catch {
      setMessage({ type: "error", text: "Couldn't load doctors." });
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch {
      setMessage({ type: "error", text: "Couldn't load users." });
    } finally {
      setLoading(false);
    }
  }

  // ─── Create ───
  async function handleCreate(e) {
    e.preventDefault();
    setMessage(null);
    try {
      await api.post("/admin/doctors", createForm);
      setMessage({ type: "success", text: "Doctor created." });
      setCreateForm({ name: "", specialization: "", clinicName: "", slotDurationMinutes: 30, workingHours: [] });
      loadDoctors();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to create doctor." });
    }
  }

  // ─── Edit ───
  async function handleEdit(e) {
    e.preventDefault();
    const form = e.target;
    const updates = new FormData(form);
    const data = Object.fromEntries(updates.entries());
    data.slotDurationMinutes = Number(data.slotDurationMinutes);

    // Parse workingHours JSON from the hidden textarea
    const whRaw = data.workingHours;
    delete data.workingHours;
    try { data.workingHours = JSON.parse(whRaw || "[]"); } catch { data.workingHours = []; }

    setMessage(null);
    try {
      await api.patch(`/admin/doctors/${editingDoctor._id}`, data);
      setMessage({ type: "success", text: "Doctor updated." });
      setEditingDoctor(null);
      loadDoctors();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update doctor." });
    }
  }

  // ─── Deactivate ───
  async function handleDeactivate(doctorId) {
    if (!confirm("Deactivate this doctor? They won't appear in patient listings but their appointment history stays intact.")) return;
    setMessage(null);
    try {
      await api.patch(`/admin/doctors/${doctorId}/deactivate`);
      setMessage({ type: "success", text: "Doctor deactivated." });
      loadDoctors();
    } catch {
      setMessage({ type: "error", text: "Failed to deactivate doctor." });
    }
  }

  // ─── Link user ───
  async function handleLink(e) {
    e.preventDefault();
    setMessage(null);
    try {
      await api.patch(`/admin/doctors/${linkForm.doctorId}/link-user`, { email: linkForm.email });
      setMessage({ type: "success", text: "Google account linked — they should now see the Doctor dashboard." });
      setLinkForm({ doctorId: "", email: "" });
      loadDoctors();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to link user." });
    }
  }

  // ─── WorkingHours helper ───
  function addShift() {
    const wh = [...createForm.workingHours];
    wh.push({ day: "", start: "10:00", end: "13:00" });
    setCreateForm({ ...createForm, workingHours: wh });
  }

  function updateShift(idx, field, value) {
    const wh = [...createForm.workingHours];
    wh[idx][field] = value;
    setCreateForm({ ...createForm, workingHours: wh });
  }

  function removeShift(idx) {
    const wh = [...createForm.workingHours];
    wh.splice(idx, 1);
    setCreateForm({ ...createForm, workingHours: wh });
  }

  function handleCreateChange(e) {
    const { name, value } = e.target;
    setCreateForm((f) => ({ ...f, [name]: value }));
  }

  const doctorOptions = doctors.filter((d) => d.isActive);

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <h1>Admin panel</h1>

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

        {/* Tabs */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <button
            className={tab === "doctors" ? "btn btn-primary" : "btn btn-outline"}
            onClick={() => setTab("doctors")}
          >
            Doctors
          </button>
          <button
            className={tab === "link" ? "btn btn-primary" : "btn btn-outline"}
            onClick={() => { setTab("link"); loadUsers(); }}
          >
            Link Google account
          </button>
        </div>

        {/* ─── DOCTORS TAB ─── */}
        {tab === "doctors" && !editingDoctor && (
          <div>
            {/* Create doctor */}
            <div className="card" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>Create a doctor</h2>
              <form onSubmit={handleCreate}>
                <div style={styles.formGrid}>
                  <input
                    type="text"
                    name="name"
                    placeholder="Full name"
                    className="form-input"
                    value={createForm.name}
                    onChange={handleCreateChange}
                    required
                  />
                  <input
                    type="text"
                    name="specialization"
                    placeholder="Specialization (e.g. General Physician)"
                    className="form-input"
                    value={createForm.specialization}
                    onChange={handleCreateChange}
                    required
                  />
                  <input
                    type="text"
                    name="clinicName"
                    placeholder="Clinic name"
                    className="form-input"
                    value={createForm.clinicName}
                    onChange={handleCreateChange}
                    required
                  />
                  <input
                    type="number"
                    name="slotDurationMinutes"
                    placeholder="Slot duration (min)"
                    className="form-input"
                    value={createForm.slotDurationMinutes}
                    onChange={handleCreateChange}
                    min="15"
                    step="15"
                  />
                </div>

                {/* Working hours */}
                <div style={{ marginTop: 16 }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                    Working hours
                  </label>
                  {createForm.workingHours.map((shift, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <select
                        className="form-input"
                        value={shift.day}
                        onChange={(e) => updateShift(idx, "day", e.target.value)}
                        style={{ flex: 1 }}
                        required
                      >
                        <option value="">Select day</option>
                        {DAYS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <input
                        type="time"
                        className="form-input"
                        value={shift.start}
                        onChange={(e) => updateShift(idx, "start", e.target.value)}
                        style={{ flex: 1 }}
                        required
                      />
                      <span style={{ color: "var(--color-ink-soft)" }}>—</span>
                      <input
                        type="time"
                        className="form-input"
                        value={shift.end}
                        onChange={(e) => updateShift(idx, "end", e.target.value)}
                        style={{ flex: 1 }}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => removeShift(idx)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline" onClick={addShift}>
                    + Add shift
                  </button>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>
                  Create doctor
                </button>
              </form>
            </div>

            {/* Doctor list */}
            <div>
              <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Existing doctors</h2>
              {loading && <div className="spinner" />}
              {!loading && doctors.length === 0 && <p>No doctors yet.</p>}
              {!loading && doctors.length > 0 && (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Specialization</th>
                      <th>Clinic</th>
                      <th>Shifts</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doc) => (
                      <tr key={doc._id}>
                        <td>{doc.name}</td>
                        <td>{doc.specialization}</td>
                        <td>{doc.clinicName}</td>
                        <td style={{ fontSize: "0.85rem", color: "var(--color-ink-soft)" }}>
                          {doc.workingHours?.length > 0
                            ? doc.workingHours.map((w) => `${w.day} ${w.start}–${w.end}`).join(", ")
                            : "—"}
                        </td>
                        <td>
                          <span className={`badge badge-${doc.isActive ? "booked" : "cancelled"}`}>
                            {doc.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ whiteSpace: "nowrap", display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-outline"
                            style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                            onClick={() => setEditingDoctor(doc)}
                          >
                            Edit
                          </button>
                          {doc.isActive && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                              onClick={() => handleDeactivate(doc._id)}
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ─── EDIT DOCTOR ─── */}
        {editingDoctor && (
          <div className="card">
            <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>Edit: {editingDoctor.name}</h2>
            <form onSubmit={handleEdit}>
              <div style={styles.formGrid}>
                <input type="text" name="name" defaultValue={editingDoctor.name} className="form-input" required />
                <input type="text" name="specialization" defaultValue={editingDoctor.specialization} className="form-input" required />
                <input type="text" name="clinicName" defaultValue={editingDoctor.clinicName} className="form-input" required />
                <input type="number" name="slotDurationMinutes" defaultValue={editingDoctor.slotDurationMinutes || 30} className="form-input" min="15" step="15" />
              </div>
              <input
                type="hidden"
                name="workingHours"
                defaultValue={JSON.stringify(editingDoctor.workingHours || [])}
              />
              <p style={{ fontSize: "0.85rem", color: "var(--color-ink-soft)" }}>
                Working hours: {editingDoctor.workingHours?.length} shift(s). Use the create form to make structural changes to shifts.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button type="submit" className="btn btn-primary">Save changes</button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingDoctor(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── LINK USER TAB ─── */}
        {tab === "link" && (
          <div className="card">
            <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>Link Google account to doctor</h2>
            <p style={{ fontSize: "0.9rem", color: "var(--color-ink-soft)" }}>
              The user must have already logged in once via Google so their account exists in the DB.
            </p>
            <form onSubmit={handleLink}>
              <div style={styles.formGrid}>
                <select
                  className="form-input"
                  value={linkForm.doctorId}
                  onChange={(e) => setLinkForm({ ...linkForm, doctorId: e.target.value })}
                  required
                >
                  <option value="">Pick a doctor</option>
                  {doctorOptions.map((doc) => (
                    <option key={doc._id} value={doc._id}>{doc.name} — {doc.specialization}</option>
                  ))}
                </select>
                <input
                  type="email"
                  className="form-input"
                  placeholder="User's Google email address"
                  value={linkForm.email}
                  onChange={(e) => setLinkForm({ ...linkForm, email: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>
                Link account
              </button>
            </form>

            {/* Users list for quick lookup */}
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: "1rem", marginBottom: 8 }}>All users in the system</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.9rem",
  },
};

// Inject form-input styles that match the .btn/.card pattern
const styleSheet = document?.styleSheets?.[0];
if (styleSheet && !document.querySelector("#admin-styles")) {
  const style = document.createElement("style");
  style.id = "admin-styles";
  style.textContent = `
    .form-input {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius);
      font-family: var(--font-body);
      font-size: 0.95rem;
      background: var(--color-surface);
    }
    .form-input:focus { outline: none; border-color: var(--color-primary); }
    table th { text-align: left; padding: 8px 12px; border-bottom: 2px solid var(--color-border); color: var(--color-ink-soft); font-weight: 600; }
    table td { padding: 8px 12px; border-bottom: 1px solid var(--color-border); }
    table tbody tr:hover { background: #F7F5F0; }
  `;
  document.head.appendChild(style);
}
