export const GAME_TIME_MINUTES = Number(process.env.GAME_TIME_MINUTES ?? 30);
export const HINT_UNLOCK_MINUTES = Number(process.env.HINT_UNLOCK_MINUTES ?? 6);
export const MAX_HINTS_PER_TEAM = Number(process.env.MAX_HINTS_PER_TEAM ?? 2);
export const TOTAL_LOCATIONS = 5;

export const COLORS = {
  primary: "#1a73e8",
  primaryDark: "#1557b0",
  surface: "#ffffff",
  background: "#f8f9fa",
  success: "#1e8e3e",
  error: "#d93025",
  warning: "#f9ab00",
  textPrimary: "#202124",
  textSecondary: "#5f6368",
  border: "#dadce0",
  divider: "#e8eaed",
};

export const TEAM_SESSION_COOKIE = "th_team_session";
export const ADMIN_SESSION_COOKIE = "th_admin_session";
