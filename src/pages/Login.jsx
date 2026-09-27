import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  function handleGoogleLogin() {
    // Real browser redirect — not a fetch call. This hands off to Google's
    // login page, and Google redirects back to our backend callback URL.
    window.location.href = "http://localhost:5000/api/auth/google";
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>Patient portal</p>
        <h1 style={styles.heading}>Book a doctor,<br />not a headache.</h1>
        <p style={styles.sub}>
          See real-time availability, hold a 30-minute slot, and keep every
          visit's history in one place.
        </p>
        <button style={styles.googleBtn} onClick={handleGoogleLogin}>
          <GoogleIcon />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    maxWidth: 440,
    textAlign: "left",
  },
  eyebrow: {
    color: "var(--color-accent)",
    fontWeight: 600,
    fontSize: "0.85rem",
    marginBottom: 12,
  },
  heading: {
    fontSize: "2.6rem",
    marginBottom: 16,
  },
  sub: {
    fontSize: "1.05rem",
    marginBottom: 32,
  },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "white",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    padding: "13px 22px",
    fontSize: "0.98rem",
    fontWeight: 600,
    color: "var(--color-ink)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
};
