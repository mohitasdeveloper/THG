"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// This client only ever has anon privileges. RLS locks every base
// table down; it can only read the public `leaderboard` view and
// listen to Realtime changes on `game_sessions` (used to know
// *when* to refetch — the actual data always comes from our own
// API routes, which use the service-role key server-side).
export const supabaseBrowser = createClient(url, anonKey, {
  auth: { persistSession: false },
});
