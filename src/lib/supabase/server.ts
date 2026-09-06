import { createClient } from "@supabase/supabase-js";

// SERVER ONLY. Never import this from a "use client" file or expose
// the service role key to the browser. It bypasses RLS entirely, so
// every route that uses it must do its own auth/ownership checks.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
