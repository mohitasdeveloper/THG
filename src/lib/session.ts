import crypto from "crypto";
import { cookies } from "next/headers";
import { TEAM_SESSION_COOKIE, ADMIN_SESSION_COOKIE } from "./constants";

function secret() {
  const s = process.env.COOKIE_SECRET;
  if (!s) throw new Error("Missing COOKIE_SECRET env var");
  return s;
}

function sign(value: string) {
  const h = crypto.createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${h}`;
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto
    .createHmac("sha256", secret())
    .update(value)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

// ---- Team session ----

export function setTeamSessionCookie(teamId: string) {
  cookies().set(TEAM_SESSION_COOKIE, sign(teamId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours — plenty for one event
  });
}

export function getTeamIdFromCookie(): string | null {
  const raw = cookies().get(TEAM_SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verify(raw);
}

export function clearTeamSessionCookie() {
  cookies().delete(TEAM_SESSION_COOKIE);
}

// ---- Admin session ----

export function setAdminSessionCookie() {
  cookies().set(ADMIN_SESSION_COOKIE, sign("admin"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function isAdminAuthed(): boolean {
  const raw = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!raw) return false;
  return verify(raw) === "admin";
}

export function clearAdminSessionCookie() {
  cookies().delete(ADMIN_SESSION_COOKIE);
}

export class UnauthorizedError extends Error {}

export function requireAdmin() {
  if (!isAdminAuthed()) {
    throw new UnauthorizedError("Not authorized");
  }
}
