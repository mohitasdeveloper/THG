import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, UnauthorizedError } from "@/lib/session";
import { generateLoginToken, generateClueQrValue, shuffle } from "@/lib/utils";

function guard() {
  try {
    requireAdmin();
    return null;
  } catch (e) {
    if (e instanceof UnauthorizedError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}

export async function GET() {
  const unauthorized = guard();
  if (unauthorized) return unauthorized;

  const db = supabaseAdmin();
  const [{ count: teams }, { count: locations }, { count: orders }, { count: clues }, { count: sessions }] =
    await Promise.all([
      db.from("teams").select("*", { count: "exact", head: true }),
      db.from("locations").select("*", { count: "exact", head: true }),
      db.from("team_location_order").select("*", { count: "exact", head: true }),
      db.from("clues").select("*", { count: "exact", head: true }),
      db.from("game_sessions").select("*", { count: "exact", head: true }).not("started_at", "is", null),
    ]);

  return NextResponse.json({
    teams: teams ?? 0,
    locations: locations ?? 0,
    ordersDefined: orders ?? 0,
    ordersExpected: (teams ?? 0) * 5,
    clues: clues ?? 0,
    cluesExpected: (teams ?? 0) * 5,
    activeSessions: sessions ?? 0,
  });
}

const DEMO_TEAM_NAMES = [
  "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota",
  "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon",
];

const DEMO_LOCATIONS = [
  { name: "Library", description: "Where knowledge sleeps in rows" },
  { name: "Clock Tower", description: "Where time is always on display" },
  { name: "Mirror Hall", description: "Where reflections never lie" },
  { name: "Fireplace", description: "Where warmth and memories gather" },
  { name: "Main Gate", description: "Where journeys begin and end" },
];

export async function POST(req: NextRequest) {
  const unauthorized = guard();
  if (unauthorized) return unauthorized;

  const db = supabaseAdmin();
  const { action } = await req.json();

  if (action === "reset-sessions") {
    await db.from("clue_progress").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await db.from("game_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    return NextResponse.json({ ok: true });
  }

  if (action === "full-reset") {
    await db.from("clue_progress").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await db.from("game_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await db.from("clues").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await db.from("team_location_order").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await db.from("locations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await db.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    return NextResponse.json({ ok: true });
  }

  if (action === "seed-demo") {
    // Teams
    const { data: existingTeams } = await db.from("teams").select("id, name");
    const existingNames = new Set((existingTeams ?? []).map((t) => t.name));
    const teamsToInsert = DEMO_TEAM_NAMES.filter((n) => !existingNames.has(`Team ${n}`)).map(
      (n) => ({ name: `Team ${n}`, login_token: generateLoginToken(`Team ${n}`) })
    );
    if (teamsToInsert.length) await db.from("teams").insert(teamsToInsert);

    // Locations
    const { data: existingLocations } = await db.from("locations").select("id, name");
    const existingLocNames = new Set((existingLocations ?? []).map((l) => l.name));
    const locsToInsert = DEMO_LOCATIONS.filter((l) => !existingLocNames.has(l.name));
    if (locsToInsert.length) await db.from("locations").insert(locsToInsert);

    const { data: teams } = await db.from("teams").select("id");
    const { data: locations } = await db.from("locations").select("id, name");

    // Orders — only generate for teams missing a full set of 5
    const { data: orders } = await db.from("team_location_order").select("id, team_id");
    const orderCountByTeam = new Map<string, number>();
    (orders ?? []).forEach((o) =>
      orderCountByTeam.set(o.team_id, (orderCountByTeam.get(o.team_id) ?? 0) + 1)
    );
    const teamsNeedingOrders = (teams ?? []).filter(
      (t) => (orderCountByTeam.get(t.id) ?? 0) !== 5
    );
    const newOrderRows: { team_id: string; location_id: string; sequence_order: number }[] = [];
    for (const t of teamsNeedingOrders) {
      await db.from("team_location_order").delete().eq("team_id", t.id);
      const shuffled = shuffle(locations ?? []);
      shuffled.forEach((loc, idx) =>
        newOrderRows.push({ team_id: t.id, location_id: loc.id, sequence_order: idx + 1 })
      );
    }
    if (newOrderRows.length) await db.from("team_location_order").insert(newOrderRows);

    // Placeholder clues for anything still missing
    const { data: allOrders } = await db
      .from("team_location_order")
      .select("id, team_id, location_id");
    const { data: allClues } = await db.from("clues").select("team_location_order_id");
    const haveClue = new Set((allClues ?? []).map((c) => c.team_location_order_id));
    const { data: allTeams } = await db.from("teams").select("id, name");
    const missing = (allOrders ?? []).filter((o) => !haveClue.has(o.id));
    const clueRows = missing.map((o) => {
      const teamName = allTeams?.find((t) => t.id === o.team_id)?.name ?? "Team";
      const locName = locations?.find((l) => l.id === o.location_id)?.name ?? "Location";
      return {
        team_location_order_id: o.id,
        clue_text: `[Demo clue] Find your way to the place known as: ${locName}.`,
        hint_text: `It's the ${locName}.`,
        qr_code_value: generateClueQrValue(locName, teamName),
      };
    });
    if (clueRows.length) await db.from("clues").insert(clueRows);

    return NextResponse.json({
      ok: true,
      teamsCreated: teamsToInsert.length,
      locationsCreated: locsToInsert.length,
      ordersCreated: newOrderRows.length,
      cluesCreated: clueRows.length,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
