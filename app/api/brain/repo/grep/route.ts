import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO = process.env.GITHUB_REPO ?? "";
const TOKEN = process.env.GITHUB_TOKEN ?? "";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET ?? "";
  if (!expected || auth !== `Bearer ${expected}`) return unauthorized();

  if (!REPO || !TOKEN) {
    return NextResponse.json({ ok: false, error: "GITHUB_REPO or GITHUB_TOKEN not configured" }, { status: 500 });
  }

  const url = new URL(req.url);
  const pattern = url.searchParams.get("pattern") ?? "";
  const pathFilter = url.searchParams.get("path") ?? "";
  if (!pattern) return NextResponse.json({ ok: false, error: "pattern required" }, { status: 400 });

  let q = `${pattern} repo:${REPO}`;
  if (pathFilter) q += ` path:${pathFilter}`;

  const ghUrl = `https://api.github.com/search/code?q=${encodeURIComponent(q)}&per_page=20`;

  try {
    const res = await fetch(ghUrl, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    const body = await res.json();

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: body?.message ?? "github error", status: res.status }, { status: res.status });
    }

    const matches = (body.items ?? []).map((m: any) => ({
      path: m.path,
      sha: m.sha,
      url: m.html_url,
      score: m.score,
    }));

    return NextResponse.json({
      ok: true,
      pattern,
      path_filter: pathFilter || null,
      total_count: body.total_count ?? matches.length,
      returned: matches.length,
      matches,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "fetch failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
