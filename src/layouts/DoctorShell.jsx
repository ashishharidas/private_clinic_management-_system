import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function DoctorShell({ children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role) document.body.setAttribute("data-theme", "doctor");
    return () => document.body.removeAttribute("data-theme");
  }, [user]);

  return (
    <div>
      <main className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        {children}
      </main>
    </div>
  );
}