import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// role: redirect to dashboard if user's role doesn't match (strict mode)
// strict: false -> just let the page render and handle role inside the page (e.g. public-facing pages)
export default function ProtectedRoute({ children, role, strict = true }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User has an account but must change password first
  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (strict && role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}