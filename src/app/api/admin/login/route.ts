import { NextRequest, NextResponse } from "next/server";
import { setAdminSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured on the server" },
      { status: 500 }
    );
  }
  if (password !== expected) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  setAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
