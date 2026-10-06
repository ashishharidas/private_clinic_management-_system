import { useEffect, useState } from "react";
import Modal from "./Modal";

/**
 * Toast system — render a single ToastContainer at app root and call
 * showToast({ type, text }) from anywhere.
 */
const listeners = new Set();

export function showToast({ type = "info", text }) {
  const id = Date.now() + Math.random();
  listeners.forEach((fn) => fn({ id, type, text, visible: true }));
  // auto dismiss after 3s
  setTimeout(() => {
    listeners.forEach((fn) => fn({ id, type, text, visible: false }));
    setTimeout(() => {
      listeners.forEach((fn) => fn({ id, type, text, visible: false, remove: true }));
    }, 200);
  }, 3000);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    listeners.add((toast) => {
      setToasts((prev) => {
        if (toast.remove) return prev.filter((t) => t.id !== toast.id);
        if (!toast.visible) return prev.map((t) => (t.id === toast.id ? { ...t, visible: false } : t));
        return prev.map((t) => (t.id === toast.id ? toast : t));
      });
    });
  }, []);

  return (
    <div
      style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 2000, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type} ${t.visible ? "toast-enter" : "toast-exit"}`}
          style={{
            background:
              t.type === "success"
                ? "var(--color-success)"
                : t.type === "error"
                ? "var(--color-danger)"
                : t.type === "warning"
                ? "#B96A00"
                : "var(--color-primary)",
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}