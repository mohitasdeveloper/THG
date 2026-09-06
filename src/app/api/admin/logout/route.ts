import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/session";

export async function POST() {
  clearAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
