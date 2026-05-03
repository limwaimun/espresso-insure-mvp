import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { dispatchOrderToElon } from "@/lib/brain/elon";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

function html(title: string, body: string, accent = "#222") {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:60px auto;padding:24px;color:${accent};line-height:1.5}h1{font-size:22px;margin-bottom:16px}.code{font-family:ui-monospace,Menlo,monospace;background:#f3f3f3;padding:2px 6px;border-radius:4px;font-size:13px}</style>
</head><body><h1>${title}</h1>${body}</body></html>`;
}

function htmlResponse(status: number, title: string, body: string, accent?: string) {
  return new NextResponse(html(title, body, accent), {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");
  const action = url.searchParams.get("action");

  if (!id || !token || !action) return htmlResponse(400, "Invalid link", "<p>Missing parameters.</p>", "#a00");
  if (action !== "approve" && action !== "reject")
    return htmlResponse(400, "Invalid action", "<p>Unknown action.</p>", "#a00");

  const { data: order, error } = await supabase
    .from("work_orders")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !order) return htmlResponse(404, "Not found", "<p>Order not found.</p>", "#a00");
  if (order.approval_token !== token)
    return htmlResponse(403, "Invalid token", "<p>Token mismatch.</p>", "#a00");
  if (order.status !== "proposed")
    return htmlResponse(
      200,
      "Already actioned",
      `<p>Order is currently <span class="code">${order.status}</span>. No change made.</p>`
    );

  if (action === "reject") {
    await supabase
      .from("work_orders")
      .update({
        status: "rejected",
        approved_by: "wayne",
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);
    await supabase.from("execution_log").insert({
      work_order_id: id,
      action: "approve_link",
      success: true,
      raw_output: "rejected by wayne",
    });
    return htmlResponse(200, "Rejected ❌", `<p><b>${order.title}</b> won't be built.</p>`);
  }

  await supabase
    .from("work_orders")
    .update({
      status: "approved",
      approved_by: "wayne",
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  const dispatched = await dispatchOrderToElon(supabase, id);

  await supabase.from("execution_log").insert({
    work_order_id: id,
    action: "approve_link",
    success: dispatched.ok,
    error_message: dispatched.error,
    raw_output: dispatched.ok ? "approved + dispatched to elon" : "approved but dispatch failed",
  });

  const body = dispatched.ok
    ? `<p><b>${order.title}</b> approved and sent to Elon. Send him "GO" when ready.</p>`
    : `<p><b>${order.title}</b> approved, but dispatch to Elon failed: <span class="code">${dispatched.error}</span></p>`;
  return htmlResponse(200, "Approved ✅", body);
}
