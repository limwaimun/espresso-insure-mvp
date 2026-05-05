import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminUser } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

async function expireStale(supabase: any) {
  // Best-effort: ignore errors. Worst case the dashboard shows a "stale active"
  // directive for one tick.
  try { await supabase.rpc("expire_stale_directives"); } catch {}
}

// GET — returns active directive or null.
// Auth: bearer CRON_SECRET (so brain tick can read it server-to-server)
//       OR admin cookie (so dashboard can read it).
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET ?? "";
  const isCron = expected && auth === `Bearer ${expected}`;

  if (!isCron) {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = supa();
  await expireStale(supabase);

  const { data, error } = await supabase
    .from("brain_directives")
    .select("id, title, description, workstream, expires_at, created_at, status")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, active: data ?? null, fetched_at: new Date().toISOString() });
}

// POST — set a new active directive.
// Auth: admin user only.
// Body: { title, description?, workstream, duration_hours }
// Refuses with 409 if an active directive already exists.
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const title = String(body?.title ?? "").trim();
  const description = body?.description ? String(body.description).trim() : null;
  const workstream = String(body?.workstream ?? "").trim();
  const durationHours = Number(body?.duration_hours);

  if (!title) return NextResponse.json({ ok: false, error: "title required" }, { status: 400 });
  if (!workstream) return NextResponse.json({ ok: false, error: "workstream required" }, { status: 400 });
  if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > 168) {
    return NextResponse.json({ ok: false, error: "duration_hours must be 1-168" }, { status: 400 });
  }

  const supabase = supa();
  await expireStale(supabase);

  // Check there's no active directive already.
  const { data: existing } = await supabase
    .from("brain_directives")
    .select("id, title")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { ok: false, error: "active directive already exists", existing },
      { status: 409 }
    );
  }

  const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

  const { data, error } = await supabase
    .from("brain_directives")
    .insert({
      title,
      description,
      workstream,
      expires_at: expiresAt,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, directive: data });
}
