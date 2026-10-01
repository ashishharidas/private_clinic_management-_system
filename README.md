# Clinic Patient Management — Frontend

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Make sure your backend is running on Render (see deployment notes below).
3. Start the frontend:
   ```
   npm run dev
   ```
4. Open http://localhost:5173 — you should see the login screen.

## Environment variables

The frontend reads `VITE_API_BASE_URL` to determine the backend URL:

- **Local development**: defaults to `http://localhost:5000/api`
- **Vercel deployment**: set `VITE_API_BASE_URL` to your Render backend URL
  (e.g. `https://clinic-backend-xyz.onrender.com/api`) in the Vercel dashboard.

## How the pieces fit together

- **`context/AuthContext.jsx`** — on every page load, calls `GET /api/auth/me` to
  check "is anyone logged in?" via the session cookie. Every page reads from
  this instead of re-checking auth itself.
- **`components/ProtectedRoute.jsx`** — wraps pages that require login; bounces
  to `/login` if `user` is null. Also checks `user.role` (must match or redirect).
- **`pages/Login.jsx`** — the Google button does a real `window.location.href`
  redirect (not `fetch`), because OAuth needs a full page navigation to Google
  and back.
- **`pages/Dashboard.jsx`** — lists doctors from `GET /api/doctors`.
- **`pages/DoctorSlots.jsx** — the booking screen. Watch how it handles a
  `409` response from the backend: that's the "someone else booked this slot
  first" race-condition case you already built server-side. The UI just shows
  a message and refreshes the list — nothing breaks.
- **`pages/MyAppointments.jsx`** — tabs between upcoming and history, using
  your `/upcoming` and `/history` endpoints; cancel button calls the cancel
  route and reloads.
- **`pages/AdminDashboard.jsx`** — admin panel at `/admin` (visible only when
  `user.role === "admin"`): create/edit/deactivate doctors, link Google accounts.
- **`pages/DoctorDashboard.jsx`** — doctor dashboard at `/doctor` (visible only
  when `user.role === "doctor"`): view today's queue, mark visits complete with
  notes, mark no-show, view patient history.

## Deployment: Vercel Frontend + Render Backend

### 1. Backend on Render

Set these environment variables in your Render dashboard:

```
MONGO_URI=mongodb+srv://<your-atlas-uri>
SESSION_SECRET=<random-hex>
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-rotated-secret>
GOOGLE_CALLBACK_URL=https://<your-render-url>/api/auth/google/callback
CLIENT_URL=https://<your-vercel-url>.vercel.app
NODE_ENV=production
CRON_SECRET=<random-string>
```

### 2. Frontend on Vercel

Set this environment variable in your Vercel dashboard:

```
VITE_API_BASE_URL=https://<your-render-url>.onrender.com/api
```

The `GOOGLE_CALLBACK_URL` must match the Google Cloud Console Authorized
redirect URI exactly.

### 3. Cron job for slot generation

Since the backend runs on Render (not Vercel), use one of these options:

**Option A: cron-job.org (free)**
1. Create a free account at https://cron-job.org
2. Create a job: URL = `https://your-backend.onrender.com/api/cron/generate-slots?secret=<CRON_SECRET>`
3. Schedule: daily at 2am
4. Set `CRON_SECRET` in Render environment variables

**Option B: Render Cron (requires paid plan)**
1. In Render dashboard → your service → Cron Jobs → Add
2. Schedule: `0 2 * * *`
3. Command: `curl "$CRON_SECRET" && curl "https://your-backend.onrender.com/api/cron/generate-slots?secret=$CRON_SECRET"`

### 4. Testing locally

Copy `.env.example` to `.env` in both frontend and backend, fill in dev values:

```
# Backend .env
MONGO_URI=mongodb+srv://<your-atlas-uri>
SESSION_SECRET=<random-hex>
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-secret>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:5173
CRON_SECRET=<random-string>
NODE_ENV=development

# Frontend .env (or leave VITE_API_BASE_URL unset for local default)
VITE_API_BASE_URL=http://localhost:5000/api
```

## What's built

- React 18 + Vite frontend
- Google OAuth login flow
- Doctor listing + slot booking with 409 race-condition handling
- My Appointments (upcoming/history + cancel)
- Admin panel (create/edit/deactivate doctors, link Google accounts by email)
- **Doctor dashboard** (view queue, mark complete, mark no-show, patient history)
- All API endpoints with validation and error handling polish
- Global Express error handler (never leaks stack traces)