import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTeamIdFromCookie } from "@/lib/session";
import { loadGameState } from "@/lib/game";
import { TOTAL_LOCATIONS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const teamId = getTeamIdFromCookie();
  if (!teamId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { qrValue } = await req.json();
  if (!qrValue || typeof qrValue !== "string") {
    return NextResponse.json({ valid: false, error: "No QR value received" });
  }

  const db = supabaseAdmin();

  // 1. Find the clue by its QR value.
  const { data: clue } = await db
    .from("clues")
    .select("id, team_location_order_id")
    .eq("qr_code_value", qrValue.trim())
    .maybeSingle();

  if (!clue) {
    return NextResponse.json({
      valid: false,
      error: "Invalid QR code — this isn't a hunt clue.",
    });
  }

  // 2. Get the team_location_order row this clue is tied to.
  const { data: order } = await db
    .from("team_location_order")
    .select("id, team_id, sequence_order")
    .eq("id", clue.team_location_order_id)
    .single();

  if (!order) {
    return NextResponse.json({ valid: false, error: "Clue setup is broken — tell an organizer." });
  }

  // 3. Ownership check.
  if (order.team_id !== teamId) {
    return NextResponse.json({
      valid: false,
      error: "This QR belongs to another team!",
    });
  }

  // 4. Load / create the session.
  let { data: session } = await db
    .from("game_sessions")
    .select("*")
    .eq("team_id", teamId)
    .maybeSingle();

  if (!session) {
    const { data: created, error: createErr } = await db
      .from("game_sessions")
      .insert({ team_id: teamId, current_sequence_order: 1 })
      .select("*")
      .single();
    if (createErr) {
      return NextResponse.json({ valid: false, error: "Could not start session." }, { status: 500 });
    }
    session = created;
  }

  if (session.is_completed) {
    return NextResponse.json({
      valid: false,
      error: "You've already finished the hunt!",
    });
  }

  // 5. Sequence check.
  if (order.sequence_order !== session.current_sequence_order) {
    return NextResponse.json({
      valid: false,
      error: "Invalid QR code — this isn't the correct step.",
    });
  }

  // 6. All checks passed — record progress + advance.
  const now = new Date().toISOString();
  const isFirstScan = !session.started_at;
  const isLastClue = session.current_sequence_order === TOTAL_LOCATIONS;
  const nextSequence = session.current_sequence_order + 1;

  // Upsert (not plain insert): a hint may already have created a
  // clue_progress row for this step before the team found the QR.
  const { data: existingProgress } = await db
    .from("clue_progress")
    .select("id")
    .eq("session_id", session.id)
    .eq("team_location_order_id", order.id)
    .maybeSingle();

  if (existingProgress) {
    await db
      .from("clue_progress")
      .update({ scanned_at: now })
      .eq("id", existingProgress.id);
  } else {
    await db.from("clue_progress").insert({
      session_id: session.id,
      team_location_order_id: order.id,
      scanned_at: now,
    });
  }

  const startedAt = isFirstScan ? now : session.started_at;
  let totalTimeSeconds: number | null = null;
  if (isLastClue) {
    const startMs = new Date(startedAt as string).getTime();
    totalTimeSeconds = Math.round((Date.now() - startMs) / 1000);
  }

  const { data: updatedSession, error: updateErr } = await db
    .from("game_sessions")
    .update({
      started_at: startedAt,
      current_sequence_order: isLastClue ? session.current_sequence_order : nextSequence,
      is_completed: isLastClue,
      finished_at: isLastClue ? now : null,
      total_time_seconds: totalTimeSeconds,
    })
    .eq("id", session.id)
    .select("*")
    .single();

  if (updateErr) {
    return NextResponse.json({ valid: false, error: "Could not save progress." }, { status: 500 });
  }

  const state = await loadGameState(teamId);

  return NextResponse.json({
    valid: true,
    isLastClue,
    session: updatedSession,
    state,
  });
}
