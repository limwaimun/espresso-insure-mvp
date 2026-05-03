import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { loadVision, loadWorkstreams } from "@/lib/brain/vision";
import { dispatchOrderToElon, notifyWayneForApproval } from "@/lib/brain/elon";
import { nextWorkstream } from "@/lib/brain/rotation";
import { createBrainQuestion, recentAnsweredQuestions } from "@/lib/brain/questions";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const BRAIN_MODEL = "claude-opus-4-7";

// Auto-approve lane: low risk + observability-only categories.
const AUTO_APPROVE_CATEGORIES = new Set(["copy", "observability", "security_observability"]);

function buildSystemPrompt(visionText: string, workstreamsText: string, activeWorkstream: string): string {
  return `You are the Brain agent for Espresso (espresso.insure), an AI back-office platform for Independent Financial Advisers (IFAs) in Singapore.

You are the sole decision-maker. You do NOT write code. You decide WHAT should be done. The executor (Elon) does the building. Wayne (the founder) approves anything substantial. Verifier confirms post-deploy.

# Vision, Mission, Objectives — your north star
${visionText}

# Workstreams
${workstreamsText}

# This tick's focus: ${activeWorkstream}
Workstreams rotate evenly. This tick is ${activeWorkstream}'s turn. Propose work for this workstream only. If nothing is pressing for ${activeWorkstream} this tick, return [] — the next tick will rotate to the next workstream.

# Stack
Next.js (Vercel), Supabase, Stripe, Resend, Anthropic.

# How to think
1. Read system_state. Notice what's actually happening — errors, traffic, urgent flags.
2. Read recent_orders. What did we already try? What's pending?
3. Read recent_answered_questions to honor your past clarifications from Wayne.
4. Compare current state to vision objectives within ${activeWorkstream}.
5. Propose 0–3 work orders OR ONE question if you genuinely don't know what to do.
6. Quality over quantity. If nothing is worth doing, return [].

# Hard constraints
1. MAS-supervised. Anything touching policies, holdings, claims, billing, PII, or auth MUST be risk_level='high'. Never propose this as 'low'.
2. Verify behavior against code before describing features.
3. Small, reversible changes. One order = one focused change.
4. Cap output at 3 work orders.
5. Every order needs a Verifier-checkable verification step.
6. Token-drain protection: if you see security risk to Anthropic spend (exposed agent endpoints, missing rate limits), propose security_observability work (logging/metrics, low risk) OR security work (real mitigations, high risk).
7. If you have a clarifying question that would change your decision, ASK it instead of guessing.

# Risk scoring
- low: copy, log additions, dependency bumps with no API changes, dev-only tooling
- medium: new internal routes, agent prompt changes, non-critical UI additions, dashboards
- high: anything in policies/holdings/claims/billing/auth, schema migrations, rate limits, anything writing to client-facing data

# Categories
copy | observability | security_observability | feature | security | bug | infra | data

Auto-approval lane (no human gate): risk_level='low' AND category in ['copy','observability','security_observability'].

# Output format — choose ONE of these two top-level shapes
Either an array of work orders:
[
  {
    "title": "short imperative",
    "intent": "one sentence on the user-visible or system-visible outcome",
    "rationale": "2-4 sentences. Cite specific state data or vision objective.",
    "workstream": "${activeWorkstream}",
    "files_to_change": ["app/..."],
    "risk_level": "low" | "medium" | "high",
    "category": "copy" | "observability" | "security_observability" | "feature" | "security" | "bug" | "infra" | "data",
    "spec": {
      "steps": ["concrete step 1", "concrete step 2"],
      "verification": "how the Verifier confirms this worked"
    }
  }
]

Or a SINGLE question wrapped like this when you genuinely need clarification:
{ "question": "<text>", "options": ["option A", "option B", "option C"], "context": "<why you're asking>" }

Empty array [] is valid and preferred over churn.

JSON only. No prose, no fences.`;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const startedAt = Date.now();

  try {
    const visionText = loadVision();
    const workstreamsText = loadWorkstreams();
    const { workstream: activeWorkstream, tick_count } = await nextWorkstream(supabase);

    const { data: stateRows } = await supabase
      .from("system_state")
      .select("captured_at, snapshot_type, source, data, notes, urgent")
      .order("urgent", { ascending: false })
      .order("captured_at", { ascending: false })
      .limit(20);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
    const { data: recentOrders } = await supabase
      .from("work_orders")
      .select("id, title, intent, status, risk_level, category, workstream, created_at, completed_at, verified_at")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(50);

    const recentAnswers = await recentAnsweredQuestions(supabase, 20);

    const userMessage = [
      `# Active workstream this tick: ${activeWorkstream} (tick #${tick_count})`,
      "",
      "# system_state (urgent first, then most recent)",
      "```json",
      JSON.stringify(stateRows ?? [], null, 2),
      "```",
      "",
      "# recent_orders (last 30 days)",
      "```json",
      JSON.stringify(recentOrders ?? [], null, 2),
      "```",
      "",
      "# recent_answered_questions (Wayne's past clarifications — honor these)",
      "```json",
      JSON.stringify(recentAnswers, null, 2),
      "```",
      "",
      "Decide what to do. JSON only.",
    ].join("\n");

    const response = await anthropic.messages.create({
      model: BRAIN_MODEL,
      max_tokens: 4096,
      system: buildSystemPrompt(visionText, workstreamsText, activeWorkstream),
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e: any) {
      await supabase.from("execution_log").insert({
        action: "brain_tick_parse_fail",
        success: false,
        error_message: `parse failed: ${e.message}`,
        raw_output: text.slice(0, 5000),
      });
      return NextResponse.json(
        { ok: false, error: "brain output unparseable", raw: text.slice(0, 500) },
        { status: 500 }
      );
    }

    // Question shape detection — single object with question + options.
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      typeof parsed.question === "string" &&
      Array.isArray(parsed.options)
    ) {
      const r = await createBrainQuestion(supabase, {
        question: parsed.question,
        options: parsed.options,
        context: parsed.context,
      });
      await supabase.from("execution_log").insert({
        action: "brain_tick",
        success: true,
        raw_output: JSON.stringify({
          duration_ms: Date.now() - startedAt,
          workstream: activeWorkstream,
          tick: tick_count,
          asked_question: r.id,
        }),
      });
      return NextResponse.json({
        ok: true,
        workstream: activeWorkstream,
        asked_question: r.id,
      });
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ ok: false, error: "brain output not array or question" }, { status: 500 });
    }

    const orders = parsed;
    const inserted: any[] = [];
    let dispatchedCount = 0;
    let notifiedCount = 0;

    for (const order of orders) {
      if (!order?.title || !order?.intent || !order?.risk_level || !order?.category) continue;

      const autoApprove =
        order.risk_level === "low" && AUTO_APPROVE_CATEGORIES.has(order.category);

      const { data, error } = await supabase
        .from("work_orders")
        .insert({
          title: String(order.title).slice(0, 500),
          intent: String(order.intent).slice(0, 2000),
          rationale: order.rationale ? String(order.rationale).slice(0, 4000) : null,
          workstream: order.workstream ?? activeWorkstream,
          files_to_change: Array.isArray(order.files_to_change) ? order.files_to_change : [],
          risk_level: order.risk_level,
          category: order.category,
          status: autoApprove ? "approved" : "proposed",
          auto_approved: autoApprove,
          approved_by: autoApprove ? "auto" : null,
          approved_at: autoApprove ? new Date().toISOString() : null,
          model_version: BRAIN_MODEL,
          raw_response: order,
          spec: order.spec ?? null,
        })
        .select()
        .single();

      if (error || !data) continue;
      inserted.push(data);

      if (autoApprove) {
        const r = await dispatchOrderToElon(supabase, data.id);
        if (r.ok) dispatchedCount++;
      } else {
        const r = await notifyWayneForApproval(supabase, data.id);
        if (r.ok) notifiedCount++;
      }
    }

    await supabase.from("execution_log").insert({
      action: "brain_tick",
      success: true,
      raw_output: JSON.stringify({
        duration_ms: Date.now() - startedAt,
        workstream: activeWorkstream,
        tick: tick_count,
        orders_returned: orders.length,
        orders_inserted: inserted.length,
        auto_dispatched: dispatchedCount,
        notified: notifiedCount,
      }),
    });

    return NextResponse.json({
      ok: true,
      duration_ms: Date.now() - startedAt,
      workstream: activeWorkstream,
      tick: tick_count,
      inserted: inserted.length,
      dispatched: dispatchedCount,
      notified: notifiedCount,
    });
  } catch (err: any) {
    console.error("brain_tick error:", err);
    await supabase
      .from("execution_log")
      .insert({ action: "brain_tick", success: false, error_message: err?.message ?? "unknown" })
      .then(() => {})
      .catch(() => {});
    return NextResponse.json({ ok: false, error: err?.message ?? "unknown" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
