import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        setUserTheme(res.data.user?.role);
      })
      .catch(() => {
        setUser(null);
        document.body.removeAttribute("data-theme");
      })
      .finally(() => setLoading(false));
  }, []);

  function setUserTheme(role) {
    if (!role) {
      document.body.removeAttribute("data-theme");
      return;
    }
    // Map roles to themes — patient/admin/staff all have direct themes,
    // manager inherits staff theme
    const themeMap = {
      patient: "patient",
      doctor: "doctor",
      admin: "admin",
      staff: "staff",
      manager: "staff",
    };
    document.body.setAttribute("data-theme", themeMap[role] || "patient");
  }

  async function logout() {
    await api.post("/auth/logout");
    setUser(null);
    document.body.removeAttribute("data-theme");
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}