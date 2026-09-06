-- ============================================================
-- Treasure Hunt App — Database Schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

create extension if not exists "pgcrypto";

-- 1. Teams
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  login_token text unique not null,
  created_at timestamptz default now()
);

-- 2. Locations
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

-- 3. Team location order
create table if not exists team_location_order (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  location_id uuid references locations(id) on delete cascade not null,
  sequence_order int not null,
  created_at timestamptz default now(),
  unique (team_id, location_id),
  unique (team_id, sequence_order)
);

-- 4. Clues
create table if not exists clues (
  id uuid primary key default gen_random_uuid(),
  team_location_order_id uuid references team_location_order(id) on delete cascade not null unique,
  clue_text text not null,
  hint_text text not null,
  qr_code_value text unique not null,
  created_at timestamptz default now()
);

-- 5. Game sessions
create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade unique not null,
  started_at timestamptz,
  finished_at timestamptz,
  is_completed boolean default false,
  current_sequence_order int default 1,
  hints_used int default 0,
  total_time_seconds int,
  created_at timestamptz default now()
);

-- 6. Clue progress
create table if not exists clue_progress (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references game_sessions(id) on delete cascade,
  team_location_order_id uuid references team_location_order(id) on delete cascade,
  scanned_at timestamptz default now(),
  hint_revealed_at timestamptz,
  unique (session_id, team_location_order_id)
);

-- Leaderboard view
create or replace view leaderboard as
select
  t.id as team_id,
  t.name as team_name,
  gs.started_at,
  gs.finished_at,
  gs.is_completed,
  coalesce(gs.current_sequence_order, 1) as current_sequence_order,
  coalesce(gs.hints_used, 0) as hints_used,
  gs.total_time_seconds,
  case
    when gs.is_completed then 'completed'
    when gs.started_at is not null then 'playing'
    else 'waiting'
  end as status,
  rank() over (
    order by
      case when gs.is_completed then 0 else 1 end,
      gs.total_time_seconds asc nulls last,
      coalesce(gs.hints_used, 0) asc,
      gs.finished_at asc nulls last
  ) as rank
from teams t
left join game_sessions gs on t.id = gs.team_id
order by rank;

-- ============================================================
-- Row Level Security
-- All writes happen through server-side API routes using the
-- service-role key, so we lock the tables down entirely for the
-- anon/public role and only allow SELECT on the public leaderboard.
-- ============================================================

alter table teams enable row level security;
alter table locations enable row level security;
alter table team_location_order enable row level security;
alter table clues enable row level security;
alter table game_sessions enable row level security;
alter table clue_progress enable row level security;

-- No public policies are created — anon key has zero access to base
-- tables. The `leaderboard` view is a plain view (not a table), so
-- grant select on it directly to anon/authenticated:
grant select on leaderboard to anon, authenticated;

-- Enable Realtime on game_sessions (used for live leaderboard/game updates)
-- In the Supabase dashboard: Database > Replication > enable for game_sessions
-- Or via SQL:
alter publication supabase_realtime add table game_sessions;
