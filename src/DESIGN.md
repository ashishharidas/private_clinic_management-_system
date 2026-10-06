# Design System for Three-Portal Role Separation

## Overview
The app has four distinct roles: **Patient**, **Doctor**, **Admin**, **Staff**. Each role has a dedicated layout shell, color theme, and behavior constraints.

## Theme Tokens (CSS Variables)

Each role sets `data-theme` on `<body>` or a parent. The CSS below uses these variables. Override globally by setting the attribute on a persistent container (e.g., `<body data-theme="patient">`).

### Patient Theme
```css
[data-theme="patient"] {
  --color-bg: #F5F3EE;
  --color-surface: #FFFFFF;
  --color-ink: #1E2422;
  --color-ink-soft: #5C6663;
  --color-primary: #1F5C57;
  --color-primary-dark: #133F3B;
  --color-accent: #D98E3F;
  --color-border: #E2DFD6;
  --color-danger: #B4432E;
  --color-danger-bg: #FBEAE6;
  --color-success: #3C6E3F;
  --color-success-bg: #E9F2E8;
}
```

### Doctor Theme
```css
[data-theme="doctor"] {
  --color-bg: #E8F4FD;
  --color-surface: #FFFFFF;
  --color-ink: #1A237E;
  --color-ink-soft: #5C6BC0;
  --color-primary: #1A237E;
  --color-primary-dark: #0D1B2A;
  --color-accent: #0288D1;
  --color-border: #90CAF9;
  --color-danger: #EF5350;
  --color-danger-bg: #FFCDD2;
  --color-success: #43A047;
  --color-success-bg: #C8E6C9;
}
```

### Admin Theme
```css
[data-theme="admin"] {
  --color-bg: #F3E5F5;
  --color-surface: #FFFFFF;
  --color-ink: #4A148C;
  --color-ink-soft: #AB47BC;
  --color-primary: #7B1FA2;
  --color-primary-dark: #4A148C;
  --color-accent: #CE93D8;
  --color-border: #E1BEE7;
  --color-danger: #E53935;
  --color-danger-bg: #F8D7DA;
  --color-success: #66BB6A;
  --color-success-bg: #C8E6C9;
}
```

### Staff Theme
```css
[data-theme="staff"] {
  --color-bg: #FFF3E0;
  --color-surface: #FFFFFF;
  --color-ink: #E65100;
  --color-ink-soft: #FF8A65;
  --color-primary: #FB8C00;
  --color-primary-dark: #F57C00;
  --color-accent: #FFB74D;
  --color-border: #FFE0B2;
  --color-danger: #EF9A9A;
  --color-danger-bg: #FFCDD2;
  --color-success: #A5D6A7;
  --color-success-bg: #C8E6C9;
}
```

## Layout Shells

Each layout wraps the `children` with role-specific chrome (header, sidebar, footer) and theme provider.

### 1. Patient Layout (`PatientShell.jsx`)
```
+--------------------------------------------------+
|  Patient Navbar              |                    |
|  ← Home        Book | My  Appointments     |       |
|--------------------------------------------------|
|           [CHILDREN - Main Content Area]         |
|  - Browse doctors                                    |
|  - View own appointments                             |
|  - Manage own profile                                |
+--------------------------------------------------+
```
- Top navbar with patient links
- No sidebar
- Theme: patient tokens

### 2. Doctor Layout (`DoctorShell.jsx`)
```
+--------------------------------------------------+
|  Doctor Navbar / Queue display      [refresh]    |
|--------------------------------------------------|
|   [CHILDREN - Appointment Queue + Actions]        |
|  - Today's tokens                                    |
|  - Complete / No-Show actions                      |
|  - Patient history                                   |
+--------------------------------------------------+
```
- Header with doctor name + date picker + queue count
- Main content: queue management
- Theme: doctor tokens

### 3. Admin Layout (`AdminShell.jsx`)
```
+--------------------------------------------------+
|  Admin Navbar           [logo]  [users] [doctors] |
|--------------------------------------------------|
|   [CHILDREN - CRUD + Dashboard view]              |
|  - Doctor CRUD                                       |
|  - User search / linking                             |
|  - Slot generation (cron)                            |
|  - Audit logs, stats                                 |
+--------------------------------------------------+
```
- Top navbar with Admin panel links
- Content area: tabs for Doctors, Users, Staff, Stats
- Theme: admin tokens

