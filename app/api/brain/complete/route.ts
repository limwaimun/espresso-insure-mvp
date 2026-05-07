import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// Elon hits this after deploying. Captures the pre/post commit shas needed for revert.
//
// Auth: Bearer ${CRON_SECRET} (same as other cron routes — Elon already has this).
// Body JSON: { order_id, pre_dispatch_commit_sha, post_completion_commit_sha, deploy_url }

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
  const preSha = body?.pre_dispatch_commit_sha
    ? String(body.pre_dispatch_commit_sha).trim()
    : null;
  const postSha = body?.post_completion_commit_sha
    ? String(body.post_completion_commit_sha).trim()
    : null;
  const deployUrl = body?.deploy_url ? String(body.deploy_url).trim() : null;

  if (!orderId) return NextResponse.json({ ok: false, error: "order_id required" }, { status: 400 });

  const { data: order, error } = await supabase
    .from("work_orders")
    .select("id, status, post_completion_commit_sha")
    .eq("id", orderId)
    .single();
  if (error || !order) return NextResponse.json({ ok: false, error: "order not found" }, { status: 404 });

  // Idempotency: if already 'done', return ok-but-noop. Prevents duplicate
  // execution_log rows when an executor reports completion twice (the bug
  // we hit on order 5ae30089 yesterday — reported by 4 separate executions).
  if (order.status === "done") {
    return NextResponse.json({
      ok: true,
      noop: true,
      reason: "already_done",
      existing_commit_sha: order.post_completion_commit_sha,
    });
  }

  // Conditional update: only flip if NOT already done. Atomic — two concurrent
  // /complete calls can't both succeed. The .neq("status", "done") makes the
  // UPDATE no-op if the order has already been completed.
  const { data: updated } = await supabase
    .from("work_orders")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
      pre_dispatch_commit_sha: preSha,
      post_completion_commit_sha: postSha,
      deploy_url: deployUrl,
    })
    .eq("id", orderId)
    .neq("status", "done")
    .select()
    .maybeSingle();

  if (!updated) {
    // Race: another /complete call landed between our SELECT and UPDATE.
    // Treat as success — the work IS done.
    return NextResponse.json({ ok: true, noop: true, reason: "race_lost" });
  }

  await supabase.from("execution_log").insert({
    work_order_id: orderId,
    action: "elon_complete",
    success: true,
    commit_sha: postSha,
    deploy_url: deployUrl,
    raw_output: JSON.stringify({ pre: preSha, post: postSha }),
  });

  return NextResponse.json({ ok: true });
}
