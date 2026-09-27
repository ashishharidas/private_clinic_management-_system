<<<<<<< HEAD
# private_clinic_management-_system
=======
# Clinic Patient Management — Frontend

## Setup

1. Put these files inside your `frontend` folder (replacing anything already there).
2. Install dependencies:
   ```
   npm install
   ```
3. Make sure your backend is running on port 5000 (`npm run dev` in the backend folder).
4. Start the frontend:
   ```
   npm run dev
   ```
5. Open http://localhost:5173 — you should see the login screen.

## How the pieces fit together

- **`context/AuthContext.jsx`** — on every page load, calls `GET /api/auth/me` to
  check "is anyone logged in?" via the session cookie. Every page reads from
  this instead of re-checking auth itself.
- **`components/ProtectedRoute.jsx`** — wraps pages that require login; bounces
  to `/login` if `user` is null.
- **`pages/Login.jsx`** — the Google button does a real `window.location.href`
  redirect (not `fetch`), because OAuth needs a full page navigation to Google
  and back.
- **`pages/Dashboard.jsx`** — lists doctors from `GET /api/doctors`.
- **`pages/DoctorSlots.jsx`** — the booking screen. Watch how it handles a
  `409` response from the backend: that's the "someone else booked this slot
  first" race-condition case you already built server-side. The UI just shows
  a message and refreshes the list — nothing breaks.
- **`pages/MyAppointments.jsx`** — tabs between upcoming and history, using
  your `/upcoming` and `/history` endpoints; cancel button calls the cancel
  route and reloads.

## Things worth testing to understand the system

1. **The happy path** — log in, book a slot, see the token number, check it
   shows up under "Upcoming."
2. **Cancellation** — cancel it, confirm it moves to History with a
   "cancelled" badge, and that a fresh call to that doctor's slots shows the
   time slot available again.
3. **The race condition (the fun one)** — open the same doctor's slot page in
   two browser tabs (or one normal + one incognito, logged in as different
   Google accounts). Click the same time slot in both tabs as close together
   as you can. One will succeed, the other will get the "just booked by
   someone else" message. That's the atomic `findOneAndUpdate` doing its job.

## Next steps once this is working

1. **Doctor dashboard** — a separate login for doctors to see their day's
   token queue and mark visits complete / add notes.
2. **Admin panel** — add/edit doctors and working hours through the UI
   instead of MongoDB Compass.
3. **Daily cron job** (`node-cron` in the backend) to keep the 7-day slot
   window rolling forward automatically.
4. **Polish** — loading skeletons, toast notifications instead of
   `window.alert`/`prompt`, form validation.

Once you've got the booking + cancel + race-condition flow working end to
end, that's genuinely the hard part of this whole project done — everything
after this is more features on a foundation that already works.
>>>>>>> 3e99294 (first)
