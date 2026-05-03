import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegram } from "@/lib/brain/telegram";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const ELON_PREAMBLE =
  "🛑 DO NOT check files, list dirs, or run commands. Reply 'Ready' and wait silently. Act only when I send 'GO'.\n\n";

function html(title: string, body: string, accent = "#222") {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:60px auto;padding:24px;color:${accent};line-height:1.5}h1{font-size:22px}.code{font-family:ui-monospace,Menlo,monospace;background:#f3f3f3;padding:2px 6px;border-radius:4px;font-size:13px}.warn{background:#fff7e0;border-left:3px solid #d99e00;padding:12px 16px;margin:16px 0}</style>
</head><body><h1>${title}</h1>${body}</body></html>`;
}

function htmlResponse(status: number, title: string, body: string, accent?: string) {
  return new NextResponse(html(title, body, accent), {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function buildRevertElonMessage(originalOrder: any, revertOrderId: string): string {
  return [
    ELON_PREAMBLE,
    `Task: REVERT order ${originalOrder.id}`,
    "",
    `Original title: ${originalOrder.title}`,
    `Pre-change commit: ${originalOrder.pre_dispatch_commit_sha}`,
    `Post-change commit: ${originalOrder.post_completion_commit_sha ?? "(unknown)"}`,
    "",
    "Steps:",
    `STEP 1: git revert --no-edit ${originalOrder.post_completion_commit_sha ?? originalOrder.pre_dispatch_commit_sha}`,
    "STEP 2: git push origin main",
    "STEP 3: vercel --prod",
    "",
    "AFTER deploy: POST to /api/brain/complete with the revert order ID and new commit shas.",
    `Revert Order ID: ${revertOrderId}`,
  ].join("\n");
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");
  if (!id || !token) return htmlResponse(400, "Invalid link", "<p>Missing parameters.</p>", "#a00");

  const { data: order, error } = await supabase
    .from("work_orders")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !order) return htmlResponse(404, "Not found", "<p>Order not found.</p>", "#a00");
  if (order.approval_token !== token)
    return htmlResponse(403, "Invalid token", "<p>Token mismatch.</p>", "#a00");
  if (!order.pre_dispatch_commit_sha)
    return htmlResponse(
      400,
      "Cannot revert",
      "<p>This order has no recorded pre-change commit. Elon never reported completion. Manual git revert required.</p>",
      "#a00"
    );

  // Warn if migration involved.
  let warning = "";
  if (order.category === "data" || order.spec?.steps?.some?.((s: string) => /migration/i.test(s))) {
    warning = `<div class="warn"><b>⚠️ Database migration may be involved.</b> Reverting code will NOT reverse SQL changes. Review before continuing.</div>`;
  }

  // Create a revert work order.
  const { data: revertOrder, error: insertErr } = await supabase
    .from("work_orders")
    .insert({
      title: `REVERT: ${order.title}`,
      intent: `Revert the changes made by order ${order.id}`,
      rationale: `Wayne triggered revert via Telegram link. Original verification: ${JSON.stringify(order.verification_result ?? {}).slice(0, 500)}`,
      workstream: order.workstream,
      files_to_change: order.files_to_change,
      risk_level: "medium",
      category: "infra",
      status: "approved",
      auto_approved: false,
      approved_by: "wayne_revert_link",
      approved_at: new Date().toISOString(),
      reverts_order_id: order.id,
      spec: {
        steps: [
          `git revert --no-edit ${order.post_completion_commit_sha ?? order.pre_dispatch_commit_sha}`,
          "git push origin main",
          "vercel --prod",
        ],
        verification: "Confirm post-revert deployment matches pre-dispatch commit state.",
      },
    })
    .select()
    .single();

  if (insertErr || !revertOrder) {
    return htmlResponse(
      500,
      "Revert failed",
      `<p>Could not create revert order: <span class="code">${insertErr?.message ?? "unknown"}</span></p>`,
      "#a00"
    );
  }

  // Mark original as reverted.
  await supabase
    .from("work_orders")
    .update({ status: "reverted", reverted_at: new Date().toISOString() })
    .eq("id", order.id);

  // Dispatch revert to Elon via Telegram.
  const message = buildRevertElonMessage(order, revertOrder.id);
  const sendResult = await sendTelegram(process.env.TELEGRAM_ELON_CHAT_ID, message);

  await supabase
    .from("work_orders")
    .update({
      status: "dispatched",
      dispatched_at: new Date().toISOString(),
      elon_dispatch_message: message,
    })
    .eq("id", revertOrder.id);

  await supabase.from("execution_log").insert({
    work_order_id: revertOrder.id,
    action: "revert_dispatched",
    success: sendResult.ok,
    error_message: sendResult.error,
    raw_output: `reverts ${order.id}`,
  });

  return htmlResponse(
    200,
    "Revert dispatched ↩️",
    `${warning}<p>Revert order created and sent to Elon. Send him "GO" when ready.</p><p>Original order: <span class="code">${order.id}</span><br>Revert order: <span class="code">${revertOrder.id}</span></p>`
  );
}
