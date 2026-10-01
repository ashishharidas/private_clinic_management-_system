# Clinic Patient Management — Backend

## How to run this

1. Install MongoDB locally, or create a free cluster at mongodb.com/atlas (easier for beginners — no local install).
2. Copy `.env.example` to `.env` and fill in real values (see comments in that file).
3. Install dependencies:
   ```
   npm install
   ```
4. Start the dev server (auto-restarts on save):
   ```
   npm run dev
   ```
5. You need at least one Doctor in the database before slots can be generated.
   Easiest way for now: open MongoDB Compass (or Atlas UI) and manually insert
   a document into the `doctors` collection, e.g.:
   ```json
   {
     "name": "Dr. Asha Menon",
     "specialization": "General Physician",
     "clinicName": "City Care Clinic",
     "workingHours": [
       { "day": "Monday", "start": "10:00", "end": "13:00" },
       { "day": "Wednesday", "start": "10:00", "end": "13:00" },
       { "day": "Friday", "start": "10:00", "end": "13:00" }
     ],
     "slotDurationMinutes": 30,
     "onLeaveDates": [],
     "isActive": true
   }
   ```
   (We'll build an admin panel to do this through the UI later — this is just to get moving.)
6. Generate slots for the next 7 days:
   ```
   npm run seed:slots
   ```
7. Test the API is alive: visit http://localhost:5000 in your browser.
8. Test Google login: visit http://localhost:5000/api/auth/google in your browser
   (this has to be a real browser visit, not fetch/Postman, because Google login
   is a redirect-based flow).

## What's built so far

- Google OAuth login (session-based, cookie stored)
- Doctor model with configurable working hours
- Auto-generated 30-min slots for a rolling 7-day window
- Race-condition-safe booking (`findOneAndUpdate` atomic flip)
- Token number generation per doctor per day
- Cancellation (frees the slot back up)
- Appointment history + upcoming appointments endpoints
- **Admin routes** (`routes/admin.js`, protected by `ensureAdmin` middleware) —
  create/edit/deactivate doctors, list users, link a Google account to a doctor
- **Doctor dashboard routes** (`routes/doctor.js`, protected by `ensureDoctor` middleware) —
  view today's queue, mark complete with notes, mark no-show, patient history
- **Daily cron job** (`/api/cron/generate-slots`, protected by `CRON_SECRET`)
  — call via cron-job.org or Render Cron to keep the 7-day slot window rolling

## Admin panel

The first admin account must be set by hand once — there's no way around
bootstrapping the first admin. After that, the admin panel at `/admin` lets
you manage everything through the UI:

- Create a new doctor (name, specialization, clinicName, working hours)
- Edit a doctor's details or working hours
- Deactivate a doctor (preserves appointment history — no hard delete)
- Link a Google-logged-in user to a doctor by email
  (replaces the old manual MongoDB edit)

## Daily cron job (Render / cron-job.org)

Since the backend runs on Render, use a cron service to hit the endpoint daily:

**Option A: cron-job.org (free, reliable)**
1. Create a free account at https://cron-job.org
2. Create a job: URL = `https://your-backend.onrender.com/api/cron/generate-slots?secret=<YOUR_CRON_SECRET>`
3. Schedule: daily at 2am (or preferred time)
4. Method: GET, add `x-cron-secret` header if you prefer header over query param

**Option B: Render Cron (paid plan)**
1. In Render dashboard → your service → Cron Jobs → Add
2. Schedule: `0 2 * * *`
3. Command: `curl "https://your-backend.onrender.com/api/cron/generate-slots?secret=$CRON_SECRET"`

Set `CRON_SECRET` in Render environment variables.

## Admin panel

The first admin account must be set by hand once — there's no way around
bootstrapping the first admin. After that, the admin panel at `/admin` lets
you manage everything through the UI:

- Create a new doctor (name, specialization, clinicName, working hours)
- Edit a doctor's details or working hours
- Deactivate a doctor (preserves appointment history — no hard delete)
- Link a Google-logged-in user to a doctor by email
  (replaces the old manual MongoDB edit)

## Daily cron job

Slot generation is automated via Vercel Cron. Add a `crons` array to
`backend/vercel.json`:

```json
"crons": [
  { "path": "/api/cron/generate-slots", "schedule": "0 2 * * *" }
]
```

Set `CRON_SECRET` in the Vercel dashboard and the route will reject requests
that don't send it as a `x-cron-secret` header or `?secret=` query param.

## Key concept to understand before moving on

Open `routes/appointments.js` and re-read the `/book` route. The single most
important line in this whole backend is:

```js
const slot = await Slot.findOneAndUpdate(
  { _id: slotId, status: "available" },
  { status: "booked" },
  { new: true }
);
```

This is an **atomic** operation — MongoDB guarantees no other request can sneak
in between the "check" and the "update". This is the standard pattern for any
"only one person can grab this" problem (ticket booking, seat reservation,
inventory with limited stock, etc.) — worth understanding deeply since you'll
reuse this pattern in almost every future project involving limited resources.
