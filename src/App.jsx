import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PublicDoctorDetail from "./pages/PublicDoctorDetail";
import PublicDoctorSearch from "./pages/PublicDoctorSearch";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorSlots from "./pages/DoctorSlots";
import MyAppointments from "./pages/MyAppointments";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import ChangePassword from "./pages/ChangePassword";
import PatientProfile from "./pages/PatientProfile";

import AdminShell from "./components/layout/AdminShell";
import DoctorShell from "./components/layout/DoctorShell";
import PatientShell from "./components/layout/PatientShell";
import StaffShell from "./components/layout/StaffShell";

function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === "staff" && (user.role === "manager" || user.role === "admin" || user.role === "staff")) {} else if (role && user.role !== role) { return <Navigate to="/login" replace />; }
  return children;
}

function AdminOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== "admin") return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      {/* Change Password - No role-specific shell since anyone can trigger it */}
      <Route path="/change-password" element={
        <Protected><ChangePassword /></Protected>
      } />

      {/* Public / Patient Portal */}
      <Route element={<PatientShell />}>
        {/* Public Routes */}
        <Route path="/public/doctors/search" element={<PublicDoctorSearch />} />
        <Route path="/public/doctors/:slug" element={<PublicDoctorDetail />} />
        
        {/* Protected Patient Routes */}
        <Route path="/dashboard" element={<Protected role="patient"><Dashboard /></Protected>} />
        <Route path="/doctors/:doctorId" element={<Protected role="patient"><DoctorSlots /></Protected>} />
        <Route path="/appointments" element={<Protected role="patient"><MyAppointments /></Protected>} />
        <Route path="/profile" element={<Protected role="patient"><PatientProfile /></Protected>} />
      </Route>

      {/* Doctor Portal */}
      <Route element={<DoctorShell />}>
        <Route path="/doctor/dashboard" element={<Protected role="doctor"><DoctorDashboard /></Protected>} />
      </Route>

      {/* Admin Portal */}
      <Route element={<AdminShell />}>
        <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
      </Route>
      
      {/* Staff Portal */}
      <Route element={<StaffShell />}>
        <Route path="/staff" element={<Protected role="staff"><StaffDashboard /></Protected>} />
      </Route>

      {/* Dynamic Catch-All Redirect based on role */}
      <Route path="*" element={
        user ? (
          user.role === 'admin' ? <Navigate to="/admin" replace /> :
          user.role === 'doctor' ? <Navigate to="/doctor/dashboard" replace /> :
          user.role === 'staff' || user.role === 'manager' ? <Navigate to="/staff" replace /> :
          <Navigate to="/dashboard" replace />
        ) : <Navigate to="/login" replace />
      } />
    </Routes>
  );
}
