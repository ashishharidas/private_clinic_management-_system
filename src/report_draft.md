# Audit Report

## Critical Issues

1. **Infinite Redirect Loop in Admin/Routes**:
   - `/home/ash/personal/clinic_frontend/src/components/ProtectedRoute.jsx` (Line 19): `if (user.mustChangePassword) return <Navigate to="/change-password" replace />;` - This doesn't check if the user is *already* on the Change Password page. Since `/change-password` uses `<ProtectedRoute>`, this causes an infinite redirect loop.

2. **Missing Global Navigation / Dead Code**:
   - `/home/ash/personal/clinic_frontend/src/components/Navbar.jsx`: The entire Navbar component is never imported or used anywhere in `App.jsx`, `Layouts`, or `Pages`, meaning the app lacks navigation between pages. It is dead code.

3. **Logic Error in Toast Rendering**:
   - `/home/ash/personal/clinic_frontend/src/components/primitives/Toast.jsx` (Lines 28-30): The state update function maps over the existing `prev` array to add a *new* toast. Since new toasts aren't in the array yet, their visibility won't be updated, and they will never render.

## Major Issues

4. **Missing UI Functionality**:
   - `/home/ash/personal/clinic_frontend/src/pages/AdminDashboard.jsx` (Lines 105-117): Has tabs for "link", "staff", and "logs", and corresponding data fetching functions (`loadUsers`, `loadAuditLogs`) are called when clicking the tabs. However, there is zero UI implemented for these tabs; only `{tab === "doctors" && ...}` is rendered.
   - `/home/ash/personal/clinic_frontend/src/pages/AdminDashboard.jsx` (Lines 82-100): Exposes functions like `updateStaffRole`, `addShift`, `updateShift`, `removeShift`, but they are entirely unused/dead code as there are no buttons or UI to trigger them.

5. **API Endpoint Base URL Mismatch**:
   - `/home/ash/personal/clinic_frontend/src/pages/Login.jsx` (Line 12): `window.location.href = "/api/auth/google";` directly directs the browser to the frontend server's `/api` endpoint, bypassing the external `import.meta.env.VITE_API_BASE_URL` defined in `client.js`. This will 404 in standard separated setups.

6. **State Management / React Router Misuse**:
   - `/home/ash/personal/clinic_frontend/src/pages/ChangePassword.jsx` (Line 38): `navigate("/dashboard");` is called directly during the render phase instead of throwing a `<Navigate />` or wrapping in `useEffect`. This throws console errors and can break React rendering.

7. **Syntax / Module Structure Error**:
   - `/home/ash/personal/clinic_frontend/src/pages/PublicDoctorSearch.jsx` (Line 98): `import { Link } from "react-router-dom";` is written at the very bottom of the file outside the module block. This is poor format and can cause bundler errors.

8. **State Management / Memory Leaks**:
   - `/home/ash/personal/clinic_frontend/src/components/primitives/Toast.jsx` (Line 26): Adds an inline listener via `listeners.add(toast)` inside a `useEffect`, but fails to return a cleanup function `listeners.delete`. This causes duplicated toasts and memory leaks on unmount.
   - `/home/ash/personal/clinic_frontend/src/pages/AdminDashboard.jsx` (Line 110): `onClose={() => setIsDoctorModalOpen(false)}` passes an inline function to `Modal`, causing the `useEffect` inside `Modal` to tear down and reset the keydown listener on every single render.

## Minor Issues

9. **Logic Error / Unsafe Array Access**:
   - `/home/ash/personal/clinic_frontend/src/components/primitives/Table.jsx` (Line 25): Assumes `data` is always an array (`data.length === 0`). If `data` is passed as null or undefined, the app will crash.

10. **Dead Code**:
    - `/home/ash/personal/clinic_frontend/src/components/primitives/Toast.jsx` (Line 2): Unused import `Modal`.
