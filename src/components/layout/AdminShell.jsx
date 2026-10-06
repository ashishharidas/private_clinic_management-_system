import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminShell() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: "/admin", label: "Dashboard" },
    { to: "/public/doctors/search", label: "Find Doctors" },
  ];

  return (
    <div style={styles.layout}>
      <nav style={styles.nav}>
        <div style={styles.logo}>Clinic Admin</div>
        <div style={styles.navLinks}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                ...styles.navLink,
                ...(location.pathname === item.to ? styles.navLinkActive : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div style={styles.userSection}>
          <span style={styles.userName}>{user?.name}</span>
          <button onClick={async () => { await logout(); window.location.href="/login"; }} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  layout: { minHeight: "100vh", display: "flex", flexDirection: "column" },
  nav: {
    display: "flex", alignItems: "center", padding: "12px 24px",
    borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)",
  },
  logo: { fontWeight: 700, fontSize: "1.2rem", marginRight: 32 },
  navLinks: { display: "flex", gap: 24, flex: 1 },
  navLink: { textDecoration: "none", color: "var(--color-ink-soft)", fontSize: "0.95rem" },
  navLinkActive: { color: "var(--color-primary)", fontWeight: 600 },
  userSection: { display: "flex", alignItems: "center", gap: 12 },
  userName: { fontSize: "0.9rem", color: "var(--color-ink-soft)" },
  logoutBtn: {
    padding: "6px 14px", borderRadius: "var(--radius)", border: "1px solid var(--color-border)",
    background: "transparent", cursor: "pointer", fontSize: "0.85rem",
  },
  main: { flex: 1, padding: 24 },
};