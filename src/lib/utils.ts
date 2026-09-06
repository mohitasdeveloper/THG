import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined) return "--:--";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function shortSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/team\s*/i, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 10) || "team";
}

export function locationShort(name: string): string {
  const cleaned = name.toUpperCase().replace(/[^A-Z0-9]+/g, "");
  return cleaned.slice(0, 3) || "LOC";
}

export function randomToken(length = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function generateLoginToken(teamName: string): string {
  return `tk_${shortSlug(teamName)}_${randomToken(10)}`;
}

export function generateClueQrValue(
  locationName: string,
  teamName: string
): string {
  return `CLQ_${locationShort(locationName)}_${shortSlug(
    teamName
  ).toUpperCase()}_${randomToken(8)}`;
}

// Fisher-Yates shuffle — used for random location order generation
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ordinalRank(rank: number): string {
  if (rank === 1) return "🥇 1st";
  if (rank === 2) return "🥈 2nd";
  if (rank === 3) return "🥉 3rd";
  return `#${rank}`;
}
