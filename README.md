# 🏴 Treasure Hunt 2024

A ready-to-deploy Next.js + Supabase app for running a live, QR-code
treasure hunt with 20 teams, 5 physical locations, and a **unique
clue order per team** (so teams don't all pile up at the same spot
at the same time).

Built from the spec: unique location sequence per team, in-app QR
scanning, live leaderboard, and a full admin panel for managing
teams, locations, orders, clues, and QR/PDF exports.

---

## What's included

- **Team app** — landing page → scan/login → clue → in-app QR
  scanner → next clue → ... → success screen with final time, hints
  used, and rank.
- **Public leaderboard** — auto-refreshing, no login required.
- **Admin panel** (`/admin`, password-protected) — manage teams,
  locations, each team's location order (manually, auto-generated,
  or via CSV import/export), clues + hints, and bulk QR/PDF
  downloads (team login QRs, per-location QR packs, per-team QR
  packs). Plus database tools: reset sessions, full reset, seed 20
  demo teams, export results as CSV.
- **In-app QR scanning** via `html5-qrcode` — no native app needed,
  works in any mobile browser with camera access.
- Supabase Postgres schema with row-level security locked down; all
  writes go through server-side API routes using the service-role
  key, so the anon key exposed to the browser has no direct table
  access.

## How the "different order per team" mechanic works

Each team has its own row-order across the 5 locations
(`team_location_order`), and each of a team's 5 clues is tied to a
specific `(team, location, step)` combination with its own unique QR
code value. When a QR is scanned, the server checks three things
before advancing the team:

1. Does this QR code belong to *this* team?
2. Is this QR's location the team's *current* step (not a future or
   past one)?
3. Has the team not already finished?

This is why you need 100 unique QR codes total for 20 teams × 5
locations — the Admin → Clues page generates and lets you download
all of them.

---

## 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run **`supabase/schema.sql`** — this
   creates all tables, the `leaderboard` view, and locks down RLS.
3. *(Optional)* Run **`supabase/seed.sql`** to add the 20 demo teams
   and 5 demo locations from the original spec, or just use the
   **Admin → Database Tools → Seed Demo Data** button once the app
   is running — it does the same thing and also generates orders +
   placeholder clue text.
4. In **Database → Replication**, make sure `game_sessions` is
   enabled for Realtime if you want to switch the leaderboard to a
   push-based Supabase Realtime subscription later. (The shipped
   version polls `/api/leaderboard` and `/api/session` every few
   seconds instead, which needs zero extra Supabase configuration
   and is plenty fast for an in-person event.)
5. Grab your project's **URL**, **anon key**, and **service role
   key** from Project Settings → API.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` (for local dev) and/or set the
same variables in your hosting provider's dashboard:

```bash
cp .env.example .env.local
```

| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe for the browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Used only in API routes, never sent to the browser |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL, e.g. `https://yourapp.vercel.app` — used to build the QR codes' login links |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `COOKIE_SECRET` | Any long random string, used to sign session cookies |
| `GAME_TIME_MINUTES` | Optional, informational only (the actual timer just counts up from first scan) |
| `HINT_UNLOCK_MINUTES` | Minutes before a hint becomes available (default 6) |
| `MAX_HINTS_PER_TEAM` | Max hints per team for the whole hunt (default 2) |

## 3. Install & run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. Go to `/admin`, log in with your
`ADMIN_PASSWORD`, and either:

- Click **Database Tools → Seed Demo Data** for a quick 20-team demo, or
- Add your own teams/locations from scratch under **Teams** and
  **Locations**, then generate orders under **Orders** and write
  clues under **Clues**.

## 4. Deploy

The app is a standard Next.js 14 App Router project — deploy it
anywhere Next.js runs. Easiest path is **Vercel**:

1. Push this project to a Git repo (GitHub/GitLab/Bitbucket).
2. Import it into [vercel.com](https://vercel.com/new).
3. Add the environment variables from step 2 in the Vercel project
   settings.
4. Deploy. Set `NEXT_PUBLIC_APP_URL` to the resulting `*.vercel.app`
   URL (or your custom domain) and redeploy so QR codes point to the
   right place.

## 5. Event-day checklist

- [ ] Teams, locations, orders, and clues all set up (check the
      counts on **Admin → Dashboard**)
- [ ] Downloaded & printed:
  - [ ] All team login QRs (**Admin → Teams → Download all login QRs**)
  - [ ] All location QR packs, one PDF per location (**Admin →
        Database Tools → Bulk QR export**)
- [ ] QR codes laminated/protected and placed at each location,
      clearly labeled by team name
- [ ] Ran **Admin → Database Tools → Reset All Sessions** right
      before go-live, so timers start clean
- [ ] Leaderboard (`/leaderboard`) open on a big screen
- [ ] Test the full flow end-to-end with one throwaway team first!

---

## Project structure

```
src/
  app/                 Next.js App Router pages + API routes
    login/             Team login (via QR-encoded URL, or in-app scan)
    game/               Main gameplay screen
    scan/               In-game QR scanner
    leaderboard/         Public live leaderboard
    admin/              Password-protected admin panel
    api/                Server routes (auth, scan validation, admin CRUD, ...)
  components/          UI, game, scanner, leaderboard, and admin components
  lib/                 Supabase clients, session/cookie signing, game logic,
                       QR/PDF helpers, shared types & utils
supabase/
  schema.sql           Run this first in the Supabase SQL editor
  seed.sql             Optional demo data
```

## Notes & design decisions

- **Polling, not Realtime subscriptions.** The team game screen and
  public leaderboard refetch every few seconds via plain `fetch`
  calls instead of subscribing to Supabase Realtime. This keeps the
  client bundle simpler and needs no extra Supabase configuration
  beyond the SQL schema — swap in a `postgres_changes` subscription
  (scaffolded via the `alter publication supabase_realtime add table
  game_sessions;` line in `schema.sql`) if you want push updates
  instead.
- **Server-side validation only.** All game logic (which step a team
  is on, whether a scanned QR is valid, hint gating, timing) lives in
  API routes using the service-role key. The browser never sees
  other teams' clue text or QR values.
- **No native app required.** QR login can work two ways: teams can
  scan their login QR with their phone's regular camera app (it
  opens `/login?team=...` directly), or use the in-app scanner at
  `/login/scan`. Mid-hunt clue QRs are always scanned in-app at
  `/scan`.
