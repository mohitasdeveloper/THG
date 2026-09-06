import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTeamIdFromCookie } from "@/lib/session";
import { MAX_HINTS_PER_TEAM } from "@/lib/constants";
import { loadGameState } from "@/lib/game";

export async function POST() {
  const teamId = getTeamIdFromCookie();
  if (!teamId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const db = supabaseAdmin();

  const { data: session } = await db
    .from("game_sessions")
    .select("*")
    .eq("team_id", teamId)
    .maybeSingle();

  if (!session || session.is_completed) {
    return NextResponse.json({ error: "No active step" }, { status: 400 });
  }

  if (session.hints_used >= MAX_HINTS_PER_TEAM) {
    return NextResponse.json({ error: "No hints remaining" }, { status: 400 });
  }

  const { data: order } = await db
    .from("team_location_order")
    .select("id")
    .eq("team_id", teamId)
    .eq("sequence_order", session.current_sequence_order)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Clue not set up yet" }, { status: 400 });
  }

  // Upsert clue_progress row for this step to mark hint_revealed_at,
  // without requiring the step to have been scanned yet.
  const { data: existingProgress } = await db
    .from("clue_progress")
    .select("id, hint_revealed_at")
    .eq("session_id", session.id)
    .eq("team_location_order_id", order.id)
    .maybeSingle();

  if (existingProgress?.hint_revealed_at) {
    // Already revealed — just return current state, don't double count.
    const state = await loadGameState(teamId);
    return NextResponse.json({ state });
  }

  if (existingProgress) {
    await db
      .from("clue_progress")
      .update({ hint_revealed_at: new Date().toISOString() })
      .eq("id", existingProgress.id);
  } else {
    await db.from("clue_progress").insert({
      session_id: session.id,
      team_location_order_id: order.id,
      hint_revealed_at: new Date().toISOString(),
      // scanned_at defaults to now() but this row isn't a real scan;
      // scan validation only ever checks qr_code_value + sequence,
      // so a placeholder progress row here is harmless.
    });
  }

  await db
    .from("game_sessions")
    .update({ hints_used: session.hints_used + 1 })
    .eq("id", session.id);

  const state = await loadGameState(teamId);
  return NextResponse.json({ state });
}
