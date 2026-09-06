import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, UnauthorizedError } from "@/lib/session";
import { generateLoginToken } from "@/lib/utils";

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = guard();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const db = supabaseAdmin();
  const update: Record<string, any> = {};
  if (body.name) update.name = body.name;
  if (body.regenerateToken) update.login_token = generateLoginToken(body.name ?? "team");

  const { data, error } = await db
    .from("teams")
    .update(update)
    .eq("id", params.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ team: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = guard();
  if (unauthorized) return unauthorized;

  const db = supabaseAdmin();
  const { error } = await db.from("teams").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
