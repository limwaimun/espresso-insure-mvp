import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// Atomically claim a dispatched order for execution.
//
// Auth: Bearer ${CRON_SECRET} (same as other cron routes).
// Body: { order_id: string, executor_id?: string }
//
// Returns:
//   200 { ok: true, order: <full order body> } — claim succeeded, executor proceeds
//   200 { ok: false, reason: "already_claimed_or_not_dispatched" } — someone else got it
//   400 / 401 / 404 / 500 on errors
//
// Atomicity: the UPDATE is conditional on status='dispatched' and matches at most
// one row. Two concurrent executors race; only one succeeds, the loser sees 0 rows.
// Postgres handles the single-statement atomicity natively, no advisory locks needed.

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const orderId = String(body?.order_id ?? "").trim();
  const executorId = body?.executor_id ? String(body.executor_id).trim().slice(0, 100) : null;

  if (!orderId) {
    return NextResponse.json({ ok: false, error: "order_id required" }, { status: 400 });
  }

  // Atomic claim: flip dispatched -> running. Single UPDATE statement.
  // .eq("status", "dispatched") is the conditional that makes this race-safe.
  const { data: claimed, error: claimErr } = await supabase
    .from("work_orders")
    .update({
      status: "running",
      running_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "dispatched")
    .select()
    .maybeSingle();

  if (claimErr) {
    return NextResponse.json(
      { ok: false, error: claimErr.message },
      { status: 500 }
    );
  }

  if (!claimed) {
    // Either: order doesn't exist, or another executor already claimed it,
    // or it's not in 'dispatched' state (already running/done/etc).
    // Disambiguate by reading current state.
    const { data: current } = await supabase
      .from("work_orders")
      .select("id, status, running_at")
      .eq("id", orderId)
      .maybeSingle();

    await supabase.from("execution_log").insert({
      work_order_id: orderId,
      action: "claim",
      success: false,
      error_message: current
        ? `already_claimed_or_not_dispatched (current status: ${current.status})`
        : "order not found",
      raw_output: executorId ? JSON.stringify({ executor_id: executorId }) : null,
    });

    return NextResponse.json({
      ok: false,
      reason: "already_claimed_or_not_dispatched",
      current_status: current?.status ?? null,
    });
  }

  // Successful claim — log it.
  await supabase.from("execution_log").insert({
    work_order_id: orderId,
    action: "claim",
    success: true,
    raw_output: executorId ? JSON.stringify({ executor_id: executorId }) : null,
  });

  return NextResponse.json({ ok: true, order: claimed });
}
