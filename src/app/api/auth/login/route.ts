import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { setTeamSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: team, error } = await db
    .from("teams")
    .select("id, name")
    .eq("login_token", token)
    .maybeSingle();

  if (error || !team) {
    return NextResponse.json(
      { error: "That QR code isn't recognized. Ask an organizer for help." },
      { status: 404 }
    );
  }

  setTeamSessionCookie(team.id);
  return NextResponse.json({ team });
}
