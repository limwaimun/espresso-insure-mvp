import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET ?? "";
  if (!expected || auth !== `Bearer ${expected}`) return unauthorized();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("work_orders")
    .select(
      "id, title, intent, rationale, files_to_change, risk_level, category, workstream, spec, status, dispatched_at, approval_token"
    )
    .eq("status", "dispatched")
    .is("completed_at", null)
    .order("dispatched_at", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    count: data?.length ?? 0,
    orders: data ?? [],
    fetched_at: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
