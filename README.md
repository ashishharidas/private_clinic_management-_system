# Clinic Patient Management System - Frontend

## Overview
React frontend for the clinic patient management system with role-based portals and distinct visual themes for each user type.

## Features
- **Four distinct portals**: Patient, Doctor, Admin, Staff
- **Role-based theming**: Each portal has its own color theme via CSS variables
- **Shared primitives**: Reusable UI components (Button, Input, Card, etc.) that adapt to the current theme
- **Role-based routing**: Automatic redirects based on user role and permissions
- **Theme switching**: Layout shells inject `data-theme` attribute for automatic CSS variable switching
- **Protected routes**: Authentication and authorization guards
- **Responsive design**: Works on mobile and desktop
- **Loading states**: Skeletons and spinners for better UX
- **Form validation**: Client-side validation with helpful error messages
- **Toast notifications**: Feedback for user actions
- **Modal dialogs**: For confirmations and forms
- **Public browsing**: Doctor search and detail pages accessible without login

## Portals & Themes

### Patient Portal (`data-theme="patient"`)
- Soft, calming teal-green theme
- Focus: Browse doctors, book appointments, manage profile
- Access: `/dashboard`, `/doctors/:id`, `/appointments`, `/profile`

### Doctor Portal (`data-theme="doctor"`)
- Professional blue theme
- Focus: Manage appointment queue, complete visits, view patient history
- Access: `/doctor` (dashboard), plus direct links from navbar

### Admin Portal (`data-theme="admin"`)
- Regal purple theme
- Focus: Manage doctors, users, staff, view audit logs, system stats
- Access: `/admin`

### Staff Portal (`data-theme="staff"`)
- Warm orange theme
- Focus: View-only access to appointments, statistics, recent activity
- Access: `/staff`

## UI Components

### Layout Shells
Each portal uses a layout shell that:
- Sets the theme via `data-theme` on `<body>`
- Includes the Navbar
- Provides a content container with consistent spacing
- Located in `src/layouts/`

### Shared Primitives
All components in `src/components/primitives/`:
- **Button** - Primary, secondary, outline, danger variants with loading states
- **Input** - Text, email, password, textarea with label/help/error states
- **Card** - Container with header/body/footer
- **Badge** - Status indicators (booked, completed, cancelled, etc.)
- **Modal** - Dialog with overlay, header, body, footer
- **Toast** - Non-blocking notifications (top-center)
- **Table** - Data display with sorting, pagination, loading states
- **Spinner** - Loading indicator
- **Skeleton** - Placeholder shapes for loading content

### Navigation
- **Navbar** - Shows/hides links based on user role
  - Not logged in: Find Doctors, Log in
  - Patient: Book visit, My appointments, My profile, Find Doctors (link), Log out
  - Doctor: Book visit, My appointments, Doctor dashboard, Log out
  - Admin: Book visit, My appointments, Admin panel, Staff panel, Log out
  - Staff: Book visit, My appointments, Staff panel, Log out
  - Manager: Same as Staff (inherits staff theme)

## API Integration
- Uses axios instance in `src/api/client.js`
- Automatically sends cookies with requests (`withCredentials: true`)
- Base URL from `VITE_API_BASE_URL` env var (defaults to localhost:5000)
- Response interceptors could be added for global error handling

## Environment Variables
Create `.env` in the frontend directory:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Design System
See `src/DESIGN.md` for complete design documentation including:
- Color tokens per theme
- Layout shell specifications
- Component usage guidelines
- Role-based permission matrix
- Migration notes

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview production build:
   ```bash
   npm run preview
   ```

## Deployment

### Frontend (Vercel)
1. Push to GitHub/GitLab/Bitbucket
2. Import project in Vercel
3. Set environment variable:
   - `VITE_API_BASE_URL` = your backend URL (e.g., `https://your-backend.onrender.com/api`)
4. Vercel will automatically detect it's a Vite project and build/deploy

### Backend (Render)
See backend README for deployment instructions.

## Development Notes

### Theme Implementation
- Each layout shell (PatientShell, DoctorShell, etc.) sets `data-theme` on `<body>`
- CSS in `src/index.css` defines `:root` (patient defaults) and `[data-theme="X"]` overrides
- Shared primitives use `var(--color-name)` to reference theme-specific colors
- No need to pass theme props down - components automatically use current theme

### Authentication Flow
- `AuthContext` checks `/auth/me` on app load
- Sets user object and triggers theme update
- Protected routes redirect to `/login` if not authenticated
- If `user.mustChangePassword === true`, redirects to `/change-password`
- On logout, removes user and clears theme

### Data Fetching
- Components use `useEffect` to load data on mount/param changes
- Loading states shown with spinners or skeletons
- Error states display user-friendly messages
- Success states show toast notifications

### Form Handling
- Controlled components with useState
- Client-side validation (required fields, min lengths, etc.)
- Form submission handled via async/await with try/catch
- Disabled submit buttons during loading states

## Component Library Guidelines

### Naming
- Components are PascalCase
- Props are camelCase
- Event handlers start with `handle` or `on`

### Styling
- Use CSS variables from `:root` or `[data-theme]`
- Avoid hardcoded colors
- Use semantic class names (btn-primary, card, etc.)
- Keep components reusable and theme-agnostic

### Accessibility
- Proper labels for form inputs
- Keyboard navigation support
- ARIA attributes where needed
- Sufficient color contrast (verified per theme)

## Testing
Manual testing recommended:
1. Test each portal login (Google for patients, local for others)
2. Verify role-based redirects work correctly
3. Check that each portal shows correct theme
4. Test form validation and submission
5. Verify public routes work without login
6. Test toast notifications and modals
7. Check loading and error states

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure UI works in all four themes
5. Submit a pull request

## License
MIT