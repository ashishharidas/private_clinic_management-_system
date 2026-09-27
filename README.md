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

## What's NOT built yet (next steps, in order)

1. **React frontend** — login button, doctor list, slot picker, "my appointments" page
2. **Doctor dashboard** — separate login type, view today's token queue, mark
   completed, add consultation notes
3. **Admin routes** — add/edit doctors through the UI instead of Compass
4. **Daily cron job** to run `generateSlots.js` automatically every day (so the
   7-day window keeps rolling forward) — can use `node-cron` package
5. **Validation & error handling polish** — e.g. reject booking a slot in the past

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
