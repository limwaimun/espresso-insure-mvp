import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO = process.env.GITHUB_REPO ?? "";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
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
  const path = (url.searchParams.get("path") ?? "").replace(/^\/+|\/+$/g, "");

  const ghUrl = `https://api.github.com/repos/${REPO}/contents/${encodeURI(path)}?ref=${encodeURIComponent(BRANCH)}`;

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

    if (!Array.isArray(body)) {
      return NextResponse.json({ ok: false, error: "path is not a directory", path }, { status: 400 });
    }

    const entries = body.map((e: any) => ({
      name: e.name,
      type: e.type,
      path: e.path,
      size: e.size ?? null,
    }));

    return NextResponse.json({ ok: true, path, count: entries.length, entries });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "fetch failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
