import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Public — anyone can view the leaderboard, so no auth check here.
// Uses the service-role client purely for convenience/reliability;
// the `leaderboard` view itself is also readable by the anon key
// (see supabase/schema.sql) if you'd rather query it directly from
// the browser with Realtime.
export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db.from("leaderboard").select("*").order("rank");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data });
}
