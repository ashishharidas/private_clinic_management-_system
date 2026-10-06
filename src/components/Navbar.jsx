import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  // When not logged in, show minimal nav
  if (!user) {
    return (
      <header style={styles.header}>
        <div className="container" style={styles.inner}>
          <Link to="/dashboard" style={styles.brand}>
            Clinic Care
          </Link>
          <nav style={styles.nav}>
            <Link to="/public/doctors/search" style={styles.link}>
              Find Doctors
            </Link>
            <Link to="/login" style={styles.link}>
              Log in
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  const isStaff = ["staff", "manager", "admin"].includes(user.role);

  return (
    <header style={styles.header}>
      <div className="container" style={styles.inner}>
        <Link to="/dashboard" style={styles.brand}>
          Clinic Care
        </Link>
        <nav style={styles.nav}>
          <Link to="/dashboard" style={styles.link}>
            Book a visit
          </Link>
          <Link to="/appointments" style={styles.link}>
            My appointments
          </Link>
          {user.role === "admin" && (
            <Link to="/admin" style={styles.link}>
              Admin panel
            </Link>
          )}
          {user.role === "doctor" && (
            <Link to="/doctor" style={styles.link}>
              Doctor dashboard
            </Link>
          )}
          {isStaff && (
            <Link to="/staff" style={styles.link}>
              Staff panel
            </Link>
          )}
          {user.role === "patient" && (
            <Link to="/profile" style={styles.link}>
              My profile
            </Link>
          )}
        </nav>
        <div style={styles.userArea}>
          {user.photo && <img src={user.photo} alt="" style={styles.avatar} />}
          <span style={styles.name}>{user.name.split(" ")[0]}</span>
          <button className="btn btn-outline" onClick={handleLogout} style={{ padding: "6px 14px" }}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    borderBottom: "1px solid var(--color-border)",
    background: "var(--color-surface)",
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    gap: 24,
  },
  brand: {
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: "1.2rem",
    color: "var(--color-primary-dark)",
    textDecoration: "none",
  },
  nav: { display: "flex", gap: 20, flex: 1, marginLeft: 24 },
  link: {
    color: "var(--color-ink-soft)",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: "0.95rem",
  },
  userArea: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { width: 30, height: 30, borderRadius: "50%" },
  name: { fontWeight: 600, fontSize: "0.9rem" },
};