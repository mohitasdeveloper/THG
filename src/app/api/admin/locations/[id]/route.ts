import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, UnauthorizedError } from "@/lib/session";

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
  const { name, description } = await req.json();
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("locations")
    .update({ name, description })
    .eq("id", params.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ location: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = guard();
  if (unauthorized) return unauthorized;
  const db = supabaseAdmin();
  const { error } = await db.from("locations").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
