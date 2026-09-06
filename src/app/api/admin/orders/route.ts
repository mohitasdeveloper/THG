import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, UnauthorizedError } from "@/lib/session";
import { shuffle } from "@/lib/utils";

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

// GET /api/admin/orders            -> full overview matrix for all teams
// GET /api/admin/orders?teamId=... -> one team's order (5 rows)
// GET /api/admin/orders?export=csv -> CSV text of the overview
export async function GET(req: NextRequest) {
  const unauthorized = guard();
  if (unauthorized) return unauthorized;

  const db = supabaseAdmin();
  const teamId = req.nextUrl.searchParams.get("teamId");
  const wantsCsv = req.nextUrl.searchParams.get("export") === "csv";

  const { data: teams } = await db.from("teams").select("id, name").order("name");
  const { data: locations } = await db.from("locations").select("id, name").order("name");
  const { data: orders } = await db
    .from("team_location_order")
    .select("id, team_id, location_id, sequence_order");

  if (teamId) {
    const rows = (orders ?? [])
      .filter((o) => o.team_id === teamId)
      .sort((a, b) => a.sequence_order - b.sequence_order)
      .map((o) => ({
        sequence_order: o.sequence_order,
        location_id: o.location_id,
        location_name: locations?.find((l) => l.id === o.location_id)?.name ?? "?",
        order_id: o.id,
      }));
    return NextResponse.json({ rows, locations });
  }

  const matrix = (teams ?? []).map((t) => {
    const teamOrders = (orders ?? [])
      .filter((o) => o.team_id === t.id)
      .sort((a, b) => a.sequence_order - b.sequence_order);
    return {
      team_id: t.id,
      team_name: t.name,
      steps: teamOrders.map((o) => ({
        sequence_order: o.sequence_order,
        location_name: locations?.find((l) => l.id === o.location_id)?.name ?? "?",
      })),
    };
  });

  if (wantsCsv) {
    const header = "team_name,step_1,step_2,step_3,step_4,step_5";
    const lines = matrix.map((row) => {
      const cells = [1, 2, 3, 4, 5].map(
        (n) => row.steps.find((s) => s.sequence_order === n)?.location_name ?? ""
      );
      return [row.team_name, ...cells].join(",");
    });
    const csv = [header, ...lines].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="location-orders.csv"',
      },
    });
  }

  return NextResponse.json({ matrix, teams, locations });
}

// POST body: { action: 'save', teamId, order: [{sequence_order, location_id}] }
//          | { action: 'generate' }
//          | { action: 'import', csv: string }
export async function POST(req: NextRequest) {
  const unauthorized = guard();
  if (unauthorized) return unauthorized;

  const db = supabaseAdmin();
  const body = await req.json();

  if (body.action === "save") {
    const { teamId, order } = body as {
      teamId: string;
      order: { sequence_order: number; location_id: string }[];
    };
    if (!teamId || !Array.isArray(order) || order.length === 0) {
      return NextResponse.json({ error: "teamId + order required" }, { status: 400 });
    }
    const seqs = order.map((o) => o.sequence_order);
    const locs = order.map((o) => o.location_id);
    if (new Set(seqs).size !== seqs.length || new Set(locs).size !== locs.length) {
      return NextResponse.json(
        { error: "Order must have no duplicate steps or locations" },
        { status: 400 }
      );
    }

    // Wipe this team's existing order (cascades to clues for those
    // rows) then insert the new one.
    await db.from("team_location_order").delete().eq("team_id", teamId);
    const { error } = await db.from("team_location_order").insert(
      order.map((o) => ({
        team_id: teamId,
        location_id: o.location_id,
        sequence_order: o.sequence_order,
      }))
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "generate") {
    const { data: teams } = await db.from("teams").select("id");
    const { data: locations } = await db.from("locations").select("id");
    if (!teams?.length || !locations?.length) {
      return NextResponse.json({ error: "Need teams and locations first" }, { status: 400 });
    }
    // Wipe all existing orders (cascades to clues) then regenerate.
    await db.from("team_location_order").delete().neq("team_id", "00000000-0000-0000-0000-000000000000");

    const rows: { team_id: string; location_id: string; sequence_order: number }[] = [];
    for (const t of teams) {
      const shuffled = shuffle(locations);
      shuffled.forEach((loc, idx) => {
        rows.push({ team_id: t.id, location_id: loc.id, sequence_order: idx + 1 });
      });
    }
    const { error } = await db.from("team_location_order").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, count: rows.length });
  }

  if (body.action === "import") {
    const { csv } = body as { csv: string };
    if (!csv) return NextResponse.json({ error: "csv required" }, { status: 400 });

    const { data: teams } = await db.from("teams").select("id, name");
    const { data: locations } = await db.from("locations").select("id, name");
    const teamByName = new Map((teams ?? []).map((t) => [t.name.trim().toLowerCase(), t.id]));
    const locByName = new Map((locations ?? []).map((l) => [l.name.trim().toLowerCase(), l.id]));

    const lines = csv.trim().split(/\r?\n/);
    const [, ...dataLines] = lines; // skip header
    const rows: { team_id: string; location_id: string; sequence_order: number }[] = [];
    const errors: string[] = [];

    for (const line of dataLines) {
      if (!line.trim()) continue;
      const cells = line.split(",").map((c) => c.trim());
      const [teamName, ...steps] = cells;
      const teamId = teamByName.get(teamName.toLowerCase());
      if (!teamId) {
        errors.push(`Unknown team: ${teamName}`);
        continue;
      }
      if (steps.length !== 5) {
        errors.push(`${teamName}: expected 5 steps, got ${steps.length}`);
        continue;
      }
      const locIds = steps.map((s) => locByName.get(s.toLowerCase()));
      if (locIds.some((id) => !id)) {
        errors.push(`${teamName}: unknown location in [${steps.join(", ")}]`);
        continue;
      }
      locIds.forEach((locationId, idx) => {
        rows.push({ team_id: teamId, location_id: locationId as string, sequence_order: idx + 1 });
      });
    }

    if (errors.length) {
      return NextResponse.json({ error: "Some rows failed", details: errors }, { status: 400 });
    }

    const teamIds = Array.from(new Set(rows.map((r) => r.team_id)));
    for (const tid of teamIds) {
      await db.from("team_location_order").delete().eq("team_id", tid);
    }
    const { error } = await db.from("team_location_order").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, count: rows.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
