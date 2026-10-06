// Role -> permission map. This single source of truth drives every `requirePermission`
// check so access control never drifts between middleware, routes, and the frontend.
//
// Permission matrix:
//   - patient: browse doctors, book/cancel own appointments, manage own profile
//   - doctor: manage own slots/appointments, view own queue + patient history
//   - staff: read-only access to appointments & queue (no write), view own schedule
//   - manager: everything staff can do + cancel any appointment + view audit logs
//   - admin: full access including user management, doctor CRUD, admin-only endpoints

const PERMISSIONS = {
  // ---- patient ----
  "patient:read-doctors": ["patient"],
  "patient:read-slots": ["patient"],
  "patient:book-appointment": ["patient"],
  "patient:cancel-appointment": ["patient"],
  "patient:cancel-any": ["manager", "admin"],
  "patient:read-profile": ["patient"],
  "patient:update-profile": ["patient"],
  "patient:read-history": ["patient"],

  // ---- doctor ----
  "doctor:read-queue": ["doctor"],
  "doctor:manage-appointments": ["doctor"], // complete / no-show
  "doctor:read-patient-history": ["doctor"],
  "doctor:manage-slots": ["doctor"], // regenerate / block / edit own availability

  // ---- staff ----
  "staff:read-appointments": ["staff", "manager", "admin"],
  "staff:read-queue": ["staff", "manager", "admin", "doctor"],
  "staff:read-schedule": ["staff", "doctor"],

  // ---- manager ----
  "manager:cancel-any": ["manager", "admin"],
  "manager:read-audit": ["manager", "admin"],

  // ---- admin ----
  "admin:read-users": ["admin"],
  "admin:write-users": ["admin"],
  "admin:read-doctors": ["admin"],
  "admin:write-doctors": ["admin"],
  "admin:manage-staff-roles": ["admin"],
  "admin:manage-doctor-links": ["admin"],
  "admin:read-audit": ["admin"],
  "admin:read-cron": ["admin"],
  "admin:write-cron": ["admin"],
  "admin:full-access": ["admin"],
};

// Invert the map to: permission -> [allowed roles] and role -> [permissions].
const roles = Object.entries(PERMISSIONS).reduce((acc, [perm, allowed]) => {
  allowed.forEach((role) => {
    acc[role] = acc[role] || [];
    if (!acc[role].includes(perm)) acc[role].push(perm);
  });
  return acc;
}, {});

const hasPermission = (role, permission) => {
  const allowed = PERMISSIONS[permission];
  if (!allowed) {
    throw new Error(`Unknown permission: ${permission}`);
  }
  return allowed.includes(role);
};

module.exports = {
  PERMISSIONS,
  roles, // role -> list of granted permissions
  hasPermission,
};
