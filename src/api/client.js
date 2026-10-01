import axios from "axios";

// withCredentials: true is essential — it's what makes the browser
// send the session cookie with every request, so the backend knows who you are
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://private-clinic-management-system.onrender.com/api",
  withCredentials: true,
});

export default api;
