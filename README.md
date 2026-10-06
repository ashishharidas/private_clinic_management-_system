# Clinic Patient Management System - Backend

## Overview
This is the backend for a clinic patient management system with role-based access control for Patients, Doctors, Admins, and Staff.

## Features
- **Role-based access**: Patient, Doctor, Admin, Staff roles with granular permissions
- **Authentication**: Google OAuth (patients) + local username/password (doctors/admins/staff)
- **Security**: Session-based auth, rate limiting, CSRF protection, input sanitization, helmet
- **Admin panel**: Doctor CRUD, user management, Google account linking, audit logs
- **Doctor dashboard**: Appointment queue, complete/no-show visits, patient history
- **Patient portal**: Profile management, appointment history
- **Staff panel**: Read-only access to appointments and statistics
- **Public API**: Doctor search and browsing (no login required)
- **Slot generation**: Daily cron job for 7-day rolling appointment slots
- **Audit logging**: Tracks sensitive actions for compliance

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/login` - Local login (doctor/admin/staff)
- `POST /auth/logout` - Logout
- `POST /auth/change-password` - Change password (when mustChangePassword=true)
- `POST /auth/verify-password` - Verify password for sensitive operations

### Patient
- `GET /patient/profile` - Get patient profile
- `PUT /patient/profile` - Update patient profile

### Doctor
- `GET /doctor/queue?date=` - Get doctor's appointment queue for a date
- `PATCH /doctor/appointments/:id/complete` - Mark appointment as complete
- `PATCH /doctor/appointments/:id/no-show` - Mark appointment as no-show
- `GET /doctor/patients/:patientId/history` - Get specific patient's history

### Admin
- `GET /admin/doctors` - List all doctors
- `POST /admin/doctors` - Create a doctor
- `PATCH /admin/doctors/:id` - Update doctor details
- `PATCH /admin/doctors/:id/deactivate` - Deactivate a doctor
- `GET /admin/users` - List all users
- `PATCH /admin/doctors/:id/link-user` - Link Google account to doctor

### Staff
- `GET /staff/stats` - Dashboard statistics
- `GET /staff/appointments` - Browse all appointments (read-only)
- `GET /staff/doctors` - List all doctors (read-only)
- `GET /staff/queue` - View queue for any doctor (read-only)
- `GET /staff/audit-logs` - View audit logs (admin/manager only)

### Public
- `GET /public/doctors/search?q=&specialty=` - Search doctors by name/specialty
- `GET /public/doctors/:slug` - Get doctor details and available slots

### Appointments
- `POST /appointments/book` - Book a slot (atomic operation with race condition protection)
- `POST /appointments/:id/cancel` - Cancel an appointment

### Cron (protected)
- `GET /cron/generate-slots?secret=` - Generate slots for all active doctors (7-day window)

## Environment Variables

See `.env.example` for required variables.

### Required
- `MONGO_URI` - MongoDB connection string
- `SESSION_SECRET` - Secret for session encryption (32+ hex chars)
- `CLIENT_URL` - Frontend URL (for CORS and redirects)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_CALLBACK_URL` - Google OAuth callback URL
- `ADMIN_ID` - Email for immutable super-admin account
- `ADMIN_PASSWORD_HASH` - bcrypt hash of admin password
- `CRON_SECRET` - Secret for cron endpoint protection
- `NODE_ENV` - development or production

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and fill in values

3. (Optional) Run migration script to update existing data:
   ```bash
   node scripts/migrate.js     # dry run
   node scripts/migrate.js     # actual migration
   ```

4. Start the server:
   ```bash
   npm run dev   # development with nodemon
   npm start     # production
   ```

## Security Features

- **Session security**: HttpOnly, Secure, SameSite cookies in production
- **Rate limiting**: Login endpoints limited to 5 attempts/15min
- **CSRF protection**: Mutating requests require CSRF token
- **Input sanitization**: Express mongo-sanitize prevents NoSQL injection
- **Helmet**: Security HTTP headers
- **Password hashing**: bcrypt with salt rounds 12
- **Account lockout**: Locks after 3 failed attempts (15min)
- **Session fixation protection**: Regenerates session on login
- **Password change required**: Admins seeded from env must change password on first login
- **Audit logging**: Tracks sensitive actions (login, updates, deletions, etc.)

## Implementation Details

### Role-Based Access Control
Permissions are managed in `config/permissions.js` with a role → permission matrix. Middleware in `middleware/auth.js` provides:
- `ensureAuthenticated` - requires login
- `ensureRole(['role1', 'role2'])` - requires specific role
- `requirePermission('permission')` - checks if role has permission
- `requireProfileComplete` - blocks access until profile is complete
- `requireNotMustChangePassword` - blocks access until password is changed
- `requireOwnership` - ensures user owns the resource they're accessing

### Data Validation
- Mongoose schemas with required fields and validation
- Server-side defensive checks (e.g., past-slot rejection)
- Atomic slot booking using `findOneAndUpdate` with status check
- Unique index on Slot(doctor, date, startTime) prevents double-booking

### Error Handling
- Generic error messages in production (no stack traces)
- Specific error messages in development
- Global error handler catches unhandled exceptions

## Development

### Database
- Uses MongoDB via Mongoose
- Connection handled in `config/db.js`

### Testing
- Manual testing via frontend or API client
- Migration script includes dry-run mode for safety

## Deployment

### Backend Hosting (Render)
- Set environment variables in Render dashboard
- Ensure `NODE_ENV` is set to production
- The server listens on `process.env.PORT` (provided by Render)
- `process.env.VERCEL` is unset, so `app.listen()` runs

### Frontend Hosting (Vercel)
- Frontend should be hosted on Vercel
- Set `VITE_API_BASE_URL` to your backend URL
- CORS is configured to only accept requests from `CLIENT_URL`

### Cron Job
**Option 1: Render Cron** (paid plan)
- Set up a daily cron job in Render dashboard pointing to `/api/cron/generate-slots?secret=CRON_SECRET`

**Option 2: External service** (free)
- Use cron-job.org or similar service to hit the endpoint daily
- Example: `0 2 * * *` → `https://your-backend.onrender.com/api/cron/generate-slots?secret=your-secret`

## API Design Notes

### Slot Generation
- Creates slots for the next 7 days based on doctor's working hours
- Idempotent - safe to run multiple times (duplicates ignored via unique index)
- Skips days when doctor is on leave
- Creates slots in 30-minute increments (configurable per doctor)

### Booking Flow
1. Patient selects slot from `/public/doctors/:slug` or `/doctors/:doctorId/slots`
2. Frontend POSTs to `/appointments/book` with slotId
3. Backend validates slot exists, not in past, no conflicts
4. Atomic `findOneAndUpdate` changes slot status from "available" to "booked"
5. Appointment record created with token number (sequential per doctor per day)
6. Slot.appointment field set for bidirectional reference

### Permissions Matrix
See `src/DESIGN.md` in frontend for complete role-based UI breakdown.

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request

## License
MIT