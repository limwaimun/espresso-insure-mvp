import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  readDeployedFile,
  judgeWithClaude,
  notifyVerificationResult,
  VerificationResult,
} from "@/lib/brain/verifier";

export const runtime = "nodejs";
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const SETTLE_MS = 30 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;
const MAX_PER_TICK = 5;

async function verifyOne(order: any) {
  const files: string[] = Array.isArray(order.files_to_change) ? order.files_to_change : [];
  const dispatchedAt = order.dispatched_at ? new Date(order.dispatched_at).getTime() : 0;
  const ageMs = Date.now() - dispatchedAt;

  if (files.length === 0) {
    const result: VerificationResult = {
      verified: false,
      confidence: "low",
      reasoning: "Work order had no files_to_change. Cannot verify statically.",
      issues: ["files_to_change is empty"],
    };
    return { decision: "fail" as const, result, snapshots: [] };
  }

  const snapshots = files.map(readDeployedFile);
  const allMissing = snapshots.every((s) => !s.exists);
  const anyModifiedAfterDispatch = snapshots.some(
    (s) => s.mtime_iso && new Date(s.mtime_iso).getTime() > dispatchedAt
  );

  if (allMissing && ageMs < STALE_MS) {
    return { decision: "defer" as const, snapshots };
  }
  if (!anyModifiedAfterDispatch && !allMissing && ageMs < STALE_MS) {
    return { decision: "defer" as const, snapshots };
  }

  const result = await judgeWithClaude(order, snapshots);
  return { decision: result.verified ? ("pass" as const) : ("fail" as const), result, snapshots };
}

async function persistResult(orderId: string, result: VerificationResult, passed: boolean) {
  const now = new Date().toISOString();
  await supabase
    .from("work_orders")
    .update({
      status: passed ? "verified" : "failed",
      verified_at: passed ? now : null,
      verification_result: result as any,
      last_verification_at: now,
    })
    .eq("id", orderId);
  await supabase.from("execution_log").insert({
    work_order_id: orderId,
    action: "verify",
    success: passed,
    error_message: passed ? null : result.issues.join("; ").slice(0, 1000),
    raw_output: JSON.stringify(result).slice(0, 5000),
  });
}

async function bumpAttempt(orderId: string) {
  const { data } = await supabase
    .from("work_orders")
    .select("verification_attempts")
    .eq("id", orderId)
    .single();
  const next = (data?.verification_attempts ?? 0) + 1;
  await supabase
    .from("work_orders")
    .update({ verification_attempts: next, last_verification_at: new Date().toISOString() })
    .eq("id", orderId);
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const singleId = url.searchParams.get("id");

  let query = supabase
    .from("work_orders")
    .select("*")
    .eq("status", "dispatched")
    .order("dispatched_at", { ascending: true })
    .limit(MAX_PER_TICK);

  if (singleId) {
    query = supabase.from("work_orders").select("*").eq("id", singleId).limit(1) as any;
  }

  const { data: orders, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!orders || orders.length === 0)
    return NextResponse.json({ ok: true, processed: 0, note: "no eligible orders" });

  const summary: any[] = [];
  for (const order of orders) {
    const dispatchedAt = order.dispatched_at ? new Date(order.dispatched_at).getTime() : 0;
    if (!singleId && dispatchedAt && Date.now() - dispatchedAt < SETTLE_MS) {
      summary.push({ id: order.id, decision: "skip_settling" });
      continue;
    }
    try {
      const { decision, result } = await verifyOne(order);
      if (decision === "defer") {
        await bumpAttempt(order.id);
        summary.push({ id: order.id, decision: "defer" });
        continue;
      }
      if (result) {
        await persistResult(order.id, result, decision === "pass");
        await notifyVerificationResult(order, result);
        summary.push({
          id: order.id,
          decision,
          confidence: result.confidence,
          issues: result.issues.length,
        });
      }
    } catch (e: any) {
      await supabase.from("execution_log").insert({
        work_order_id: order.id,
        action: "verify_error",
        success: false,
        error_message: e?.message ?? "verifier crashed",
      });
      summary.push({ id: order.id, decision: "error", error: e?.message });
    }
  }

  return NextResponse.json({ ok: true, processed: orders.length, summary });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
