import { useEffect, useState } from "react";
import api from "../api/client";
import Modal from "../components/primitives/Modal";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminDashboard() {
  const [tab, setTab] = useState("doctors");
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [createForm, setCreateForm] = useState({
    name: "", specialization: "", clinicName: "", slotDurationMinutes: 30, workingHours: [],
  });
  const [linkForm, setLinkForm] = useState({ doctorId: "", email: "" });

  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  useEffect(() => { loadDoctors(); }, []);

  async function loadDoctors() {
    setLoading(true);
    try {
      const res = await api.get("/admin/doctors");
      setDoctors(res.data);
      if (res.data.length > 0) {
          setLinkForm((f) => ({ ...f, doctorId: res.data[0]?._id || "" }));
      }
    } catch { setMessage({ type: "error", text: "Couldn't load doctors." }); }
    finally { setLoading(false); }
  }

  async function loadUsers() {
    setLoading(true);
    try { const res = await api.get("/admin/users"); setUsers(res.data); }
    catch { setMessage({ type: "error", text: "Couldn't load users." }); }
    finally { setLoading(false); }
  }

  async function loadAuditLogs() {
    setLoading(true);
    try { const res = await api.get("/admin/audit-logs"); setAuditLogs(res.data); }
    catch { setMessage({ type: "error", text: "Couldn't load logs." }); }
    finally { setLoading(false); }
  }

  function openCreateModal() {
    setEditingDoctor(null);
    setCreateForm({ name: "", specialization: "", clinicName: "", slotDurationMinutes: 30, workingHours: [] });
    setIsDoctorModalOpen(true);
  }

  function openEditModal(doc) {
    setEditingDoctor(doc);
    setCreateForm({
      name: doc.name,
      specialization: doc.specialization,
      clinicName: doc.clinicName,
      slotDurationMinutes: doc.slotDurationMinutes || 30,
      workingHours: doc.workingHours || [],
    });
    setIsDoctorModalOpen(true);
  }

  async function handleDoctorSave(e) {
    if (e) e.preventDefault();
    try {
      if (editingDoctor) {
        await api.patch(`/admin/doctors/${editingDoctor._id}`, createForm);
        setMessage({ type: "success", text: "Doctor updated." });
      } else {
        await api.post("/admin/doctors", createForm);
        setMessage({ type: "success", text: "Doctor created." });
      }
      setIsDoctorModalOpen(false);
      loadDoctors();
    } catch (err) { setMessage({ type: "error", text: err.response?.data?.message || "Failed." }); }
  }

  async function handleDeactivate(docId) {
    if (!window.confirm("Are you sure you want to deactivate this doctor?")) return;
    try {
        await api.patch(`/admin/doctors/${docId}/deactivate`);
        setMessage({ type: "success", text: "Doctor deactivated." });
        loadDoctors();
    } catch (err) { setMessage({ type: "error", text: "Failed to deactivate." }); }
  }

  async function handleLink(e) {
    e.preventDefault();
    try {
      await api.patch(`/admin/doctors/${linkForm.doctorId}/link-user`, { email: linkForm.email });
      setMessage({ type: "success", text: "Doctor linked successfully." });
      setLinkForm({ doctorId: doctors[0]?._id || "", email: "" });
      loadDoctors();
      loadUsers();
    } catch (err) { setMessage({ type: "error", text: err.response?.data?.message || "Linking failed." }); }
  }

  async function updateStaffRole(userId, newRole) {
    try {
      await api.patch(`/admin/staff/${userId}/role`, { role: newRole });
      setMessage({ type: "success", text: "Role updated." });
      loadUsers();
    } catch { setMessage({ type: "error", text: "Failed." }); }
  }

  function addShift() {
    setCreateForm(prev => ({ ...prev, workingHours: [...prev.workingHours, { day: "Monday", start: "10:00", end: "13:00" }] }));
  }

  function updateShift(idx, field, value) {
    const wh = [...createForm.workingHours];
    wh[idx][field] = value;
    setCreateForm({ ...createForm, workingHours: wh });
  }

  function removeShift(idx) {
    setCreateForm(prev => ({ ...prev, workingHours: prev.workingHours.filter((_, i) => i !== idx) }));
  }

  return (
    <div className="container" style={{ padding: "36px 0 60px" }}>
      <h1>Admin panel</h1>
      {message && <div style={{ padding: 12, marginBottom: 20, background: message.type==='error'?'var(--color-danger-bg)':'var(--color-success-bg)', color: message.type==='error'?'var(--color-danger)':'var(--color-success)' }}>{message.text}</div>}

      <div style={{ display: "flex", gap: 10, marginBottom: 28, borderBottom: '1px solid var(--color-border)' }}>
        {["doctors", "link", "staff", "logs"].map(t => (
          <button key={t} className={`btn ${tab === t ? "btn-primary" : "btn-outline"}`} style={{borderBottomRightRadius:0, borderBottomLeftRadius: 0, marginBottom: -1}} onClick={() => { setTab(t); if (t === "link" || t === "staff") loadUsers(); if (t === "logs") loadAuditLogs(); }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === "doctors" && (
        <div>
          <button className="btn btn-primary" onClick={openCreateModal} style={{marginBottom: 20}}>+ Add Doctor</button>
          {loading ? <div className="spinner" /> : (
            <div className="card">
                <table style={{width: '100%', textAlign: 'left'}}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Specialization</th>
                            <th>Clinic</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctors.map(d => (
                            <tr key={d._id}>
                                <td>{d.name}</td>
                                <td>{d.specialization}</td>
                                <td>{d.clinicName}</td>
                                <td><span className={`badge ${d.isActive ? 'badge-completed' : 'badge-cancelled'}`}>{d.isActive ? 'Active' : 'Inactive'}</span></td>
                                <td style={{display: 'flex', gap: 8}}>
                                    <button className="btn btn-outline" style={{padding: '4px 8px'}} onClick={() => openEditModal(d)}>Edit</button>
                                    {d.isActive && <button className="btn btn-danger" style={{padding: '4px 8px'}} onClick={() => handleDeactivate(d._id)}>Deactivate</button>}
                                </td>
                            </tr>
                        ))}
                        {doctors.length === 0 && <tr><td colSpan="5">No doctors found.</td></tr>}
                    </tbody>
                </table>
            </div>
          )}
        </div>
      )}

      {tab === "link" && (
          <div className="card">
              <h3>Link Google Account to Doctor Profile</h3>
              <form onSubmit={handleLink} style={{display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400}}>
                  <div>
                      <label style={{display: 'block', marginBottom: 4}}>Doctor Profile</label>
                      <select className="form-input" value={linkForm.doctorId} onChange={e => setLinkForm({...linkForm, doctorId: e.target.value})} required>
                          <option value="">Select a doctor</option>
                          {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                  </div>
                  <div>
                      <label style={{display: 'block', marginBottom: 4}}>User Email</label>
                      <input type="email" className="form-input" value={linkForm.email} onChange={e => setLinkForm({...linkForm, email: e.target.value})} placeholder="doctor@clinic.com" required />
                  </div>
                  <button type="submit" className="btn btn-primary">Link Account</button>
              </form>

              <h3 style={{marginTop: 32}}>Registered Users</h3>
              <table style={{width: '100%', textAlign: 'left'}}>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                  <tbody>
                      {users.map(u => (
                          <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td><span className="badge badge-booked">{u.role}</span></td></tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {tab === "staff" && (
          <div className="card">
              <h3>Staff Management</h3>
              {loading ? <div className="spinner" /> : (
                  <table style={{width: '100%', textAlign: 'left'}}>
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
                    <tbody>
                        {users.filter(u => u.role === 'staff' || u.role === 'manager').map(u => (
                            <tr key={u._id}>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td><span className="badge badge-booked">{u.role}</span></td>
                                <td>
                                    <select className="form-input" value={u.role} onChange={e => updateStaffRole(u._id, e.target.value)}>
                                        <option value="staff">Staff</option>
                                        <option value="manager">Manager</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                  </table>
              )}
          </div>
      )}

      {tab === "logs" && (
          <div className="card">
              <h3>Audit Logs</h3>
              {loading ? <div className="spinner" /> : (
                  <table style={{width: '100%', textAlign: 'left', fontSize: '0.9rem'}}>
                    <thead><tr><th>Time</th><th>Action</th><th>Actor</th><th>Target Info</th></tr></thead>
                    <tbody>
                        {auditLogs.map(l => (
                            <tr key={l._id}>
                                <td style={{whiteSpace: 'nowrap'}}>{new Date(l.createdAt).toLocaleString()}</td>
                                <td>{l.action}</td>
                                <td>{l.actor?.email || 'System'}</td>
                                <td>{l.targetInfo}</td>
                            </tr>
                        ))}
                        {auditLogs.length === 0 && <tr><td colSpan="4">No logs found.</td></tr>}
                    </tbody>
                  </table>
              )}
          </div>
      )}

      {/* Doctor Modal */}
      <Modal open={isDoctorModalOpen} onClose={() => setIsDoctorModalOpen(false)} title={editingDoctor ? "Edit Doctor" : "Add Doctor"} size="large" footer={<button className="btn btn-primary" onClick={handleDoctorSave}>Save</button>}>
        <div style={{ display: "grid", gap: 16 }}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
                <div>
                    <label style={{display: 'block', fontSize: '0.9rem', marginBottom: 4}}>Name</label>
                    <input className="form-input" placeholder="Name" value={createForm.name} onChange={e=>setCreateForm({...createForm, name: e.target.value})}/>
                </div>
                <div>
                    <label style={{display: 'block', fontSize: '0.9rem', marginBottom: 4}}>Specialization</label>
                    <input className="form-input" placeholder="Specialty" value={createForm.specialization} onChange={e=>setCreateForm({...createForm, specialization: e.target.value})}/>
                </div>
                <div>
                    <label style={{display: 'block', fontSize: '0.9rem', marginBottom: 4}}>Clinic Name</label>
                    <input className="form-input" placeholder="Clinic Name" value={createForm.clinicName} onChange={e=>setCreateForm({...createForm, clinicName: e.target.value})}/>
                </div>
                <div>
                    <label style={{display: 'block', fontSize: '0.9rem', marginBottom: 4}}>Slot Duration (mins)</label>
                    <input type="number" className="form-input" placeholder="30" value={createForm.slotDurationMinutes} onChange={e=>setCreateForm({...createForm, slotDurationMinutes: e.target.value})}/>
                </div>
            </div>

            <div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                    <h4 style={{margin:0}}>Working Hours</h4>
                    <button className="btn btn-outline" style={{padding: '4px 8px'}} onClick={addShift}>+ Add Shift</button>
                </div>
                {createForm.workingHours.map((wh, idx) => (
                    <div key={idx} style={{display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center'}}>
                        <select className="form-input" value={wh.day} onChange={e=>updateShift(idx, 'day', e.target.value)}>
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <input type="time" className="form-input" value={wh.start} onChange={e=>updateShift(idx, 'start', e.target.value)} />
                        <span>to</span>
                        <input type="time" className="form-input" value={wh.end} onChange={e=>updateShift(idx, 'end', e.target.value)} />
                        <button className="btn btn-danger" style={{padding: '4px 8px'}} onClick={() => removeShift(idx)}>✕</button>
                    </div>
                ))}
                {createForm.workingHours.length === 0 && <p style={{fontSize: '0.9rem', color: 'var(--color-ink-soft)'}}>No working hours set.</p>}
            </div>
        </div>
      </Modal>

    </div>
  );
}
