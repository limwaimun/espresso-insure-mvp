import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminUser } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST — manually end the currently active directive.
// Auth: admin user only.
// Body: optional. If not provided, ends whatever is active.
// No-op if nothing is active (returns ok:true, ended:null).
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  // Find the active directive.
  const { data: active, error: fetchErr } = await supabase
    .from("brain_directives")
    .select("id, title")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 });

  if (!active) {
    return NextResponse.json({ ok: true, ended: null, note: "no active directive" });
  }

  const { data: ended, error: updateErr } = await supabase
    .from("brain_directives")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", active.id)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, ended });
}
