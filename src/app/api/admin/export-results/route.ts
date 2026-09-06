import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, UnauthorizedError } from "@/lib/session";
import { formatTime } from "@/lib/utils";

export async function GET() {
  try {
    requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  const db = supabaseAdmin();
  const { data, error } = await db.from("leaderboard").select("*").order("rank");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = "rank,team_name,status,step,time,hints_used,started_at,finished_at";
  const lines = (data ?? []).map((r) =>
    [
      r.rank,
      r.team_name,
      r.status,
      `${r.current_sequence_order}/5`,
      formatTime(r.total_time_seconds),
      r.hints_used,
      r.started_at ?? "",
      r.finished_at ?? "",
    ].join(",")
  );
  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="treasure-hunt-results.csv"',
    },
  });
}
