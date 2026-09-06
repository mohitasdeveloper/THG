import { supabaseAdmin } from "./supabase/server";
import { HINT_UNLOCK_MINUTES, MAX_HINTS_PER_TEAM, TOTAL_LOCATIONS } from "./constants";
import type { GameStateResponse } from "./types";

/**
 * Loads (or lazily creates) a team's game_sessions row, then builds
 * the exact payload the /game page needs: current clue text (never
 * the location name — that would give the answer away), hint state,
 * and final stats if the hunt is complete.
 */
export async function loadGameState(teamId: string): Promise<GameStateResponse> {
  const db = supabaseAdmin();

  const { data: team, error: teamErr } = await db
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .single();
  if (teamErr || !team) throw new Error("Team not found");

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
    if (createErr) throw createErr;
    session = created;
  }

  if (session.is_completed) {
    const { data: lb } = await db
      .from("leaderboard")
      .select("rank")
      .eq("team_id", teamId)
      .maybeSingle();

    return {
      team,
      session,
      totalSteps: TOTAL_LOCATIONS,
      currentClue: null,
      hint: null,
      isCompleted: true,
      finalStats: {
        totalTimeSeconds: session.total_time_seconds ?? 0,
        hintsUsed: session.hints_used,
        rank: lb?.rank ?? 0,
      },
    };
  }

  // Find this team's clue for the current sequence position.
  const { data: order } = await db
    .from("team_location_order")
    .select("id")
    .eq("team_id", teamId)
    .eq("sequence_order", session.current_sequence_order)
    .maybeSingle();

  if (!order) {
    // Orders/clues haven't been set up by the admin yet.
    return {
      team,
      session,
      totalSteps: TOTAL_LOCATIONS,
      currentClue: null,
      hint: null,
      isCompleted: false,
    };
  }

  const { data: clue } = await db
    .from("clues")
    .select("*")
    .eq("team_location_order_id", order.id)
    .maybeSingle();

  if (!clue) {
    return {
      team,
      session,
      totalSteps: TOTAL_LOCATIONS,
      currentClue: null,
      hint: null,
      isCompleted: false,
    };
  }

  // Hint availability: only counts once the clock has started
  // (started_at set), i.e. not on the very first, pre-scan clue.
  let hintsRemaining = MAX_HINTS_PER_TEAM - session.hints_used;
  const { data: progress } = await db
    .from("clue_progress")
    .select("hint_revealed_at")
    .eq("session_id", session.id)
    .eq("team_location_order_id", order.id)
    .maybeSingle();

  const hintRevealed = !!progress?.hint_revealed_at;

  let unlockAtSeconds = HINT_UNLOCK_MINUTES * 60;
  if (session.started_at) {
    // Hint unlock is relative to when the *current* step began.
    // We approximate "step start" with started_at for step 1, and
    // otherwise just always allow after HINT_UNLOCK_MINUTES of the
    // overall timer for simplicity (documented in README).
    unlockAtSeconds = HINT_UNLOCK_MINUTES * 60;
  }

  return {
    team,
    session,
    totalSteps: TOTAL_LOCATIONS,
    currentClue: {
      sequenceOrder: clue ? session.current_sequence_order : session.current_sequence_order,
      clueText: clue.clue_text,
    },
    hint: {
      unlockAtSeconds,
      revealed: hintRevealed,
      text: hintRevealed ? clue.hint_text : null,
      hintsRemaining: Math.max(0, hintsRemaining),
    },
    isCompleted: false,
  };
}
