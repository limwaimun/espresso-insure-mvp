import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO = process.env.GITHUB_REPO ?? "";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const TOKEN = process.env.GITHUB_TOKEN ?? "";
const MAX_SIZE = 50_000;

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
  if (!path) return NextResponse.json({ ok: false, error: "path required" }, { status: 400 });

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

    if (Array.isArray(body) || body?.type !== "file") {
      return NextResponse.json({ ok: false, error: "path is not a file", path }, { status: 400 });
    }

    if (body.size > MAX_SIZE) {
      return NextResponse.json({ ok: false, error: `file too large (${body.size} bytes, max ${MAX_SIZE})`, path, size: body.size }, { status: 413 });
    }

    if (body.encoding !== "base64") {
      return NextResponse.json({ ok: false, error: `unexpected encoding: ${body.encoding}` }, { status: 500 });
    }

    const decoded = Buffer.from(body.content, "base64").toString("utf-8");

    return NextResponse.json({
      ok: true,
      path,
      size: body.size,
      sha: body.sha,
      content: decoded,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "fetch failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
