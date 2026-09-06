import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, UnauthorizedError } from "@/lib/session";
import { generateClueQrValue } from "@/lib/utils";

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

// GET /api/admin/clues?teamId=... -> this team's 5 steps with clue text (if any)
// GET /api/admin/clues?all=true    -> every clue across all teams, with team+location names (for bulk QR export)
export async function GET(req: NextRequest) {
  const unauthorized = guard();
  if (unauthorized) return unauthorized;

  const teamId = req.nextUrl.searchParams.get("teamId");
  const all = req.nextUrl.searchParams.get("all") === "true";
  const db = supabaseAdmin();

  if (all) {
    const { data: clues } = await db.from("clues").select("*");
    const { data: orders } = await db
      .from("team_location_order")
      .select("id, team_id, location_id, sequence_order");
    const { data: teams } = await db.from("teams").select("id, name");
    const { data: locations } = await db.from("locations").select("id, name");

    const rows = (clues ?? []).map((c) => {
      const order = orders?.find((o) => o.id === c.team_location_order_id);
      return {
        qrCodeValue: c.qr_code_value,
        sequenceOrder: order?.sequence_order ?? 0,
        teamName: teams?.find((t) => t.id === order?.team_id)?.name ?? "?",
        locationName: locations?.find((l) => l.id === order?.location_id)?.name ?? "?",
      };
    });
    return NextResponse.json({ rows, locations: locations ?? [] });
  }

  if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });

  const { data: team } = await db.from("teams").select("name").eq("id", teamId).single();
  const { data: orders } = await db
    .from("team_location_order")
    .select("id, sequence_order, location_id")
    .eq("team_id", teamId)
    .order("sequence_order");
  const { data: locations } = await db.from("locations").select("id, name");
  const { data: clues } = await db
    .from("clues")
    .select("*")
    .in("team_location_order_id", (orders ?? []).map((o) => o.id));

  const rows = (orders ?? []).map((o) => {
    const clue = clues?.find((c) => c.team_location_order_id === o.id);
    return {
      teamLocationOrderId: o.id,
      sequenceOrder: o.sequence_order,
      locationName: locations?.find((l) => l.id === o.location_id)?.name ?? "?",
      clueText: clue?.clue_text ?? "",
      hintText: clue?.hint_text ?? "",
      qrCodeValue: clue?.qr_code_value ?? null,
    };
  });

  return NextResponse.json({ teamName: team?.name, rows });
}

// POST { action: 'save', teamLocationOrderId, clueText, hintText, locationName, teamName }
//    | { action: 'generatePlaceholders' } -- fills in any missing clue rows across all teams
export async function POST(req: NextRequest) {
  const unauthorized = guard();
  if (unauthorized) return unauthorized;

  const db = supabaseAdmin();
  const body = await req.json();

  if (body.action === "save") {
    const { teamLocationOrderId, clueText, hintText, locationName, teamName } = body;
    if (!teamLocationOrderId || !clueText || !hintText) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const { data: existing } = await db
      .from("clues")
      .select("id, qr_code_value")
      .eq("team_location_order_id", teamLocationOrderId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await db
        .from("clues")
        .update({ clue_text: clueText, hint_text: hintText })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ clue: data });
    }

    const qrValue = generateClueQrValue(locationName ?? "loc", teamName ?? "team");
    const { data, error } = await db
      .from("clues")
      .insert({
        team_location_order_id: teamLocationOrderId,
        clue_text: clueText,
        hint_text: hintText,
        qr_code_value: qrValue,
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ clue: data });
  }

  if (body.action === "generatePlaceholders") {
    const { data: orders } = await db
      .from("team_location_order")
      .select("id, sequence_order, team_id, location_id");
    const { data: clues } = await db.from("clues").select("team_location_order_id");
    const { data: teams } = await db.from("teams").select("id, name");
    const { data: locations } = await db.from("locations").select("id, name");

    const haveClue = new Set((clues ?? []).map((c) => c.team_location_order_id));
    const missing = (orders ?? []).filter((o) => !haveClue.has(o.id));

    const rows = missing.map((o) => {
      const teamName = teams?.find((t) => t.id === o.team_id)?.name ?? "Team";
      const locName = locations?.find((l) => l.id === o.location_id)?.name ?? "Location";
      return {
        team_location_order_id: o.id,
        clue_text: `[Placeholder] Your next stop has to do with: ${locName}. (Edit this clue in Admin > Clues!)`,
        hint_text: `It's the ${locName}.`,
        qr_code_value: generateClueQrValue(locName, teamName),
      };
    });

    if (rows.length) {
      const { error } = await db.from("clues").insert(rows);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, created: rows.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
