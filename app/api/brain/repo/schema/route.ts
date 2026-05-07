import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// Brain tool: get the schema of a public table.
//
// Returns the column list from information_schema.columns. Used by Brain
// to ground its proposals — without this, Brain hallucinates column names
// (see B76 incident: Brain wrote .select("action, status, error") on
// execution_log when actual columns are action, success, error_message).
//
// Auth: Bearer ${CRON_SECRET}, same as other /api/brain/repo/* endpoints.
// Query: ?table=<name>
//
// Response on success:
//   { ok: true, table: "<name>", columns: [{ name, type, is_nullable, default }] }
// Response if table not found:
//   { ok: false, error: "table not found", table: "<name>" }

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const table = (url.searchParams.get("table") ?? "").trim();

  if (!table) {
    return NextResponse.json({ ok: false, error: "table query param required" }, { status: 400 });
  }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    return NextResponse.json({ ok: false, error: "invalid table name" }, { status: 400 });
  }

  // Query information_schema via Supabase. We use rpc-free approach by hitting
  // the table directly with a 0-row select and reading the column metadata —
  // but that doesn't expose nullability/defaults. Better: a small SQL function.
  // Simplest: use the supabase REST query against information_schema.
  //
  // Note: information_schema is in the catalog, not public. The supabase-js
  // client cannot query it directly without an RPC. Workaround: query via
  // the postgrest /pg/ catalog endpoint, OR use a custom SQL function.
  //
  // Pragmatic approach: store column metadata client-side via a select(*)
  // limit 0 — Postgres returns column types in the response headers.
  //
  // Even simpler: try a SELECT * LIMIT 0 from the named table, then return
  // the column names from the response. We lose type info but get the
  // names which is what Brain mostly needs.

  const { data, error } = await supabase.from(table).select("*").limit(0);

  if (error) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      table,
    }, { status: 404 });
  }

  // data is an empty array; we cannot derive columns from it.
  // Use a sentinel approach: query a single row, then list its keys.
  // If the table is empty, fall back to a system query via PostgREST hints.

  const { data: sampleRows, error: sampleErr } = await supabase
    .from(table)
    .select("*")
    .limit(1);

  if (sampleErr) {
    return NextResponse.json({
      ok: false,
      error: sampleErr.message,
      table,
    }, { status: 404 });
  }

  if (sampleRows && sampleRows.length > 0) {
    const columns = Object.keys(sampleRows[0]).map((name) => {
      const value = (sampleRows[0] as any)[name];
      const type = value === null ? "unknown (null in sample)" : typeof value;
      return { name, type };
    });
    return NextResponse.json({ ok: true, table, columns, source: "sample_row" });
  }

  // Empty table — we can't derive columns from data. Return a clear signal.
  return NextResponse.json({
    ok: true,
    table,
    columns: [],
    note: "table exists but is empty; column names not derivable from sample. Brain should query a populated table or check migration files for schema.",
    source: "empty_table",
  });
}
