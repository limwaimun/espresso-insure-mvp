// Elon bridge + Wayne notifier.

import { sendTelegram, escapeHtml } from "./telegram";

export function buildElonMessage(order: any): string {
  const steps: string[] = Array.isArray(order?.spec?.steps) ? order.spec.steps : [];
  const verification: string = order?.spec?.verification ?? "(none specified)";
  const files: string[] = Array.isArray(order?.files_to_change) ? order.files_to_change : [];

  const baseUrl = process.env.BRAIN_BASE_URL ?? "https://espresso-mvp.vercel.app";
  const completeUrl = `${baseUrl}/api/brain/complete`;

  const parts: string[] = [
    `Task: ${order.title}`,
    "",
    `Intent: ${order.intent}`,
  ];
  if (order.rationale) parts.push("", `Rationale: ${order.rationale}`);
  if (files.length) parts.push("", "Files to change:", ...files.map((f) => `- ${f}`));
  if (steps.length)
    parts.push("", "Steps: " + steps.map((s, i) => `STEP ${i + 1}: ${s}`).join(" — "));
  parts.push(
    "",
    `Verification: ${verification}`,
    "",
    `Order ID: ${order.id}`,
    `Risk: ${order.risk_level} | Category: ${order.category} | Workstream: ${order.workstream ?? "n/a"}`,
    "",
    "BEFORE you start: capture current commit sha (`git rev-parse HEAD`).",
    "AFTER deploy: POST to the completion endpoint so the Brain knows you're done:",
    `  POST ${completeUrl}`,
    "  Headers: Authorization: Bearer $CRON_SECRET",
    `  Body JSON: { "order_id": "${order.id}", "pre_dispatch_commit_sha": "<sha BEFORE your changes>", "post_completion_commit_sha": "<sha AFTER your changes>", "deploy_url": "<vercel deploy url>" }`,
    "",
    "Then: vercel --prod && git push origin main"
  );

  return parts.join("\n");
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
