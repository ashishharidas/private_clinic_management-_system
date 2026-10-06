import axios from "axios";

// withCredentials: true is essential — it's what makes the browser
// send the session cookie with every request, so the backend knows who you are
const api = axios.create({
 baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
});

export default api;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
