import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminUser } from "@/lib/admin";
import { sendTelegram } from "@/lib/brain/telegram";

export const runtime = "nodejs";

const COMMIT_LOOKBACK_HOURS = 48;
const REPO = "limwaimun/espresso-insure-mvp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

type GhCommit = {
  sha: string;
  commit: { message: string; committer: { date: string } };
};

function parseBrainCommitTitle(message: string): string | null {
  const firstLine = message.split("\n")[0].trim();
  const m = firstLine.match(/^\[brain\]\s+(.+)$/);
  return m ? m[1].trim() : null;
}

async function fetchBrainCommits(): Promise<
  { sha: string; title: string; committedAt: string }[]
> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const since = new Date(Date.now() - COMMIT_LOOKBACK_HOURS * 3600 * 1000).toISOString();
  const url = `https://api.github.com/repos/${REPO}/commits?sha=main&since=${encodeURIComponent(since)}&per_page=100`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data: GhCommit[] = await res.json();

  return data
    .map((c) => ({
      sha: c.sha,
      title: parseBrainCommitTitle(c.commit.message),
      committedAt: c.commit.committer.date,
    }))
    .filter((c): c is { sha: string; title: string; committedAt: string } => !!c.title);
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const orderId = String(body?.order_id ?? "").trim();
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "order_id required" }, { status: 400 });
  }

  const { data: order, error } = await supabase
    .from("work_orders")
    .select("id, title, status, created_at, elon_dispatch_message")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ ok: false, error: "order not found" }, { status: 404 });
  }

  if (order.status !== "failed" && order.status !== "blocked") {
    return NextResponse.json(
      { ok: false, error: `order status is '${order.status}', cannot redispatch` },
      { status: 400 }
    );
  }

  // Safety: check if a commit matching this title shipped after the order was created.
  // If so, the order ACTUALLY shipped — reconcile to 'done' instead of redispatching.
  let commits: { sha: string; title: string; committedAt: string }[] = [];
  try {
    commits = await fetchBrainCommits();
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: `GitHub fetch failed: ${e?.message ?? "unknown"}` },
      { status: 502 }
    );
  }

  const orderCreatedAt = new Date(order.created_at).getTime();
  const matchingCommit = commits.find(
    (c) =>
      c.title.trim() === order.title.trim() &&
      new Date(c.committedAt).getTime() > orderCreatedAt
  );

  if (matchingCommit) {
    await supabase
      .from("work_orders")
      .update({
        status: "done",
        post_completion_commit_sha: matchingCommit.sha,
        completed_at: matchingCommit.committedAt,
      })
      .eq("id", orderId);

    await supabase.from("execution_log").insert({
      work_order_id: orderId,
      action: "reconciled_via_redispatch",
      success: true,
      raw_output: `safety-matched commit ${matchingCommit.sha.slice(0, 7)} — order had shipped, marked done`,
    });

    return NextResponse.json({
      ok: true,
      action: "reconciled",
      commit_sha: matchingCommit.sha.slice(0, 7),
      message: "Order had already shipped — marked done instead of redispatched.",
    });
  }

  // No matching commit: flip back to dispatched and re-send the Telegram message.
  await supabase
    .from("work_orders")
    .update({
      status: "dispatched",
      running_at: null,
      dispatched_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  const message = order.elon_dispatch_message
    ? `🔁 RE-FIRED\n\n${order.elon_dispatch_message}`
    : `🔁 RE-FIRED order ${orderId}\n(original dispatch message missing — check the work_orders row directly)`;

  const sendResult = await sendTelegram(process.env.TELEGRAM_ELON_CHAT_ID, message);

  await supabase.from("execution_log").insert({
    work_order_id: orderId,
    action: "redispatched",
    success: sendResult.ok,
    error_message: sendResult.error,
    raw_output: `redispatched by ${user.email ?? "admin"}`,
  });

  return NextResponse.json({
    ok: true,
    action: "redispatched",
    telegram_sent: sendResult.ok,
    message: "Order flipped to dispatched, Elon notified. Next mirror tick will pick it up.",
  });
}
