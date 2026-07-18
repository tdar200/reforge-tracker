# Reforge — Personal Fitness Tracker PWA — Design Spec

*Date: 2026-07-18*

## Purpose
A single-user Progressive Web App to make the training + nutrition program in
`~/Projects/fitness-research/MASTER-PLAN.md` trackable day-to-day. It logs workouts against a
fixed 5-day split, logs diet against calorie/protein targets, and tracks body measurements over
time. Installable to the user's Android home screen.

## Goals it serves (from the research)
- **Bigger arms/forearms** → progressive-overload logging (show last session's numbers to beat).
- **Fat loss (chest/belly/thighs)** → track a moderate calorie deficit + high protein daily.
- **Recomposition reality** → the scale barely moves; body-tape measurements are the real progress
  signal, so measurement tracking + charts are first-class.
- **Fix walking wobble** → glute-med exercises are part of the seeded plan (Wed + Fri).

## Non-goals (v1 / YAGNI)
- No full food database, barcode scanning, or portion math (manual calories + protein + presets only).
- No multi-user accounts (single passcode).
- No offline logging queue (online-required v1; app-shell is cached, data needs a connection).
- No wearable/health-app integrations.

## Stack
- **Next.js (App Router) + TypeScript**, mobile-first **Tailwind CSS**.
- **Neon Postgres** (serverless driver) for data; **Drizzle ORM** for schema + queries.
- **Recharts** for trend graphs.
- **PWA**: web manifest + service worker (app-shell caching, home-screen install).
- Deployed to **Vercel**.

## Auth
Single **passcode** stored as a server env var (`APP_PASSCODE`). A login screen posts the passcode;
on success the server sets a signed, httpOnly session cookie. All API route handlers verify the
cookie; unauthenticated requests get 401. No signup, no email.

## Screens
1. **Today (dashboard)** — resolves current weekday → today's session label (Mon Chest+Shoulders,
   Tue Arms #1, Wed Legs+GluteMed, Thu Back, Fri Arms #2, Sat/Sun Rest). Two progress rings:
   calories (consumed / target) and protein (g / target). Quick actions: Log workout, Add meal,
   Log weight.
2. **Workout logger** — loads today's prescribed exercises (grouped by antagonist superset), each
   with target sets × rep range. User enters weight × reps per set and checks it off. Shows the
   **previous session's weight×reps** for each exercise for progressive overload.
3. **Diet logger** — add entries (calories + protein, optional carbs/fat) via manual input or a
   saved **preset** (one tap). Shows running daily totals vs targets; entries editable/deletable.
4. **Body metrics** — log bodyweight + circumferences (waist, chest, thigh, arm). Line charts of
   each metric over time.
5. **Settings** — daily calorie target, protein target, passcode change note, and the seeded
   plan/exercise list (view; editing exercises is a stretch goal).

## Data model (Neon Postgres via Drizzle)
- `exercises` — id, name, muscle_group, day_type, target_sets, rep_low, rep_high, superset_group, order. Pre-seeded from MASTER-PLAN.
- `workout_sessions` — id, date, day_type, notes.
- `set_logs` — id, session_id (fk), exercise_id (fk), set_number, weight, reps, completed_at.
- `diet_entries` — id, date, name, kcal, protein_g, carbs_g (nullable), fat_g (nullable).
- `food_presets` — id, name, kcal, protein_g, carbs_g, fat_g.
- `body_metrics` — id, date, bodyweight, waist, chest, thigh, arm (all nullable so you can log some).
- `cardio_logs` — id, date, type, minutes, notes.
- `settings` — id (singleton), calorie_target, protein_target.

## Seeded plan data (day_type → exercises)
Derived directly from MASTER-PLAN.md 5-day schedule:
- **Mon — Chest+Shoulders** (maintenance): barbell/DB bench, incline DB press, overhead press,
  lateral raises, cable fly.
- **Tue — Arms #1 + Forearms** (biceps-led supersets): barbell curl ↔ close-grip bench;
  incline DB curl ↔ overhead extension; hammer curl ↔ dips; wrist curls, reverse wrist curls.
- **Wed — Legs + GluteMed** (light): goblet/leg press, RDL; side-lying hip abduction, single-leg
  squat/step-down, single-leg bridge.
- **Thu — Back** (maintenance): pull-ups/pulldown, row, chest-supported row, face pulls.
- **Fri — Arms #2 + Forearms** (triceps-led supersets): pushdown ↔ cable curl; overhead extension ↔
  preacher curl; single-arm pushdown ↔ spider curl; wrist curls, reverse wrist curls;
  side-lying hip abduction, single-leg bridge (glute-med 2nd session).
- **Sat/Sun — Rest** (optional walk / cardio log).

## Architecture & data flow
- Next.js Route Handlers (`/api/*`) perform authenticated CRUD against Neon via Drizzle.
- Client screens fetch via `fetch`; simple SWR-style loading states.
- Weekday→session mapping and daily aggregation are pure functions (unit-tested).
- Progressive-overload lookup: query the most recent prior `workout_sessions` of the same
  `day_type`, join its `set_logs`, surface per-exercise last weight×reps.

## Error handling
- API routes: 401 on bad/missing session cookie; 400 on invalid payload (zod-validated); 500 with a
  safe message on DB errors. Client shows inline error toasts and preserves unsaved input.
- Missing/partial body metrics are allowed (nullable columns).

## Testing
- Unit: weekday→day_type mapping; daily calorie/protein aggregation; progressive-overload
  "last session" resolver; zod payload validation.
- Integration (smoke): auth gate (401 without cookie, 200 with), one CRUD round-trip per resource.

## Deployment
- Vercel project, Neon integration for `DATABASE_URL`, `APP_PASSCODE` + cookie-signing secret as
  env vars. Drizzle migration + seed script run against Neon before first use.

## Open / stretch (post-v1)
- Offline logging queue with background sync.
- Editable plan/exercises in-app.
- Export/backup to file.
- Cardio and glute-med progress summaries on the dashboard.
