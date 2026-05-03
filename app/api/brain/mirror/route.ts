import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { probeSecurity } from "@/lib/brain/security";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const TRACKED_TABLES = [
  "profiles",
  "clients",
  "policies",
  "holdings",
  "conversations",
  "messages",
  "alerts",
];

async function probeBusinessMetrics() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result: Record<string, any> = {};
  for (const table of TRACKED_TABLES) {
    try {
      const { count: total, error: e1 } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (e1) {
        result[table] = { error: e1.message };
        continue;
      }
      const { count: recent, error: e2 } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .gte("created_at", since);
      result[table] = {
        total: total ?? 0,
        last_24h: e2 ? null : recent ?? 0,
        last_24h_error: e2?.message,
      };
    } catch (e: any) {
      result[table] = { error: e?.message ?? "probe failed" };
    }
  }
  return result;
}

async function probeWorkflowState() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const { data: orders, error } = await supabase
    .from("work_orders")
    .select("status, risk_level, category, workstream, created_at")
    .gte("created_at", sevenDaysAgo);
  if (error) return { error: error.message };
  if (!orders) return { total_last_7d: 0 };

  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byRisk: Record<string, number> = {};
  const byWorkstream: Record<string, number> = {};
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    byCategory[o.category] = (byCategory[o.category] ?? 0) + 1;
    byRisk[o.risk_level] = (byRisk[o.risk_level] ?? 0) + 1;
    if (o.workstream) byWorkstream[o.workstream] = (byWorkstream[o.workstream] ?? 0) + 1;
  }
  return {
    total_last_7d: orders.length,
    by_status: byStatus,
    by_category: byCategory,
    by_risk: byRisk,
    by_workstream: byWorkstream,
    pending_proposed: byStatus["proposed"] ?? 0,
  };
}

async function probeRecentExecutions() {
  const oneDayAgo = new Date(Date.now() - 86400 * 1000).toISOString();
  const { data: logs, error } = await supabase
    .from("execution_log")
    .select("action, success, created_at, error_message")
    .gte("created_at", oneDayAgo);
  if (error) return { error: error.message };
  if (!logs) return { total_last_24h: 0 };

  const byAction: Record<string, { ok: number; fail: number }> = {};
  const failures: Array<{ action: string; error: string | null }> = [];
  for (const l of logs) {
    if (!byAction[l.action]) byAction[l.action] = { ok: 0, fail: 0 };
    if (l.success) byAction[l.action].ok++;
    else {
      byAction[l.action].fail++;
      if (l.error_message) failures.push({ action: l.action, error: l.error_message });
    }
  }
  return {
    total_last_24h: logs.length,
    by_action: byAction,
    recent_failures: failures.slice(0, 10),
  };
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const startedAt = Date.now();

  let business: any, workflow: any, executions: any, security: any;
  try {
    business = await probeBusinessMetrics();
    workflow = await probeWorkflowState();
    executions = await probeRecentExecutions();
    security = await probeSecurity(supabase);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "probe error" }, { status: 500 });
  }

  const inserts = [
    { snapshot_type: "business", source: "mirror.business", data: business, urgent: false },
    { snapshot_type: "metrics", source: "mirror.workflow", data: workflow, urgent: false },
    { snapshot_type: "metrics", source: "mirror.executions", data: executions, urgent: false },
    {
      snapshot_type: "security",
      source: "mirror.security",
      data: security.findings,
      urgent: !!security.urgent,
    },
  ];

  const { error } = await supabase.from("system_state").insert(inserts);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  await supabase.from("execution_log").insert({
    action: "mirror_tick",
    success: true,
    raw_output: JSON.stringify({
      duration_ms: Date.now() - startedAt,
      snapshots_written: inserts.length,
      urgent_security: security.urgent,
    }),
  });

  return NextResponse.json({
    ok: true,
    duration_ms: Date.now() - startedAt,
    snapshots_written: inserts.length,
    probes: { business, workflow, executions, security },
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
