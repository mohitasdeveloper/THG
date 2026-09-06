export interface Team {
  id: string;
  name: string;
  login_token: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface TeamLocationOrder {
  id: string;
  team_id: string;
  location_id: string;
  sequence_order: number;
  created_at: string;
}

export interface Clue {
  id: string;
  team_location_order_id: string;
  clue_text: string;
  hint_text: string;
  qr_code_value: string;
  created_at: string;
}

export interface GameSession {
  id: string;
  team_id: string;
  started_at: string | null;
  finished_at: string | null;
  is_completed: boolean;
  current_sequence_order: number;
  hints_used: number;
  total_time_seconds: number | null;
  created_at: string;
}

export interface ClueProgress {
  id: string;
  session_id: string;
  team_location_order_id: string;
  scanned_at: string;
  hint_revealed_at: string | null;
}

export interface LeaderboardRow {
  team_id: string;
  team_name: string;
  started_at: string | null;
  finished_at: string | null;
  is_completed: boolean;
  current_sequence_order: number;
  hints_used: number;
  total_time_seconds: number | null;
  status: "waiting" | "playing" | "completed";
  rank: number;
}

export interface CurrentClueView {
  sequenceOrder: number;
  clueText: string;
  hintText: string;
  hintRevealed: boolean;
  locationNameForOrganizers?: string; // only ever sent to admin, not team
}

export interface GameStateResponse {
  team: { id: string; name: string };
  session: GameSession;
  totalSteps: number;
  currentClue: {
    sequenceOrder: number;
    clueText: string;
  } | null;
  hint: {
    unlockAtSeconds: number;
    revealed: boolean;
    text: string | null;
    hintsRemaining: number;
  } | null;
  isCompleted: boolean;
  finalStats?: {
    totalTimeSeconds: number;
    hintsUsed: number;
    rank: number;
  };
}
