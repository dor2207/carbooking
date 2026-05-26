# Car-Booking PWA — CLAUDE.md

## Project Overview

**משפחה על גלגלים** — A family car-sharing PWA. Family members submit car-booking requests; the first registered user becomes admin (mom) and approves/rejects them. All UI is Hebrew RTL.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite 5 |
| Styling | Tailwind CSS 3 |
| Backend / Auth / DB | Supabase (Auth + PostgreSQL + Realtime) |
| PWA | vite-plugin-pwa + Workbox |
| Date utils | date-fns |

## Project Structure

```
src/
  main.tsx                          — app entry, wraps providers
  App.tsx                           — root routing via activePage state
  types/
    index.ts                        — shared TS types (Profile, Booking, ActivePage)
  lib/
    supabase.ts                     — supabase client singleton
  contexts/
    AuthContext.tsx                 — auth state + profile, signIn/signUp/signOut/refreshProfile
    BookingsContext.tsx             — bookings state + Supabase Realtime subscription (joins profiles for color)
  components/
    auth/AuthPage.tsx               — login / register with emoji avatar picker
    calendar/WeeklyCalendar.tsx     — 3-view calendar: יומי / שבועי / חודשי (pixel-based timeline, user colors)
    bookings/
      NewBookingPage.tsx            — booking form with overlap-check validation
      MyBookingsPage.tsx            — user's personal booking history
      BookingCard.tsx               — single booking display card
    admin/AdminPage.tsx             — admin approve/reject panel (role=admin only)
    profile/ProfilePage.tsx         — profile settings + color picker (12-color palette)
    shared/
      BottomNav.tsx                 — bottom navigation bar
      DatePicker.tsx                — custom date picker component
      TimePicker.tsx                — custom time picker component
      LoadingSpinner.tsx            — loading indicator
supabase-setup.sql                  — full DB schema + RLS policies (run once in Supabase dashboard)
```

## Database Schema

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | references auth.users |
| full_name | text | |
| role | text | `'admin'` or `'member'` |
| avatar_emoji | text | default `'🙂'` |
| color | text | default `'#7C6FF7'` — user's calendar color |
| created_at | timestamptz | |

### `bookings`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | references profiles |
| title | text | |
| description | text | nullable |
| start_time | timestamptz | |
| end_time | timestamptz | |
| status | text | `'pending'` / `'approved'` / `'rejected'` |
| admin_note | text | nullable |
| created_at / updated_at | timestamptz | |

## Calendar Architecture (`WeeklyCalendar.tsx`)

Three views toggled by `CalView` state (`'day' | 'week' | 'month'`):

| View | Description |
|---|---|
| **יומי** | Single-day vertical timeline 06:00–23:00, bookings as absolute-positioned blocks |
| **שבועי** | 7-column grid (Google Calendar style), sticky day headers, current-time red line |
| **חודשי** | 6×7 grid, colored event bars per day, click a day to see detail panel |

**Constants:** `HOUR_H = 56` px/hour, `DAY_START = 6` (06:00), `HOURS = [6..23]`

**User color:** read from `b.profiles?.color` via `getUserColor(b)`. Each booking block uses the owner's color. `BookingsContext` selects `profiles(color, avatar_emoji, full_name)` via join.

**Existing DB migration** (for DBs created before color was added):
```sql
alter table profiles add column if not exists color text not null default '#7C6FF7';
```

## Key Behaviors & Invariants

- **Admin assignment:** The first user to register (when `profiles` table has 0 rows) gets `role = 'admin'`. All others get `'member'`. This check runs client-side in `AuthContext.signUp`.
- **Realtime:** Bookings context subscribes to Supabase channel `bookings-changes` for live updates across all connected clients.
- **Overlap check:** `NewBookingPage` validates no time conflict before submitting. Only approved bookings count for overlap.
- **Admin-only delete:** Only admins can update booking status/notes (RLS enforced). Members can only delete their own `pending` bookings.
- **Navigation guard:** `App.navigate()` blocks access to `'admin'` page for non-admin users.

## RLS Policies Summary

- `profiles`: all authenticated users can read; users update/insert only their own row.
- `bookings`: all authenticated users can read; users insert only for themselves; only admins can update; users can delete only their own `pending` bookings.

## Development Commands

```bash
npm run dev      # dev server (http://localhost:5173)
npm run build    # tsc + vite build → dist/
npm run preview  # preview production build
```

## Environment Variables

Copy `.env.example` → `.env` and fill in:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## PWA

- App name: **משפחה על גלגלים**, short name: **רכב משפחתי**
- `lang: he`, `dir: rtl`, `display: standalone`, `orientation: portrait`
- Service worker auto-updates via `registerType: 'autoUpdate'`
- Icons required: `public/icons/icon-192.png`, `public/icons/icon-512.png`

## Coding Conventions

- All user-facing text is Hebrew.
- UI direction is RTL — use `dir="rtl"` on root, Tailwind classes like `text-right`, `pr-*`/`pl-*` accordingly.
- Tailwind custom tokens used throughout: `bg-background`, `text-textBase`, `text-textMuted`, `primary-*`, `approved-*`, `rejected-*`, `pending-*`, `glass`.
- No React Router — navigation is a single `activePage` state string in `App.tsx`.
- Contexts are the sole data layer; do not fetch Supabase directly from components.
