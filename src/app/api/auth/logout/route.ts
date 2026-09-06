import { NextResponse } from "next/server";
import { clearTeamSessionCookie } from "@/lib/session";

export async function POST() {
  clearTeamSessionCookie();
  return NextResponse.json({ ok: true });
}
