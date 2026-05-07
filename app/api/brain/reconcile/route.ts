import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminUser } from "@/lib/admin";

export const runtime = "nodejs";

const STALE_THRESHOLD_MIN = 60;
const COMMIT_LOOKBACK_HOURS = 48;
const REPO = "limwaimun/espresso-insure-mvp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

type RunningOrder = {
  id: string;
  title: string;
  workstream: string | null;
  running_at: string | null;
  created_at: string;
};

type GhCommit = {
  sha: string;
  commit: { message: string; committer: { date: string } };
};

function parseBrainCommitTitle(message: string): string | null {
  const firstLine = message.split("\n")[0].trim();
  const m = firstLine.match(/^\[brain\]\s+(.+)$/);
  return m ? m[1].trim() : null;
}

async function fetchBrainCommits(): Promise<GhCommit[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not configured in env");

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

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function POST(_req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data: runningRaw, error: runErr } = await supabase
    .from("work_orders")
    .select("id, title, workstream, running_at, created_at")
    .eq("status", "running")
    .order("running_at", { ascending: false });

  if (runErr) {
    return NextResponse.json(
      { error: `Failed to load running orders: ${runErr.message}` },
      { status: 500 }
    );
  }

  const running: RunningOrder[] = (runningRaw ?? []) as RunningOrder[];

  let commits: GhCommit[] = [];
  try {
    commits = await fetchBrainCommits();
  } catch (e: any) {
    return NextResponse.json(
      { error: `GitHub fetch failed: ${e?.message ?? "unknown"}` },
      { status: 502 }
    );
  }

  const brainCommits = commits
    .map((c) => ({
      sha: c.sha,
      title: parseBrainCommitTitle(c.commit.message),
      committedAt: c.commit.committer.date,
    }))
    .filter((c): c is { sha: string; title: string; committedAt: string } => !!c.title)
    .sort(
      (a, b) =>
        new Date(a.committedAt).getTime() - new Date(b.committedAt).getTime()
    );

  // Reconcile: oldest commits first, match to newest-running candidate before that commit
  const matchedIds = new Set<string>();
  const reconciled: { id: string; title: string; sha: string; committedAt: string }[] = [];

  for (const commit of brainCommits) {
    const candidates = running
      .filter((o) => !matchedIds.has(o.id))
      .filter((o) => o.title.trim() === commit.title.trim())
      .filter(
        (o) =>
          o.running_at &&
          new Date(o.running_at).getTime() <
            new Date(commit.committedAt).getTime()
      )
      .sort(
        (a, b) =>
          new Date(b.running_at!).getTime() -
          new Date(a.running_at!).getTime()
      );

    if (candidates.length === 0) continue;

    const winner = candidates[0];
    matchedIds.add(winner.id);

    const { error: updErr } = await supabase
      .from("work_orders")
      .update({
        status: "done",
        post_completion_commit_sha: commit.sha,
        completed_at: commit.committedAt,
      })
      .eq("id", winner.id);

    if (updErr) {
      console.error(`reconcile: update failed for ${winner.id}: ${updErr.message}`);
      continue;
    }

    reconciled.push({
      id: winner.id,
      title: winner.title,
      sha: commit.sha.slice(0, 7),
      committedAt: commit.committedAt,
    });

    await supabase.from("execution_log").insert({
      work_order_id: winner.id,
      action: "reconciled",
      success: true,
      raw_output: `matched commit ${commit.sha.slice(0, 7)}`,
    });
  }

  // Sweep: still-running orders with running_at older than threshold
  const cutoffMs = Date.now() - STALE_THRESHOLD_MIN * 60 * 1000;
  const stale = running.filter(
    (o) =>
      !matchedIds.has(o.id) &&
      o.running_at &&
      new Date(o.running_at).getTime() < cutoffMs
  );

  const swept: { id: string; title: string; minutesStale: number }[] = [];
  for (const o of stale) {
    const minutesStale = Math.round(
      (Date.now() - new Date(o.running_at!).getTime()) / 60000
    );
    const { error: sweepErr } = await supabase
      .from("work_orders")
      .update({ status: "failed" })
      .eq("id", o.id);

    if (sweepErr) {
      console.error(`sweep: update failed for ${o.id}: ${sweepErr.message}`);
      continue;
    }

    swept.push({ id: o.id, title: o.title, minutesStale });

    await supabase.from("execution_log").insert({
      work_order_id: o.id,
      action: "stale_running_swept",
      success: true,
      raw_output: `running ${minutesStale}m, no matching commit in last ${COMMIT_LOOKBACK_HOURS}h`,
    });
  }

  const sweptIds = new Set(swept.map((s) => s.id));
  const untouched = running.filter(
    (o) => !matchedIds.has(o.id) && !sweptIds.has(o.id)
  );

  return NextResponse.json({
    reconciled,
    swept,
    untouched: untouched.map((o) => ({ id: o.id, title: o.title })),
    summary: {
      reconciled_count: reconciled.length,
      swept_count: swept.length,
      untouched_count: untouched.length,
      total_running_at_start: running.length,
    },
  });
}
