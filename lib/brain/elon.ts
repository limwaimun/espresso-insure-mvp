// Elon bridge + Wayne notifier.

import { sendTelegram, escapeHtml } from "./telegram";

// Builds the Telegram notification sent to Elon when an order is dispatched.
// Kept under Telegram's 4096-char limit by emitting a short ping rather than
// the full order body. The full spec is delivered via polling — laptop reads
// /api/brain/queue, drops the JSON in ~/.openclaw/inbox/brain/, executor
// processes from there. Telegram is purely a heads-up.
//
// Before B70 this function inlined the entire order (operations + verbatim
// file contents) which routinely overflowed 4096 chars and caused
// "Bad Request: message is too long" failures. See execution_log for events
// pre-2026-05-05 ~13:30 UTC.
export function buildElonMessage(order: any): string {
  const files: string[] = Array.isArray(order?.files_to_change) ? order.files_to_change : [];
  const filesPreview = files.length
    ? `\nFiles: ${files.slice(0, 5).join(", ")}${files.length > 5 ? ` (+${files.length - 5} more)` : ""}`
    : "";
  return [
    `🛠️ Order ready: ${order.title}`,
    `Risk: ${order.risk_level} | Category: ${order.category} | Workstream: ${order.workstream ?? "n/a"}` + filesPreview,
    "",
    `ID: ${order.id}`,
    "",
    `Polling will deliver the full spec to ~/.openclaw/inbox/brain/. The executor cron picks it up automatically.`,
  ].join("\n");
}

export function buildApprovalMessage(order: any, baseUrl: string): string {
  const approveUrl = `${baseUrl}/api/brain/approve?id=${order.id}&token=${order.approval_token}&action=approve`;
  const rejectUrl = `${baseUrl}/api/brain/approve?id=${order.id}&token=${order.approval_token}&action=reject`;
  const files: string[] = Array.isArray(order?.files_to_change) ? order.files_to_change : [];

  const lines = [
    `🧠 <b>Brain proposes new work</b> [${escapeHtml(order.workstream ?? "n/a")}]`,
    "",
    `<b>${escapeHtml(order.title)}</b>`,
    `Risk: ${escapeHtml(order.risk_level)} | Category: ${escapeHtml(order.category)}`,
    "",
    `<i>Intent</i>: ${escapeHtml(order.intent)}`,
  ];
  if (order.rationale) lines.push("", `<i>Rationale</i>: ${escapeHtml(order.rationale)}`);
  if (files.length) lines.push("", `<i>Files</i>: ${files.map((f) => escapeHtml(f)).join(", ")}`);
  lines.push(
    "",
    `<a href="${approveUrl}">✅ Approve</a>   |   <a href="${rejectUrl}">❌ Reject</a>`,
    "",
    `<code>${escapeHtml(order.id)}</code>`
  );
  return lines.join("\n");
}

export async function dispatchOrderToElon(
  supabase: any,
  orderId: string
): Promise<{ ok: boolean; error?: string }> {
  const { data: order, error } = await supabase
    .from("work_orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (error || !order) return { ok: false, error: error?.message ?? "order not found" };
  if (order.status !== "approved") {
    return { ok: false, error: `status is ${order.status}, expected approved` };
  }

  const message = buildElonMessage(order);
  const result = await sendTelegram(process.env.TELEGRAM_ELON_CHAT_ID, message);

  await supabase
    .from("work_orders")
    .update({
      status: "dispatched",
      dispatched_at: new Date().toISOString(),
      elon_dispatch_message: message,
    })
    .eq("id", orderId);

  await supabase.from("execution_log").insert({
    work_order_id: orderId,
    action: "dispatch_to_elon",
    success: result.ok,
    error_message: result.error,
    raw_output: result.ok ? `telegram message_id: ${result.message_id}` : null,
  });

  return result;
}

export async function notifyWayneForApproval(
  supabase: any,
  orderId: string
): Promise<{ ok: boolean; error?: string }> {
  const { data: order, error } = await supabase
    .from("work_orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (error || !order) return { ok: false, error: error?.message ?? "order not found" };

  const baseUrl = process.env.BRAIN_BASE_URL ?? "https://espresso-mvp.vercel.app";
  const message = buildApprovalMessage(order, baseUrl);
  const result = await sendTelegram(process.env.TELEGRAM_WAYNE_CHAT_ID, message, {
    parse_mode: "HTML",
  });

  await supabase
    .from("work_orders")
    .update({ approval_notified_at: new Date().toISOString() })
    .eq("id", orderId);

  await supabase.from("execution_log").insert({
    work_order_id: orderId,
    action: "notify_wayne",
    success: result.ok,
    error_message: result.error,
  });

  return result;
}