### 4. Staff Layout (`StaffShell.jsx`)
```
+--------------------------------------------------+
|  Staff Navbar                  [appointments]    |
|--------------------------------------------------|
|   [CHILDREN - Dashboard + Appointments view]      |
|  - All appointments browse                           |
|  - Stats, recent activity                            |
|  - Audit logs (read-only)                           |
+--------------------------------------------------+
```
- Top navbar with Staff panel links
- Theme: staff tokens

## Shared Primitives (updated)

All components now receive `data-theme` context from their shell. The primitives automatically adapt:

```jsx
// Usage inside any layout
<Button variant="primary">Book Slot</Button>

// Buttons auto-inherit the theme's color-primary via
// :host { --color-primary: ... } in the shell CSS
```

## Component Catalog

### Navigation / Layout
- PatientShell / DoctorShell / AdminShell / StaffShell (above)
- Navbar (role-aware — shows/hides links per role)
- Sidebar (minimal: only for Admin with quick-nav)
- Breadcrumbs (optional, for admin pages)

### Form Controls
- Input (label + helper text + error)
- Select (styled, with optional search)
- Textarea (expanding)
- Checkbox / Radio group
- Form (with unified error handling)

### Display
- Badge (variant: primary / success / danger / warning)
- Card (header / body / footer)
- EmptyState (icon + title + subtext)
- Spinner / Skeleton (loading placeholders)
- Pagination

### Feedback
- Toast (success / error / warning / info)
- Modal (confirm dialogs, forms)

### Charts
- Recharts usage: Line chart for daily appointments, Bar chart for doctor stats
- Wrapped in `<ChartTheme>` that inherits `data-theme`

## Role-to-Permission Mapping (from config/permissions.js)

| Permission              | Patient | Doctor | Staff | Manager | Admin |
|-------------------------|:-------:|:------:|:-----:|:-------:|:-----:|
| `patient:read-doctors`  | ✅      | ❌      | ❌      | ❌        | ✅      |
| `patient:book-appointment` | ✅ | ❌      | ❌      | ❌        | ✅      |
| `doctor:read-queue`     | ❌      | ✅      | ❌      | ❌        | ✅      |
| `doctor:manage-appointments` | ❌ | ✅      | ❌      | ❌        | ✅      |
| `staff:read-appointments` | ❌ | ❌      | ✅      | ✅        | ✅      |
| `admin:read-users`      | ❌      | ❌      | ❌      | ❌        | ✅      |
| `admin:write-users`     | ❌      | ❌      | ❌      | ❌        | ✅      |

## Per-Role Usage Examples

### Patient: Search + Book
```jsx
<PatientShell>
  <Navbar />
  <div className="container">
    <Input label="Doctor name or specialty" helperText="e.g. Cardiologist, Dr. Smith" />
    <Button variant="primary" onClick="searchDoctors()">Find Doctors</Button>
    {/* Results show clickable cards → /dr/:slug */}
  </div>
</PatientShell>
```

### Doctor: Queue Management
```jsx
<DoctorShell>
  <Navbar />
  <h1>Today's Queue — {date}</h1>
  <QueueList doctorId={doctor._id} date={date} />
</DoctorShell>
```

### Admin: Doctor CRUD
```jsx
<AdminShell>
  <Tabs>
    <Tab label="Doctors">
      <DoctorCRUD />
    </Tab>
    <Tab label="Users">
      <UserManagement />
    </Tab>
    <Tab label="Staff">
      <StaffManagement />
    </Tab>
  </Tabs>
</AdminShell>
```

## Migration Notes

1. **Existing code**: The current `Navbar.jsx` already has role-aware links. Keep those.
2. **Theme switching**: Add `data-theme="doctor"` to `<body>` when a doctor logs in.
3. **CSS variables**: The existing `index.css` has the patient tokens as defaults. Add doctor/admin/staff themes.
4. **Layout migration**: Wrap existing pages in the appropriate shell per role.

## Action Items

- [x] Add theme tokens to `index.css` (patient defaults + 3 additional themes)
- [x] Create layout shells: PatientShell, DoctorShell, AdminShell, StaffShell
- [x] Update Navbar to be fully role-aware
- [x] Add `data-theme` attribute injection in AuthContext on login
- [x] Ensure all primitives reference theme tokens (not hardcoded colors)
- [x] Test that each role sees their correct shell and theme
- [x] Update README with design docs