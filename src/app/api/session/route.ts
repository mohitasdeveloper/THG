import { NextResponse } from "next/server";
import { getTeamIdFromCookie } from "@/lib/session";
import { loadGameState } from "@/lib/game";

export async function GET() {
  const teamId = getTeamIdFromCookie();
  if (!teamId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  try {
    const state = await loadGameState(teamId);
    return NextResponse.json(state);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
