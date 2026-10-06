import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function StaffShell({ children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role) document.body.setAttribute("data-theme", "staff");
  }, [user]);

  return (
    <div>
      <main className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        {children}
      </main>
    </div>
  );
}