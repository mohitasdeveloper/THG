import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, UnauthorizedError } from "@/lib/session";
import { generateLoginToken } from "@/lib/utils";

export async function GET() {
  try {
    requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
  const db = supabaseAdmin();
  const { data: teams, error } = await db
    .from("teams")
    .select("*")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: sessions } = await db.from("game_sessions").select("*");
  const byTeam = new Map((sessions ?? []).map((s) => [s.team_id, s]));

  const enriched = (teams ?? []).map((t) => ({
    ...t,
    session: byTeam.get(t.id) ?? null,
  }));

  return NextResponse.json({ teams: enriched });
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Team name required" }, { status: 400 });
  }
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("teams")
    .insert({ name, login_token: generateLoginToken(name) })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ team: data });
}
