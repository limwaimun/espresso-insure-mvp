// Security probe for the Mirror. Watches for token-drain patterns and auth anomalies.
// Best-effort: queries are tolerant of missing tables/columns.

export async function probeSecurity(supabase: any) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const findings: Record<string, any> = {};
  let urgent = false;

  // 1. Agent-route invocation rate from execution_log (a proxy until app-level metrics exist).
  try {
    const { data: agentLogs } = await supabase
      .from("execution_log")
      .select("action, success, created_at")
      .gte("created_at", oneHourAgo)
      .like("action", "%agent%");

    const total = agentLogs?.length ?? 0;
    findings.agent_invocations_last_1h = total;

    // Heuristic: >500 agent invocations in an hour is worth flagging until you have a real baseline.
    // Tune this based on actual traffic.
    if (total > 500) {
      urgent = true;
      findings.agent_invocation_alert = `Spike: ${total} agent invocations in last 1h`;
    }
  } catch (e: any) {
    findings.agent_invocations_error = e?.message ?? "probe failed";
  }

  // 2. Failure rate on execution_log (could indicate auth attacks).
  try {
    const { data: recentLogs } = await supabase
      .from("execution_log")
      .select("success")
      .gte("created_at", oneHourAgo);

    if (recentLogs && recentLogs.length > 0) {
      const failures = recentLogs.filter((l: any) => l.success === false).length;
      const failRate = failures / recentLogs.length;
      findings.execution_log_fail_rate_1h = Number(failRate.toFixed(3));
      findings.execution_log_total_1h = recentLogs.length;
      if (recentLogs.length >= 20 && failRate > 0.5) {
        urgent = true;
        findings.fail_rate_alert = `High failure rate: ${(failRate * 100).toFixed(0)}% of last hour's logs failed`;
      }
    }
  } catch (e: any) {
    findings.fail_rate_error = e?.message ?? "probe failed";
  }

  // 3. Brain question backlog — if questions go unanswered, Brain may be stuck.
  try {
    const { data: openQs, count } = await supabase
      .from("brain_questions")
      .select("id, created_at", { count: "exact" })
      .eq("status", "open")
      .lte("created_at", oneDayAgo);
    if ((count ?? 0) > 0) {
      findings.stale_open_questions = count;
    }
  } catch {
    // brain_questions table may not exist yet on partial deploys — silent.
  }

  // 4. Recent failed verifications — pattern of failures suggests Elon issues.
  try {
    const { data: failedOrders } = await supabase
      .from("work_orders")
      .select("id, title, last_verification_at")
      .eq("status", "failed")
      .gte("last_verification_at", oneDayAgo);
    if (failedOrders && failedOrders.length >= 3) {
      urgent = true;
      findings.failed_verifications_24h = failedOrders.length;
    }
  } catch {
    // ignore
  }

  return { findings, urgent };
}
